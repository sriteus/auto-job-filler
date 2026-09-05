/**
 * DOM Scanner
 * Extracts structured field metadata from arbitrary job application web pages.
 */

import type { ScannedField } from '@ai-job-agent/shared';

export interface ScannerConfig {
  maxDepth?: number;
  includeHidden?: boolean;
}

export class DOMScanner {
  private config: ScannerConfig;

  constructor(config: ScannerConfig = {}) {
    this.config = {
      maxDepth: config.maxDepth ?? 10,
      includeHidden: config.includeHidden ?? false,
    };
  }

  scan(doc: Document = document): ScannedField[] {
    const fields: ScannedField[] = [];
    let domOrder = 0;

    // Standard selectors for form fields and custom ARIA components
    const selectors = [
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"])',
      'textarea',
      'select',
      '[role="textbox"]',
      '[role="combobox"]',
      '[role="listbox"]',
      '[role="checkbox"]',
      '[role="radio"]',
      '[contenteditable="true"]',
    ];

    const elements = doc.querySelectorAll(selectors.join(', '));

    elements.forEach((element) => {
      const htmlEl = element as HTMLElement;
      if (!this.config.includeHidden && !this.isVisible(htmlEl)) {
        return;
      }

      const field = this.extractFieldInfo(htmlEl, domOrder++);
      if (field) {
        fields.push(field);
      }
    });

    return fields.sort((a, b) => a.domOrder - b.domOrder);
  }

  extractFieldInfo(element: HTMLElement, domOrder: number): ScannedField | null {
    const tag = element.tagName.toLowerCase();
    const type = (element as HTMLInputElement).type || '';
    const name = element.getAttribute('name') || undefined;
    const id = element.id || undefined;
    const placeholder = element.getAttribute('placeholder') || undefined;
    const autocomplete = element.getAttribute('autocomplete') || undefined;
    const ariaLabel =
      element.getAttribute('aria-label') ||
      element.getAttribute('data-test-id') ||
      element.getAttribute('data-automation-id') ||
      undefined;
    const required =
      element.hasAttribute('required') ||
      element.getAttribute('aria-required') === 'true' ||
      element.classList.contains('required');
    const visible = this.isVisible(element);
    const currentValue = this.getElementValue(element);

    const label = this.findLabel(element);
    const nearbyText = this.getNearbyText(element);
    const options = this.getOptions(element);
    const fieldId = this.generateFieldId(element);

    return {
      fieldId,
      tag,
      type,
      name,
      id,
      placeholder,
      autocomplete,
      ariaLabel,
      label,
      nearbyText,
      required,
      visible,
      currentValue,
      options,
      domOrder,
      context: [label, placeholder, ariaLabel, nearbyText].filter(Boolean).join(' | '),
    };
  }

  isVisible(element: HTMLElement): boolean {
    if (typeof window === 'undefined') return true;
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    if (element.offsetWidth === 0 && element.offsetHeight === 0) {
      // Allow file inputs and hidden radios if parent is visible
      if (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'file') {
        return true;
      }
      return false;
    }
    return true;
  }

  getElementValue(element: HTMLElement): string | undefined {
    if ('value' in element) {
      return (element as HTMLInputElement).value || undefined;
    }
    if (element.tagName === 'TEXTAREA') {
      return (element as HTMLTextAreaElement).value || undefined;
    }
    if (element.tagName === 'SELECT') {
      return (element as HTMLSelectElement).value || undefined;
    }
    if (element.getAttribute('contenteditable') === 'true') {
      return element.textContent?.trim() || undefined;
    }
    if (element.getAttribute('role') === 'checkbox') {
      return element.getAttribute('aria-checked') === 'true' ? 'true' : 'false';
    }
    if (element.getAttribute('role') === 'radio') {
      return element.getAttribute('aria-checked') === 'true' ? 'true' : 'false';
    }
    return element.textContent?.trim() || undefined;
  }

