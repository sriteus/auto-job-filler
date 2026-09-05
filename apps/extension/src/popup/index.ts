/**
 * Popup Script for Chrome Extension
 * Handles UI interactions in the extension popup
 */

import browser from 'webextension-polyfill';
import type { ScannedField, FillPlan, CandidateProfile } from '@ai-job-agent/shared';
import { DEFAULT_CANDIDATE_PROFILE } from '@ai-job-agent/shared';
import { defaultMapper } from '../mapper';
import { loadSessionProfile, signInAndLoadProfile, supabaseConfigured } from '../auth/supabase';

// DOM Elements
const statusIndicator = document.getElementById('statusIndicator') as HTMLDivElement;
const statusText = document.getElementById('statusText') as HTMLSpanElement;
const scanBtn = document.getElementById('scanBtn') as HTMLButtonElement;
const fillBtn = document.getElementById('fillBtn') as HTMLButtonElement;
const openDashboardBtn = document.getElementById('openDashboardBtn') as HTMLButtonElement;
const fieldList = document.getElementById('fieldList') as HTMLDivElement;
const settingsLink = document.getElementById('settingsLink') as HTMLAnchorElement;
const helpLink = document.getElementById('helpLink') as HTMLAnchorElement;
const authPanel = document.getElementById('authPanel') as HTMLDivElement;
const authEmail = document.getElementById('authEmail') as HTMLInputElement;
const authPassword = document.getElementById('authPassword') as HTMLInputElement;
const authBtn = document.getElementById('authBtn') as HTMLButtonElement;
const authError = document.getElementById('authError') as HTMLSpanElement;

// State
let currentTabId: number | null = null;
let currentTabUrl: string = '';
let scannedFields: ScannedField[] = [];
let lastFillPlan: FillPlan | null = null;
let candidateProfile: CandidateProfile = DEFAULT_CANDIDATE_PROFILE as CandidateProfile;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await init();
  setupEventListeners();
});

async function init() {
  // Get active tab
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]?.id) {
    currentTabId = tabs[0].id;
    currentTabUrl = tabs[0].url || '';
  }

  // Load custom profile if saved in local storage
  try {
    const stored = await browser.storage.local.get([
      'ai_job_agent_profile',
      'ai_job_agent_profile_id',
    ]);
    if (stored.ai_job_agent_profile) {
      candidateProfile = stored.ai_job_agent_profile as CandidateProfile;
    }
  } catch (err) {
    console.warn('Using default candidate profile:', err);
  }

  if (!supabaseConfigured) {
    authPanel.classList.add('hidden');
  } else {
    try {
      const account = await loadSessionProfile();
      if (account?.profile) {
        candidateProfile = account.profile;
        await browser.storage.local.set({
          ai_job_agent_profile: candidateProfile,
          ai_job_agent_profile_id: candidateProfile.id,
        });
        authPanel.classList.add('hidden');
      }
    } catch (error) {
      authError.textContent = (error as Error).message;
    }
  }

  updateConnectionStatus(true);

  // Auto scan on load
  await handleScan();
}

function setupEventListeners() {
  scanBtn.addEventListener('click', handleScan);
  fillBtn.addEventListener('click', handleFill);
  openDashboardBtn.addEventListener('click', handleOpenDashboard);
  settingsLink.addEventListener('click', handleSettings);
  helpLink.addEventListener('click', handleHelp);
  authBtn.addEventListener('click', handleAuth);
}

async function handleAuth() {
  authBtn.disabled = true;
  authError.textContent = '';
  try {
    const account = await signInAndLoadProfile(authEmail.value, authPassword.value);
    if (!account.profile)
      throw new Error('No profile found. Save your profile in the dashboard first.');
    candidateProfile = account.profile;
    await browser.storage.local.set({
      ai_job_agent_profile: candidateProfile,
      ai_job_agent_profile_id: candidateProfile.id,
    });
    authPanel.classList.add('hidden');
    updateConnectionStatus(true);
  } catch (error) {
    authError.textContent = (error as Error).message;
  } finally {
    authBtn.disabled = false;
  }
}

async function handleScan() {
  if (!currentTabId) return;

  updateStatus('scanning', 'Scanning page...');
  scanBtn.disabled = true;
  scanBtn.textContent = 'Scanning...';

  try {
    const response = await browser.tabs.sendMessage(currentTabId, {
      type: 'SCAN_PAGE',
      payload: { url: currentTabUrl },
    });

    if (response?.success && response.fields && response.fields.length > 0) {
      scannedFields = response.fields;
      lastFillPlan = defaultMapper.mapFields(scannedFields, candidateProfile, currentTabUrl);
      renderFillPlan(lastFillPlan);
      updateStatus(
        'connected',
        `Found ${scannedFields.length} fields (${lastFillPlan.entries.filter((e) => e.action === 'fill').length} ready to fill)`
      );
      fillBtn.classList.remove('hidden');
    } else {
      updateStatus('connected', 'No form fields detected');
      fieldList.innerHTML =
        '<div class="info-section" style="text-align: center; padding: 16px;">No form fields found on this page</div>';
      fillBtn.classList.add('hidden');
    }
  } catch (error) {
    updateStatus('disconnected', 'Failed to scan page');
    console.error('Scan error:', error);
  } finally {
    scanBtn.disabled = false;
    scanBtn.innerHTML = '<span>🔍</span> Scan Page for Forms';
  }
}

