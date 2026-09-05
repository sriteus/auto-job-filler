import { defaultMapper } from '../mapper';
import { DEFAULT_CANDIDATE_PROFILE } from '@ai-job-agent/shared';
import type { ScannedField, CandidateProfile } from '@ai-job-agent/shared';

describe('DeterministicMapper', () => {
  const profile = DEFAULT_CANDIDATE_PROFILE as CandidateProfile;

  it('maps personal fields accurately', () => {
    const fields: ScannedField[] = [
      {
        fieldId: 'f1',
        tag: 'input',
        type: 'text',
        name: 'firstName',
        label: 'First name',
        required: true,
        visible: true,
        domOrder: 1,
      },
      {
        fieldId: 'f2',
        tag: 'input',
        type: 'text',
        name: 'lastName',
        label: 'Last name',
        required: true,
        visible: true,
        domOrder: 2,
      },
      {
        fieldId: 'f3',
        tag: 'input',
        type: 'email',
        name: 'emailAddress',
        label: 'Email address',
        required: true,
        visible: true,
        domOrder: 3,
      },
      {
        fieldId: 'f4',
        tag: 'input',
        type: 'tel',
        name: 'phoneNumber',
        label: 'Mobile phone number',
        required: true,
        visible: true,
        domOrder: 4,
      },
    ];

    const plan = defaultMapper.mapFields(fields, profile);

    expect(plan.entries).toHaveLength(4);
    expect(plan.entries[0]).toMatchObject({
      fieldId: 'f1',
      classification: 'first_name',
      action: 'fill',
      value: 'Sarthak',
    });
    expect(plan.entries[1]).toMatchObject({
      fieldId: 'f2',
      classification: 'last_name',
      action: 'fill',
      value: 'Gupta',
    });
    expect(plan.entries[2]).toMatchObject({
      fieldId: 'f3',
      classification: 'email',
      action: 'fill',
      value: 'sarthak@example.com',
    });
    expect(plan.entries[3]).toMatchObject({
      fieldId: 'f4',
      classification: 'phone',
      action: 'fill',
      value: '+1 (555) 234-5678',
    });
  });

  it('maps LinkedIn and Greenhouse screening questions', () => {
    const fields: ScannedField[] = [
      {
        fieldId: 'f_auth',
        tag: 'input',
        type: 'radio',
        name: 'work_authorization',
        label: 'Are you legally authorized to work in the United States?',
        required: true,
        visible: true,
        domOrder: 1,
      },
      {
        fieldId: 'f_visa',
        tag: 'input',
        type: 'radio',
        name: 'visa_sponsorship',
        label: 'Will you now or in the future require sponsorship for an employment visa?',
        required: true,
        visible: true,
        domOrder: 2,
      },
      {
        fieldId: 'f_li',
        tag: 'input',
        type: 'url',
        name: 'urls[LinkedIn]',
        label: 'LinkedIn Profile',
        required: false,
        visible: true,
        domOrder: 3,
      },
    ];

    const plan = defaultMapper.mapFields(fields, profile);

    expect(plan.entries[0]).toMatchObject({
      classification: 'work_authorization',
      action: 'fill',
      value: 'Yes',
    });
    expect(plan.entries[1]).toMatchObject({
      classification: 'visa_sponsorship',
      action: 'fill',
      value: 'No',
    });
    expect(plan.entries[2]).toMatchObject({
      classification: 'linkedin',
      action: 'fill',
      value: 'https://linkedin.com/in/sarthakgupta',
    });
  });

  it('does not reuse first name for last name or unrelated free text fields', () => {
    const plan = defaultMapper.mapFields([
      {
        fieldId: 'field-first_name', tag: 'input', type: 'text', name: 'first_name',
        label: 'First name', required: true, visible: true, domOrder: 1,
      },
      {
        fieldId: 'field-last_name', tag: 'input', type: 'text', name: 'last_name',
        label: 'Last name', nearbyText: 'First name', required: true, visible: true, domOrder: 2,
      },
      {
        fieldId: 'field-interest', tag: 'textarea', type: '', name: 'interest',
        label: 'Why are you interested?', nearbyText: 'First name', required: false, visible: true, domOrder: 3,
      },
    ], profile);

    expect(plan.entries).toMatchObject([
      { classification: 'first_name', value: 'Sarthak' },
      { classification: 'last_name', value: 'Gupta' },
      { classification: 'unknown', action: 'skip' },
    ]);
  });

  it('recognizes common site-specific names and autocomplete hints', () => {
    const plan = defaultMapper.mapFields([
      { fieldId: 'f1', tag: 'input', type: 'text', id: 'candidateFirstName', label: 'Given', required: false, visible: true, domOrder: 1 },
      { fieldId: 'f2', tag: 'input', type: 'text', name: 'applicant_last_name', label: 'Family', required: false, visible: true, domOrder: 2 },
      { fieldId: 'f3', tag: 'input', type: 'text', id: 'contactEmail', label: 'Contact', required: false, visible: true, domOrder: 3 },
      { fieldId: 'f4', tag: 'input', type: 'text', autocomplete: 'family-name', label: 'Legal name', required: false, visible: true, domOrder: 4 },
    ], profile);

    expect(plan.entries).toMatchObject([
      { classification: 'first_name', value: 'Sarthak' },
      { classification: 'last_name', value: 'Gupta' },
      { classification: 'email', value: 'sarthak@example.com' },
      { classification: 'last_name', value: 'Gupta' },
    ]);
  });

  it('maps a custom referral answer to a dropdown option', () => {
    const customProfile = {
      ...profile,
      customFields: [{ id: 'referral', label: 'Was I referred', key: 'referral', value: 'No', verified: true }],
    };
    const plan = defaultMapper.mapFields([{
      fieldId: 'f-referral', tag: 'select', type: 'select-one', name: 'referral_source',
      label: 'Did someone refer you to apply for this job?', options: ['Yes', 'No'],
      required: false, visible: true, domOrder: 1,
    }], customProfile);

    expect(plan.entries[0]).toMatchObject({
      classification: 'free_text', action: 'fill', value: 'No',
    });
  });
});