  findLabel(element: HTMLElement): string | undefined {
    const doc = element.ownerDocument || document;

    // 1. Check for explicit label with `for` attribute
    if (element.id) {
      const explicitLabel = doc.querySelector(`label[for="${element.id}"]`);
      if (explicitLabel) {
        const text = explicitLabel.textContent?.trim();
        if (text) return text;
      }
    }

    // 2. Check for parent label
    const parentLabel = element.closest('label');
    if (parentLabel) {
      const clone = parentLabel.cloneNode(true) as HTMLElement;
      const inputs = clone.querySelectorAll('input, textarea, select');
      inputs.forEach((i) => i.remove());
      const text = clone.textContent?.trim();
      if (text) return text;
    }

    // 3. Check for aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const parts = labelledBy.split(/\s+/);
      const textParts = parts
        .map((partId) => doc.getElementById(partId)?.textContent?.trim())
        .filter(Boolean);
      if (textParts.length > 0) {
        return textParts.join(' ');
      }
    }

    // 4. Check for enclosing field container / fieldset legend
    const fieldset = element.closest('fieldset');
    if (fieldset) {
      const legend = fieldset.querySelector('legend');
      if (legend?.textContent?.trim()) {
        return legend.textContent.trim();
      }
    }

    // 5. Check container with common form classes (LinkedIn, Greenhouse, Lever, Workday)
    const questionContainer = element.closest(
      '.fb-dash-form-element, .application-question, .form-group, .field, [data-test-form-element], .jobs-easy-apply-form-section__grouping'
    );
    if (questionContainer) {
      const header = questionContainer.querySelector(
        'label, h3, h4, span.label, legend, .artdeco-text-input--label'
      );
      if (header?.textContent?.trim()) {
        return header.textContent.trim();
      }
    }

    return undefined;
  }

  getNearbyText(element: HTMLElement, maxDistance: number = 200): string | undefined {
    const texts: string[] = [];

    // Check preceding siblings
    let sibling = element.previousElementSibling;
    let distance = 0;
    while (sibling && distance < maxDistance) {
      const text = sibling.textContent?.trim();
      if (text && text.length > 2 && text.length < 150) {
        texts.push(text);
      }
      distance += sibling.textContent?.length || 0;
      sibling = sibling.previousElementSibling;
    }

    // Check parent's preceding siblings
    const parent = element.parentElement;
    if (parent) {
      sibling = parent.previousElementSibling;
      distance = 0;
      while (sibling && distance < maxDistance) {
        const text = sibling.textContent?.trim();
        if (text && text.length > 2 && text.length < 150) {
          texts.push(text);
        }
        distance += sibling.textContent?.length || 0;
        sibling = sibling.previousElementSibling;
      }
    }

    return texts.slice(0, 3).join(' | ') || undefined;
  }

  getOptions(element: HTMLElement): string[] | undefined {
    if (element.tagName === 'SELECT') {
      return Array.from((element as HTMLSelectElement).options)
        .map((opt) => opt.textContent?.trim() || opt.value)
        .filter(Boolean);
    }

    if (element.getAttribute('role') === 'listbox' || element.getAttribute('role') === 'combobox') {
      const options = element.querySelectorAll('[role="option"]');
      if (options.length > 0) {
        return Array.from(options)
          .map((opt) => opt.textContent?.trim() || '')
          .filter(Boolean);
      }
    }

    // Radio group options
    const name = element.getAttribute('name');
    if (
      element.getAttribute('role') === 'radio' ||
      (element as HTMLInputElement).type === 'radio'
    ) {
      if (name) {
        const radios = (element.ownerDocument || document).querySelectorAll(
          `input[name="${name}"]`
        );
        return Array.from(radios)
          .map((r) => {
            const radioEl = r as HTMLInputElement;
            const lbl = this.findLabel(radioEl);
            return lbl || radioEl.value;
          })
          .filter(Boolean);
      }
    }

    return undefined;
  }

  generateFieldId(element: HTMLElement): string {
    if (element.id) return `field-${element.id}`;
    const name = element.getAttribute('name');
    if (name) return `field-${name}`;
    const tag = element.tagName.toLowerCase();
    const type = (element as HTMLInputElement).type || '';
    const label = (this.findLabel(element) || '').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
    return `field-${tag}-${type}-${label || Math.random().toString(36).slice(2, 9)}`;
  }
}

export const defaultScanner = new DOMScanner();