async function handleFill() {
  if (!currentTabId) return;

  if (!lastFillPlan && scannedFields.length > 0) {
    lastFillPlan = defaultMapper.mapFields(scannedFields, candidateProfile, currentTabUrl);
  }

  if (!lastFillPlan || lastFillPlan.entries.length === 0) {
    updateStatus('disconnected', 'No fields to fill');
    return;
  }

  // Execute fill plan
  fillBtn.disabled = true;
  fillBtn.textContent = 'Filling...';

  try {
    const response = await browser.tabs.sendMessage(currentTabId, {
      type: 'FILL_FORM',
      payload: lastFillPlan,
    });

    if (response?.results) {
      const successCount = response.results.filter((r: { success: boolean }) => r.success).length;
      updateStatus('connected', `Filled ${successCount} of ${response.results.length} fields`);
      renderFillResults(response.results);
    } else {
      updateStatus('disconnected', 'Fill failed');
    }
  } catch (error) {
    updateStatus('disconnected', 'Fill error');
    console.error('Fill error:', error);
  } finally {
    fillBtn.disabled = false;
    fillBtn.innerHTML = '<span>✨</span> Fill Form';
  }
}

function handleOpenDashboard() {
  browser.tabs.create({ url: 'http://localhost:3000' });
  window.close();
}

function handleSettings(e: Event) {
  e.preventDefault();
  browser.runtime.openOptionsPage();
}

function handleHelp(e: Event) {
  e.preventDefault();
  browser.tabs.create({ url: 'https://github.com/your-repo/ai-job-agent' });
}

function updateConnectionStatus(connected: boolean) {
  if (connected) {
    statusIndicator.classList.add('connected');
    statusText.textContent = 'Connected to dashboard';
  } else {
    statusIndicator.classList.remove('connected');
    statusText.textContent = 'Not connected - open dashboard to configure';
  }
}

function updateStatus(type: 'connected' | 'disconnected' | 'scanning', message: string) {
  statusIndicator.className = 'status-indicator';
  if (type === 'connected') statusIndicator.classList.add('connected');
  else if (type === 'scanning') statusIndicator.classList.add('scanning');
  statusText.textContent = message;
}

function renderFillPlan(plan: FillPlan) {
  if (!plan.entries || plan.entries.length === 0) {
    fieldList.innerHTML =
      '<div class="info-section" style="text-align: center; padding: 16px;">No form fields detected</div>';
    return;
  }

  fieldList.innerHTML = plan.entries
    .map((entry) => {
      const isFill = entry.action === 'fill';
      const label = entry.fieldId.replace(/^field-/, '');
      return `
      <div class="field-item" style="border-left: 3px solid ${isFill ? '#52c41a' : '#faad14'};">
        <div style="display: flex; flex-direction: column; overflow: hidden; max-width: 220px;">
          <span class="field-name" title="${entry.reasoning || label}">
            ${label}
          </span>
          <span style="font-size: 11px; color: ${isFill ? '#389e0d' : '#8c8c8c'};">
            ${isFill ? `→ ${entry.value?.slice(0, 28) || ''}${entry.value && entry.value.length > 28 ? '...' : ''}` : '⊘ ' + entry.classification}
          </span>
        </div>
        <span class="field-type" style="font-weight: 500; color: ${isFill ? '#52c41a' : '#8c8c8c'}">
          ${isFill ? `${Math.round(entry.confidence * 100)}%` : 'Skip'}
        </span>
      </div>
    `;
    })
    .join('');
}

function renderFields(fields: ScannedField[]) {
  if (fields.length === 0) {
    fieldList.innerHTML =
      '<div class="info-section" style="text-align: center; padding: 16px;">No form fields detected</div>';
    return;
  }

  lastFillPlan = defaultMapper.mapFields(fields, candidateProfile, currentTabUrl);
  renderFillPlan(lastFillPlan);
}

function renderFillResults(
  results: Array<{
    fieldId: string;
    classification?: string;
    value?: string;
    success: boolean;
    error?: string;
  }>
) {
  const successCount = results.filter((r) => r.success).length;
  const failCount = results.length - successCount;

  fieldList.innerHTML = `
    <div style="padding: 8px 12px; background: ${failCount === 0 ? '#f6ffed' : '#fff1f0'}; border: 1px solid ${failCount === 0 ? '#b7eb8f' : '#ffa39e'}; border-radius: 6px; margin-bottom: 8px;">
      <strong style="color: ${failCount === 0 ? '#389e0d' : '#cf1322'};">${successCount} fields filled</strong>${failCount > 0 ? `, <span style="color: #ff4d4f;">${failCount} skipped/failed</span>` : ''}
    </div>
    ${results
      .map(
        (r) => `
      <div class="field-item" style="background: ${r.success ? '#f6ffed' : '#fafafa'}; border-left: 3px solid ${r.success ? '#52c41a' : '#d9d9d9'};">
        <div style="display: flex; flex-direction: column; overflow: hidden; max-width: 220px;">
          <span class="field-name">${r.fieldId.replace(/^field-/, '')}</span>
          ${r.value ? `<span style="font-size: 11px; color: #52c41a;">✓ ${r.value.slice(0, 24)}</span>` : ''}
        </div>
        <span class="field-type" style="color: ${r.success ? '#52c41a' : '#8c8c8c'};">${r.success ? '✓ Verified' : r.error || 'Skipped'}</span>
      </div>
    `
      )
      .join('')}
  `;
}

// Listen for messages from content script
browser.runtime.onMessage.addListener((message: any) => {
  if (message.type === 'FIELD_SCANNED') {
    scannedFields = message.payload.fields;
    renderFields(scannedFields);
    updateStatus('connected', `Auto-detected ${scannedFields.length} fields`);
    fillBtn.classList.remove('hidden');
  }

  if (message.type === 'FILL_COMPLETE') {
    const { results } = message.payload;
    renderFillResults(results);
  }
});

export {};
