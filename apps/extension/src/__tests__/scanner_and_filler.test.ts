import { defaultScanner } from '../scanner';
import { defaultMapper } from '../mapper';
import { defaultFiller } from '../filler';
import { DEFAULT_CANDIDATE_PROFILE } from '@ai-job-agent/shared';

// Lightweight DOM mock for node testing environment
class MockElement {
  id: string = '';
  tagName: string = 'INPUT';
  type: string = 'text';
  name: string = '';
  value: string = '';
  checked: boolean = false;
  textContent: string = '';
  attributes: Record<string, string> = {};
  children: MockElement[] = [];
  parentElement: MockElement | null = null;
  previousElementSibling: MockElement | null = null;

  constructor(tag: string = 'input', attrs: Record<string, string> = {}) {
    this.tagName = tag.toUpperCase();
    this.attributes = { ...attrs };
    this.id = attrs.id || '';
    this.name = attrs.name || '';
    this.type = attrs.type || 'text';
    this.value = attrs.value || '';
  }

  getAttribute(name: string) {
    return this.attributes[name] || null;
  }

  setAttribute(name: string, val: string) {
    this.attributes[name] = val;
  }

  hasAttribute(name: string) {
    return name in this.attributes;
  }

  dispatchEvent(_event: any) {
    return true;
  }

  focus() {}

  closest(_selector: string) {
    return this.parentElement;
  }

  querySelectorAll(_selector: string) {
    return [];
  }
}

describe('DOMScanner and DeterministicMapper Integration', () => {
  it('maps fields correctly from scanned metadata', () => {
    const fields = [
      {
        fieldId: 'field-firstName',
        tag: 'input',
        type: 'text',
        name: 'firstName',
        label: 'First name',
        required: true,
        visible: true,
        domOrder: 0,
      },
      {
        fieldId: 'field-emailAddress',
        tag: 'input',
        type: 'email',
        name: 'emailAddress',
        label: 'Email address',
        required: true,
        visible: true,
        domOrder: 1,
      },
      {
        fieldId: 'field-work_auth',
        tag: 'input',
        type: 'radio',
        name: 'work_auth',
        label: 'Are you legally authorized to work in the United States?',
        required: true,
        visible: true,
        domOrder: 2,
      },
      {
        fieldId: 'field-visa_spons',
        tag: 'input',
        type: 'radio',
        name: 'visa_spons',
        label: 'Will you now or in the future require visa sponsorship?',
        required: true,
        visible: true,
        domOrder: 3,
      },
      {
        fieldId: 'field-linkedin',
        tag: 'input',
        type: 'url',
        name: 'urls[LinkedIn]',
        label: 'LinkedIn Profile',
        required: false,
        visible: true,
        domOrder: 4,
      },
    ];

    const plan = defaultMapper.mapFields(fields, DEFAULT_CANDIDATE_PROFILE as any);

    expect(plan.entries).toHaveLength(5);
    expect(plan.entries[0].value).toBe('Sarthak');
    expect(plan.entries[1].value).toBe('sarthak@example.com');
    expect(plan.entries[2].value).toBe('Yes');
    expect(plan.entries[3].value).toBe('No');
    expect(plan.entries[4].value).toBe('https://linkedin.com/in/sarthakgupta');
  });

  it('verifies form filler handles input values', () => {
    const input = new MockElement('input', { id: 'test-email', type: 'email' });
    const success = defaultFiller.fillInput(input as any, 'test@example.com');

    expect(input.value).toBe('test@example.com');
    expect(success).toBe(true);
  });

  it('keeps fields with distinct names mapped to distinct elements', () => {
    const elements = [
      new MockElement('input', { name: 'first_name', type: 'text' }),
      new MockElement('input', { name: 'last_name', type: 'text' }),
      new MockElement('textarea', { name: 'interest' }),
    ];
    const doc = {
      getElementById: () => null,
      querySelectorAll: () => elements,
      querySelector: () => null,
    } as any;

    expect(defaultFiller.findElement('field-last_name', doc)).toBe(elements[1]);
    expect(defaultFiller.findElement('field-interest', doc)).toBe(elements[2]);
  });
});
