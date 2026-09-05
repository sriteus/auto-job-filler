/**
 * Form Filler
 * Robust form field population engine with React/framework event dispatching,
 * radio/checkbox/select/custom dropdown handling, and post-fill verification.
 * Safety Rule: NEVER submits forms.
 */

import type { FillPlan, FillPlanEntry, FieldClassificationType } from '@ai-job-agent/shared';

export interface FillResult {
  fieldId: string;
  classification?: FieldClassificationType;
  value?: string;
  success: boolean;
  error?: string;
}

export class FormFiller {
  /**
   * Fills all eligible fields in the fill plan and returns verified results
   */
  async fill(fillPlan: FillPlan, doc: Document = document): Promise<FillResult[]> {
    const results: FillResult[] = [];

    for (const entry of fillPlan.entries) {
      if (entry.action !== 'fill' || entry.value === undefined) {
        results.push({
          fieldId: entry.fieldId,
          classification: entry.classification,
          success: false,
          error: entry.action === 'skip' ? 'Skipped by plan' : 'No fill value provided',
        });
        continue;
      }

      try {
        const element = this.findElement(entry.fieldId, doc);
        if (!element) {
          results.push({
            fieldId: entry.fieldId,
            classification: entry.classification,
            value: entry.value,
            success: false,
            error: 'Target element not found in DOM',
          });
          continue;
        }

        const success = this.fillElement(element, entry.value, entry.classification, entry.options);
        results.push({
          fieldId: entry.fieldId,
          classification: entry.classification,
          value: entry.value,
          success,
          error: success ? undefined : 'Value verification failed after fill',
        });
      } catch (err) {
        results.push({
          fieldId: entry.fieldId,
          classification: entry.classification,
          value: entry.value,
          success: false,
          error: (err as Error).message,
        });
      }
    }

    return results;
  }

  /**
   * Finds element using fieldId, id, name, or attribute selector
   */
  findElement(fieldId: string, doc: Document = document): HTMLElement | null {
    // 1. Direct ID lookup
    const rawId = fieldId.replace(/^field-/, '');
    const byId = doc.getElementById(rawId);
    if (byId) return byId;

    // 2. Direct name lookup
    const byName = doc.querySelector(`[name="${rawId}"]`);
    if (byName) return byName as HTMLElement;

    // 3. Exact fieldId attribute lookup if stored
    const byAttr = doc.querySelector(`[data-field-id="${fieldId}"]`);
    if (byAttr) return byAttr as HTMLElement;

    // 4. Case-insensitive name attribute lookup
    const byNameInsensitive = doc.querySelector(`[name="${rawId}" i]`);
    if (byNameInsensitive) return byNameInsensitive as HTMLElement;

    return null;
  }

  /**
   * Dispatches value into element based on element type
   */
  fillElement(
    element: HTMLElement,
    value: string,
    _classification?: FieldClassificationType,
    options?: { value: string; label: string }[]
  ): boolean {
    const tag = element.tagName.toLowerCase();
    const type = (element as HTMLInputElement).type?.toLowerCase() || '';

    // Text-like inputs
    if (
      tag === 'input' &&
      (type === 'text' ||
        type === 'email' ||
        type === 'tel' ||
        type === 'url' ||
        type === 'number' ||
        type === 'password' ||
        type === 'search' ||
        type === '')
    ) {
      return this.fillInput(element as HTMLInputElement, value);
    }

    // Textarea
    if (tag === 'textarea') {
      return this.fillTextarea(element as HTMLTextAreaElement, value);
    }

    // Select dropdown
    if (tag === 'select') {
      return this.fillSelect(element as HTMLSelectElement, value, options);
    }

    // Checkbox
    if (type === 'checkbox' || element.getAttribute('role') === 'checkbox') {
      return this.fillCheckbox(element, value);
    }

    // Radio
    if (type === 'radio' || element.getAttribute('role') === 'radio') {
      return this.fillRadio(element, value);
    }

    // ContentEditable
    if (element.getAttribute('contenteditable') === 'true') {
      return this.fillContentEditable(element, value);
    }

    // Custom dropdowns (ARIA listbox / combobox)
    if (element.getAttribute('role') === 'combobox' || element.getAttribute('role') === 'listbox') {
      return this.fillCustomSelect(element, value, options);
    }

    // Generic input fallback
    if ('value' in element) {
      return this.fillInput(element as HTMLInputElement, value);
    }

    return false;
  }

