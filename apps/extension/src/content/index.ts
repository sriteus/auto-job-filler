/**
 * Content Script for Chrome Extension
 * Scans page for form fields, communicates with background script and popup
 */

import type { ExtensionMessage, ScannedField, FillPlan } from '@ai-job-agent/shared';
import { defaultScanner } from '../scanner';
import { defaultFiller } from '../filler';

// Track if we've already scanned to avoid duplicate scans
let hasScanned = false;
let scannedFields: ScannedField[] = [];

// Listen for messages from background script or popup
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  handleMessage(message)
    .then(sendResponse)
    .catch((error) => {
      console.error('[AI Job Agent Content] Error:', error);
      sendResponse({ success: false, error: error.message });
    });

  return true; // Keep channel open for async response
});

async function handleMessage(message: ExtensionMessage) {
  switch (message.type) {
    case 'SCAN_PAGE':
      return scanPage();

    case 'FILL_FORM':
      return fillForm(message.payload as FillPlan);

    case 'PAGE_DETECTED':
      // Auto-scan when page is detected as job application
      if (!hasScanned) {
        setTimeout(() => scanPage(), 500);
      }
      return { success: true };

    default:
      return { success: false, error: `Unknown message type: ${message.type}` };
  }
}

function scanPage(): { success: boolean; fields?: ScannedField[]; error?: string } {
  try {
    const fields = defaultScanner.scan(document);
    scannedFields = fields;
    hasScanned = true;

    // Notify background script of scanned fields
    chrome.runtime
      .sendMessage({
        type: 'FIELD_SCANNED',
        payload: { fields, url: window.location.href },
      })
      .catch(() => {});

    return { success: true, fields };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

async function fillForm(fillPlan: FillPlan): Promise<{ success: boolean; results: any[] }> {
  try {
    const results = await defaultFiller.fill(fillPlan, document);
    const success = results.length > 0 && results.some((r) => r.success);

    // Notify background of completion
    chrome.runtime
      .sendMessage({
        type: 'FILL_COMPLETE',
        payload: { results, url: window.location.href },
      })
      .catch(() => {});

    return { success, results };
  } catch (error) {
    return {
      success: false,
      results: [{ fieldId: 'general', success: false, error: (error as Error).message }],
    };
  }
}

export function extractFormFields(): ScannedField[] {
  return defaultScanner.scan(document);
}

// MutationObserver to detect dynamically added forms
const observer = new MutationObserver((mutations) => {
  let shouldScan = false;

  for (const mutation of mutations) {
    if (mutation.type === 'childList') {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          if (
            element.matches?.(
              'form, input, textarea, select, [role="textbox"], [role="combobox"]'
            ) ||
            element.querySelector?.(
              'form, input, textarea, select, [role="textbox"], [role="combobox"]'
            )
          ) {
            shouldScan = true;
            break;
          }
        }
      }
    }
  }

  if (shouldScan && !hasScanned) {
    setTimeout(() => scanPage(), 300);
  }
});

if (typeof document !== 'undefined' && document.body) {
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Export for testing
export { scanPage, fillForm };
