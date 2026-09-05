/**
 * Background Service Worker for Chrome Extension
 * Handles communication between content scripts, popup, and backend API
 */

import browser from 'webextension-polyfill';
import type {
  ExtensionMessage,
  ScanPageMessage,
  FillFormMessage,
  GetProfileMessage,
} from '@ai-job-agent/shared';

// API base URL - will be configured via settings
const API_BASE = 'http://localhost:3000';

// State
let currentProfileId: string | null = null;

// Initialize
browser.runtime.onInstalled.addListener(() => {
  console.log('[AI Job Agent] Extension installed');
});

// Handle messages from content scripts and popup
browser.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    sender: browser.Runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ) => {
    handleMessage(message, sender)
      .then(sendResponse)
      .catch((error) => {
        console.error('[AI Job Agent] Message handling error:', error);
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keep channel open for async response
  }
);

async function handleMessage(message: ExtensionMessage, sender: browser.Runtime.MessageSender) {
  switch (message.type) {
    case 'SCAN_PAGE':
      return handleScanPage(message as ScanPageMessage, sender.tab?.id);

    case 'FILL_FORM':
      return handleFillForm(message as FillFormMessage, sender.tab?.id);

    case 'GET_PROFILE':
      return handleGetProfile(message as GetProfileMessage);

    case 'UPDATE_PROFILE':
      return handleUpdateProfile(message);

    case 'REQUEST_PROFILE':
      return { success: true, profileId: currentProfileId };

    default:
      return { success: false, error: `Unknown message type: ${message.type}` };
  }
}

async function handleScanPage(message: ScanPageMessage, tabId?: number) {
  try {
    // Forward scan request to content script
    if (tabId) {
      const response = await browser.tabs.sendMessage(tabId, {
        type: 'SCAN_PAGE',
        payload: message.payload,
      });
      return response;
    }
    return { success: false, error: 'No tab ID available' };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

async function handleFillForm(message: FillFormMessage, tabId?: number) {
  try {
    if (tabId) {
      const response = await browser.tabs.sendMessage(tabId, {
        type: 'FILL_FORM',
        payload: message.payload,
      });
      return response;
    }
    return { success: false, error: 'No tab ID available' };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

async function handleGetProfile(_message: GetProfileMessage) {
  try {
    const result = await browser.storage.local.get(['ai_job_agent_profile_id']);
    currentProfileId = result.ai_job_agent_profile_id || null;
    return { success: true, profileId: currentProfileId };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

async function handleUpdateProfile(message: ExtensionMessage) {
  try {
    if (message.payload && typeof message.payload === 'object' && 'profileId' in message.payload) {
      currentProfileId = (message.payload as { profileId: string }).profileId;
      await browser.storage.local.set({ ai_job_agent_profile_id: currentProfileId });
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// API communication helpers
export async function callBackendAPI<T>(endpoint: string, data: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Listen for tab updates to detect job application pages
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if this looks like a job application page
    if (isJobApplicationPage(tab.url)) {
      // Notify content script to scan
      browser.tabs
        .sendMessage(tabId, { type: 'PAGE_DETECTED', payload: { url: tab.url } })
        .catch(() => {
          // Ignore errors - content script might not be ready
        });
    }
  }
});

function isJobApplicationPage(url: string): boolean {
  const keywords = [
    'apply',
    'application',
    'careers',
    'jobs',
    'position',
    'candidate',
    'resume',
    'workday',
    'greenhouse',
    'lever',
    'ashby',
    'bamboohr',
    'icims',
    'taleo',
  ];

  const lowerUrl = url.toLowerCase();
  return keywords.some((keyword) => lowerUrl.includes(keyword));
}

// Export for testing
export { handleMessage, isJobApplicationPage };