  /**
   * Fills an HTMLInputElement with native property setter and synthetic events
   */
  fillInput(input: HTMLInputElement, value: string): boolean {
    input.focus?.();

    // Call native setter to bypass React/Vue synthetic wrapper overrides
    const proto =
      typeof HTMLInputElement !== 'undefined'
        ? HTMLInputElement.prototype
        : Object.getPrototypeOf(input);
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (nativeSetter) {
      nativeSetter.call(input, value);
    } else {
      input.value = value;
    }

    // Dispatch input & change events with bubbles and composed flags
    if (typeof Event !== 'undefined') {
      input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));
    }

    return input.value === value;
  }

  /**
   * Fills an HTMLTextAreaElement
   */
  fillTextarea(textarea: HTMLTextAreaElement, value: string): boolean {
    textarea.focus?.();

    const proto =
      typeof HTMLTextAreaElement !== 'undefined'
        ? HTMLTextAreaElement.prototype
        : Object.getPrototypeOf(textarea);
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (nativeSetter) {
      nativeSetter.call(textarea, value);
    } else {
      textarea.value = value;
    }

    if (typeof Event !== 'undefined') {
      textarea.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      textarea.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));
    }

    return textarea.value === value;
  }

  /**
   * Fills an HTMLSelectElement by exact or fuzzy matching of options
   */
  fillSelect(
    select: HTMLSelectElement,
    value: string,
    _options?: { value: string; label: string }[]
  ): boolean {
    const valLower = value.toLowerCase().trim();
    let selectedOption: HTMLOptionElement | null = null;

    // 1. Exact value or text match
    for (const opt of Array.from(select.options)) {
      if (
        opt.value.toLowerCase().trim() === valLower ||
        opt.textContent?.toLowerCase().trim() === valLower
      ) {
        selectedOption = opt;
        break;
      }
    }

    // 2. Substring / contains match
    if (!selectedOption) {
      for (const opt of Array.from(select.options)) {
        const text = opt.textContent?.toLowerCase().trim() || '';
        const val = opt.value.toLowerCase().trim();
        if (text.includes(valLower) || valLower.includes(text) || val.includes(valLower)) {
          selectedOption = opt;
          break;
        }
      }
    }

    if (selectedOption) {
      const proto =
        typeof HTMLSelectElement !== 'undefined'
          ? HTMLSelectElement.prototype
          : Object.getPrototypeOf(select);
      const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (nativeSetter) {
        nativeSetter.call(select, selectedOption.value);
      } else {
        select.value = selectedOption.value;
      }

      if (typeof Event !== 'undefined') {
        select.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        select.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        select.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));
      }

      return select.value === selectedOption.value;
    }

    return false;
  }

  /**
   * Fills standard or ARIA checkbox
   */
  fillCheckbox(element: HTMLElement, value: string): boolean {
    const shouldCheck =
      value.toLowerCase() === 'true' ||
      value === '1' ||
      value.toLowerCase() === 'yes' ||
      value.toLowerCase() === 'checked';

    if (element.tagName === 'INPUT') {
      const input = element as HTMLInputElement;
      input.checked = shouldCheck;
      input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      input.dispatchEvent(new Event('click', { bubbles: true, composed: true }));
      return input.checked === shouldCheck;
    }

    element.setAttribute('aria-checked', shouldCheck ? 'true' : 'false');
    element.dispatchEvent(new Event('click', { bubbles: true, composed: true }));
    return element.getAttribute('aria-checked') === (shouldCheck ? 'true' : 'false');
  }

  /**
   * Fills radio button group by finding matching option (e.g. Yes vs No)
   */
  fillRadio(element: HTMLElement, value: string): boolean {
    const name = element.getAttribute('name') || element.getAttribute('data-name');
    const doc = element.ownerDocument || document;
    const valLower = value.toLowerCase().trim();

    if (!name) {
      if (element.tagName === 'INPUT') {
        (element as HTMLInputElement).checked = true;
        element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        return (element as HTMLInputElement).checked;
      }
      return false;
    }

    const radios = Array.from(
      doc.querySelectorAll(`input[name="${name}"], [role="radio"][data-name="${name}"]`)
    ) as HTMLElement[];

    for (const radio of radios) {
      const radioVal = (radio as HTMLInputElement).value?.toLowerCase()?.trim() || '';
      const labelText = this.getAssociatedText(radio).toLowerCase().trim();

      const isMatch =
        radioVal === valLower ||
        labelText === valLower ||
        (valLower === 'yes' &&
          (radioVal.startsWith('y') ||
            labelText.startsWith('yes') ||
            labelText.includes('authorized'))) ||
        (valLower === 'no' &&
          (radioVal.startsWith('n') ||
            labelText.startsWith('no') ||
            labelText.includes('do not require')));

      if (isMatch) {
        if (radio.tagName === 'INPUT') {
          const input = radio as HTMLInputElement;
          input.checked = true;
          input.dispatchEvent(new Event('click', { bubbles: true, composed: true }));
          input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
          return input.checked;
        }

        radio.setAttribute('aria-checked', 'true');
        radio.dispatchEvent(new Event('click', { bubbles: true, composed: true }));
        return true;
      }
    }

    return false;
  }

  /**
   * Fills ContentEditable DIV / Span
   */
  fillContentEditable(element: HTMLElement, value: string): boolean {
    element.focus();
    element.textContent = value;
    element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));
    return element.textContent?.trim() === value.trim();
  }

  /**
   * Fills custom ARIA dropdowns
   */
  fillCustomSelect(
    element: HTMLElement,
    value: string,
    _options?: { value: string; label: string }[]
  ): boolean {
    const valLower = value.toLowerCase().trim();
    const options = element.querySelectorAll('[role="option"]');

    for (const opt of Array.from(options)) {
      const optText = opt.textContent?.toLowerCase()?.trim() || '';
      const optVal = opt.getAttribute('data-value')?.toLowerCase()?.trim() || '';

      if (optText === valLower || optVal === valLower || optText.includes(valLower)) {
        opt.dispatchEvent(new Event('click', { bubbles: true, composed: true }));
        return true;
      }
    }

    return false;
  }

  private getAssociatedText(element: HTMLElement): string {
    const doc = element.ownerDocument || document;
    if (element.id) {
      const label = doc.querySelector(`label[for="${element.id}"]`);
      if (label?.textContent) return label.textContent;
    }
    const parent = element.closest('label');
    if (parent?.textContent) return parent.textContent;
    return element.parentElement?.textContent || '';
  }
}

export const defaultFiller = new FormFiller();
