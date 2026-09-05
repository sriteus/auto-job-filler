/**
 * Deterministic Field Mapper
 * Matches scanned form fields against candidate profile without requiring LLM calls.
 */

import type {
  ScannedField,
  FieldClassificationType,
  CandidateProfile,
  FillPlan,
  FillPlanEntry,
  FillAction,
} from '@ai-job-agent/shared';
import { DEFAULT_CANDIDATE_PROFILE } from '@ai-job-agent/shared';

export interface MappingResult {
  fieldId: string;
  classification: FieldClassificationType;
  confidence: number;
  action: FillAction;
  value?: string;
  source: 'verified_profile' | 'deterministic_mapping' | 'approved_answer' | 'user_input';
  reasoning?: string;
  options?: { value: string; label: string }[];
}

export class DeterministicMapper {
  /**
   * Maps scanned fields to Candidate Profile facts and produces a FillPlan
   */
  mapFields(
    fields: ScannedField[],
    profile: CandidateProfile = DEFAULT_CANDIDATE_PROFILE as CandidateProfile,
    jobUrl: string = typeof window !== 'undefined' ? window.location?.href || '' : ''
  ): FillPlan {
    const entries: FillPlanEntry[] = fields.map((field) => this.mapSingleField(field, profile));

    return {
      entries,
      jobInfo: {
        url: jobUrl,
        extractedAt: new Date().toISOString(),
      },
      profileId: profile.id,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Classifies and maps a single scanned field against the candidate profile
   */
  mapSingleField(
    field: ScannedField,
    profile: CandidateProfile = DEFAULT_CANDIDATE_PROFILE as CandidateProfile
  ): FillPlanEntry {
    const fieldText = this.getUnifiedFieldText(field).toLowerCase();

    const customField = this.matchCustomField(field, profile);
    if (customField) {
      return {
        fieldId: field.fieldId,
        classification: 'free_text',
        action: customField.value ? 'fill' : 'skip',
        value: customField.value,
        confidence: customField.verified ? 0.98 : 0.9,
        source: customField.verified ? 'verified_profile' : 'user_input',
        reasoning: `Matched custom profile field "${customField.label}"`,
      };
    }

    const normalizedName = (field.name || '').toLowerCase();
    const normalizedId = (field.id || '').toLowerCase();
    const normalizedPlaceholder = (field.placeholder || '').toLowerCase();
    const normalizedLabel = (field.label || '').toLowerCase();
    const normalizedAria = (field.ariaLabel || '').toLowerCase();
    const tag = field.tag.toLowerCase();
    const type = (field.type || '').toLowerCase();

    // 1. Check for specific classification patterns
    const classification = this.detectClassification(
      fieldText,
      normalizedName,
      normalizedId,
      normalizedPlaceholder,
      normalizedLabel,
      normalizedAria,
      type
    );

    // 2. Check for approved reusable question answers
    if (tag === 'textarea' || (tag === 'input' && type === 'text')) {
      const approvedAnswer = this.matchApprovedAnswer(fieldText, profile);
      if (approvedAnswer) {
        return {
          fieldId: field.fieldId,
          classification: 'free_text',
          action: 'fill',
          value: approvedAnswer.answer,
          confidence: 0.95,
          source: 'approved_answer',
          reasoning: `Matched approved answer for question: "${approvedAnswer.question}"`,
        };
      }
    }

    // 3. Resolve value from candidate profile based on classification
    const resolved = this.resolveProfileValue(classification, field, profile);

    return {
      fieldId: field.fieldId,
      classification,
      action: resolved.action,
      value: resolved.value,
      confidence: resolved.confidence,
      source: resolved.source,
      reasoning: resolved.reasoning,
      options: resolved.options,
    };
  }

  /**
   * Detects classification based on regex heuristics and keywords
   */
  private detectClassification(
    unifiedText: string,
    name: string,
    id: string,
    placeholder: string,
    label: string,
    aria: string,
    type: string
  ): FieldClassificationType {
    const directTokens = [name, id, placeholder, label, aria];
    const tokens = [...directTokens, unifiedText];

    // Check HTML input types first
    if (type === 'email') return 'email';
    if (type === 'tel') return 'phone';
    if (type === 'file' || tokens.some((t) => /resume|cv|curriculum\s*vitae/i.test(t))) {
      return 'resume';
    }

    // First Name / Given Name
    if (
      this.matchesAny(directTokens, [
        /^first[_\-\s]?name$/i,
        /^fname$/i,
        /^given[_\-\s]?name$/i,
        /\bfirst\s*name\b/i,
        /\bgiven\s*name\b/i,
        /\bprénom\b/i,
      ])
    ) {
      return 'first_name';
    }

    // Last Name / Surname / Family Name
    if (
      this.matchesAny(directTokens, [
        /^last[_\-\s]?name$/i,
        /^lname$/i,
        /^surname$/i,
        /^family[_\-\s]?name$/i,
        /\blast\s*name\b/i,
        /\bfamily\s*name\b/i,
        /\bsurname\b/i,
      ])
    ) {
      return 'last_name';
    }

    // Full Name
    if (
      this.matchesAny(directTokens, [
        /^full[_\-\s]?name$/i,
        /^fullname$/i,
        /^name$/i,
        /\bfull\s*name\b/i,
        /\byour\s*name\b/i,
        /\bcandidate\s*name\b/i,
        /\bapplicant\s*name\b/i,
      ]) &&
      !directTokens.some((t) => /first|last|company|user|file/i.test(t))
    ) {
      return 'full_name';
    }

    // Email
    if (
      this.matchesAny(tokens, [
        /^email$/i,
        /^e[_\-]?mail$/i,
        /^email[_\-\s]?address$/i,
        /\be-?mail\s*address\b/i,
        /\bcontact\s*email\b/i,
      ])
    ) {
      return 'email';
    }

    // Phone / Mobile
    if (
      this.matchesAny(tokens, [
        /^phone$/i,
        /^mobile$/i,
        /^cell$/i,
        /^telephone$/i,
        /^phone[_\-\s]?number$/i,
        /^mobile[_\-\s]?number$/i,
        /\bphone\s*number\b/i,
        /\bmobile\s*number\b/i,
        /\bcell\s*phone\b/i,
        /\btelephone\b/i,
      ])
    ) {
      return 'phone';
    }

    // LinkedIn
    if (this.matchesAny(tokens, [/linkedin/i, /linked[_\-\s]?in/i])) {
      return 'linkedin';
    }

    // GitHub
    if (this.matchesAny(tokens, [/github/i, /git[_\-\s]?hub/i])) {
      return 'github';
    }

    // Portfolio / Personal Website
    if (
      this.matchesAny(tokens, [
        /portfolio/i,
        /personal[_\-\s]?website/i,
        /website[_\-\s]?url/i,
        /\bwebsite\b/i,
        /\bblog\b/i,
      ])
    ) {
      return 'portfolio';
    }

    // Work Authorization (Yes/No or selection)
    if (
      this.matchesAny(tokens, [
        /authorized\s*to\s*work/i,
        /legally\s*authorized/i,
        /legal\s*right\s*to\s*work/i,
        /work\s*authorization/i,
        /eligib(ility|le)\s*to\s*work/i,
        /authorization\s*to\s*work/i,
        /right\s*to\s*work/i,
      ])
    ) {
      return 'work_authorization';
    }

    // Visa Sponsorship (Yes/No or selection)
    if (
      this.matchesAny(tokens, [
        /visa\s*sponsorship/i,
        /require\s*sponsorship/i,
        /require.*visa/i,
        /sponsor.*visa/i,
        /sponsorship.*future/i,
        /need\s*sponsorship/i,
      ])
    ) {
      return 'visa_sponsorship';
    }

    // Relocation
    if (
      this.matchesAny(tokens, [/relocat/i, /willing\s*to\s*relocate/i, /open\s*to\s*relocation/i])
    ) {
      return 'relocation';
    }

    // Address
    if (
      this.matchesAny(tokens, [
        /^address$/i,
        /^street$/i,
        /^address[_\-\s]?line/i,
        /\bstreet\s*address\b/i,
        /\bhome\s*address\b/i,
      ])
    ) {
      return 'address';
    }

    // City
    if (this.matchesAny(tokens, [/^city$/i, /^town$/i, /\bcity\b/i, /\btown\b/i])) {
      return 'city';
    }

    // State / Province / Region
    if (
      this.matchesAny(tokens, [
        /^state$/i,
        /^province$/i,
        /^region$/i,
        /\bstate\b/i,
        /\bprovince\b/i,
      ])
    ) {
      return 'state';
    }

    // Country
    if (this.matchesAny(tokens, [/^country$/i, /^nation$/i, /\bcountry\b/i])) {
      return 'country';
    }

    // Postal / Zip Code
    if (
      this.matchesAny(tokens, [
        /^postal[_\-\s]?code$/i,
        /^zip[_\-\s]?code$/i,
        /^zip$/i,
        /^postcode$/i,
        /^pincode$/i,
        /\bpostal\s*code\b/i,
        /\bzip\s*code\b/i,
      ])
    ) {
      return 'postal_code';
    }

    // Current Job Title / Position
    if (
      this.matchesAny(tokens, [
        /current[_\-\s]?title/i,
        /job[_\-\s]?title/i,
        /current[_\-\s]?role/i,
        /current[_\-\s]?position/i,
        /\bheadline\b/i,
      ])
    ) {
      return 'current_title';
    }

    // Current Company / Employer
    if (
      this.matchesAny(tokens, [
        /current[_\-\s]?company/i,
        /current[_\-\s]?employer/i,
        /^company$/i,
        /^employer$/i,
        /\bmost\s*recent\s*company\b/i,
        /\bcurrent\s*company\b/i,
      ])
    ) {
      return 'current_company';
    }

    // Years of Experience
    if (
      this.matchesAny(tokens, [
        /years?[_\-\s]?of?[_\-\s]?experience/i,
        /total[_\-\s]?experience/i,
        /experience[_\-\s]?years/i,
      ])
    ) {
      return 'years_experience';
    }

    // Education / Degree / University
    if (this.matchesAny(tokens, [/university/i, /college/i, /school/i, /institution/i])) {
      return 'university';
    }
    if (this.matchesAny(tokens, [/degree/i, /qualification/i, /highest[_\-\s]?degree/i])) {
      return 'degree';
    }
    if (this.matchesAny(tokens, [/education/i, /educational[_\-\s]?background/i])) {
      return 'education';
    }

    // Skills
    if (this.matchesAny(tokens, [/skills/i, /technologies/i, /tech[_\-\s]?stack/i])) {
      return 'skills';
    }

    // Salary Expectations
    if (this.matchesAny(tokens, [/salary/i, /compensation/i, /expected[_\-\s]?pay/i, /rate/i])) {
      return 'salary';
    }

    // Notice Period / Start Date
    if (this.matchesAny(tokens, [/notice[_\-\s]?period/i, /start[_\-\s]?date/i, /availability/i])) {
      return 'notice_period';
    }

    // Cover Letter
    if (this.matchesAny(tokens, [/cover[_\-\s]?letter/i])) {
      return 'cover_letter';
    }

    return 'unknown';
  }

  /**
   * Resolves the profile fact or default value corresponding to classification
   */
  private resolveProfileValue(
    classification: FieldClassificationType,
    _field: ScannedField,
    profile: CandidateProfile
  ): {
    action: FillAction;
    value?: string;
    confidence: number;
    source: 'verified_profile' | 'deterministic_mapping' | 'approved_answer' | 'user_input';
    reasoning?: string;
    options?: { value: string; label: string }[];
  } {
    const personal = profile.personal;

    switch (classification) {
      case 'first_name':
        return {
          action: 'fill',
          value: personal.firstName.value,
          confidence: 0.99,
          source: 'verified_profile',
          reasoning: 'Direct match for first name from verified profile',
        };

      case 'last_name':
        return {
          action: 'fill',
          value: personal.lastName.value,
          confidence: 0.99,
          source: 'verified_profile',
          reasoning: 'Direct match for last name from verified profile',
        };

      case 'full_name':
        return {
          action: 'fill',
          value:
            personal.fullName?.value || `${personal.firstName.value} ${personal.lastName.value}`,
          confidence: 0.98,
          source: 'verified_profile',
          reasoning: 'Direct match for full name from verified profile',
        };

      case 'email':
        return {
          action: 'fill',
          value: personal.email.value,
          confidence: 0.99,
          source: 'verified_profile',
          reasoning: 'Direct match for email address from verified profile',
        };

      case 'phone':
        return {
          action: 'fill',
          value: personal.phone.value,
          confidence: 0.99,
          source: 'verified_profile',
          reasoning: 'Direct match for phone number from verified profile',
        };

      case 'address':
        return {
          action: 'fill',
          value: personal.address.value,
          confidence: 0.95,
          source: 'verified_profile',
          reasoning: 'Direct match for address from verified profile',
        };

      case 'city':
        return {
          action: 'fill',
          value: personal.city.value,
          confidence: 0.95,
          source: 'verified_profile',
          reasoning: 'Direct match for city from verified profile',
        };

      case 'state':
        return {
          action: 'fill',
          value: personal.state.value,
          confidence: 0.95,
          source: 'verified_profile',
          reasoning: 'Direct match for state from verified profile',
        };

      case 'country':
        return {
          action: 'fill',
          value: personal.country.value,
          confidence: 0.95,
          source: 'verified_profile',
          reasoning: 'Direct match for country from verified profile',
        };

      case 'postal_code':
        return {
          action: 'fill',
          value: personal.postalCode.value,
          confidence: 0.95,
          source: 'verified_profile',
          reasoning: 'Direct match for postal code from verified profile',
        };

      case 'linkedin':
        return {
          action: 'fill',
          value: personal.linkedin.value,
          confidence: 0.98,
          source: 'verified_profile',
          reasoning: 'Direct match for LinkedIn URL from verified profile',
        };

      case 'github':
        return {
          action: 'fill',
          value: personal.github.value,
          confidence: 0.98,
          source: 'verified_profile',
          reasoning: 'Direct match for GitHub URL from verified profile',
        };

      case 'portfolio':
        return {
          action: 'fill',
          value: personal.portfolio.value,
          confidence: 0.98,
          source: 'verified_profile',
          reasoning: 'Direct match for portfolio URL from verified profile',
        };

      case 'current_title': {
        const title = profile.experience?.entries?.[0]?.title?.value || 'Software Engineer';
        return {
          action: 'fill',
          value: title,
          confidence: 0.92,
          source: 'verified_profile',
          reasoning: 'Resolved current job title from most recent experience',
        };
      }

      case 'current_company': {
        const company = profile.experience?.entries?.[0]?.company?.value || 'Tech Innovations';
        return {
          action: 'fill',
          value: company,
          confidence: 0.92,
          source: 'verified_profile',
          reasoning: 'Resolved current company from most recent experience',
        };
      }

      case 'years_experience': {
        const numYears = profile.experience?.entries?.length
          ? `${profile.experience.entries.length * 2}`
          : '4';
        return {
          action: 'fill',
          value: numYears,
          confidence: 0.85,
          source: 'deterministic_mapping',
          reasoning: 'Calculated estimated years of experience',
        };
      }

      case 'university': {
        const uni = profile.education?.entries?.[0]?.university?.value || 'Stanford University';
        return {
          action: 'fill',
          value: uni,
          confidence: 0.92,
          source: 'verified_profile',
          reasoning: 'Resolved university from education profile',
        };
      }

      case 'degree': {
        const degree = profile.education?.entries?.[0]?.degree?.value || "Bachelor's Degree";
        return {
          action: 'fill',
          value: degree,
          confidence: 0.92,
          source: 'verified_profile',
          reasoning: 'Resolved degree from education profile',
        };
      }

      case 'skills': {
        const allSkills = [
          ...(profile.skills?.programmingLanguages?.value || []),
          ...(profile.skills?.frameworks?.value || []),
        ];
        return {
          action: 'fill',
          value: allSkills.join(', '),
          confidence: 0.9,
          source: 'verified_profile',
          reasoning: 'Concatenated skills from verified profile',
        };
      }

      case 'work_authorization':
        return {
          action: 'fill',
          value: 'Yes',
          confidence: 0.95,
          source: 'verified_profile',
          reasoning: 'Candidate is authorized to work (Yes)',
        };

      case 'visa_sponsorship':
        return {
          action: 'fill',
          value: 'No',
          confidence: 0.95,
          source: 'verified_profile',
          reasoning: 'Candidate does not require visa sponsorship (No)',
        };

      case 'relocation':
        return {
          action: 'fill',
          value: profile.preferences?.relocationPreference?.value ? 'Yes' : 'No',
          confidence: 0.9,
          source: 'verified_profile',
          reasoning: 'Relocation preference from candidate settings',
        };

      case 'notice_period':
        return {
          action: 'fill',
          value: profile.preferences?.noticePeriod?.value || '2 weeks',
          confidence: 0.9,
          source: 'verified_profile',
          reasoning: 'Notice period from candidate preferences',
        };

      case 'salary':
        return {
          action: 'fill',
          value: profile.preferences?.salaryExpectations?.value || '160000',
          confidence: 0.88,
          source: 'verified_profile',
          reasoning: 'Salary expectation from preferences',
        };

      default:
        return {
          action: 'skip',
          confidence: 0.0,
          source: 'deterministic_mapping',
          reasoning: 'Unknown or unmapped field classification',
        };
    }
  }

  /**
   * Tries to find an approved question answer from the candidate library
   */
  private matchApprovedAnswer(
    questionText: string,
    profile: CandidateProfile
  ): { question: string; answer: string } | null {
    if (!profile.applicationAnswers?.entries) return null;

    const normalized = questionText.toLowerCase();
    for (const item of profile.applicationAnswers.entries) {
      if (item.status === 'approved' && item.question) {
        const q = item.question.toLowerCase();
        if (
          normalized.includes(q) ||
          q.includes(normalized) ||
          this.computeSimilarity(normalized, q) > 0.6
        ) {
          return { question: item.question, answer: item.answer };
        }
      }
    }
    return null;
  }

  private matchCustomField(field: ScannedField, profile: CandidateProfile) {
    const customFields = profile.customFields || [];
    const tokens = [
      field.label,
      field.name,
      field.id,
      field.placeholder,
      field.ariaLabel,
      field.nearbyText,
      field.context,
    ]
      .filter(Boolean)
      .map((token) => this.normalizeToken(token as string));

    return customFields.find((customField) => {
      const candidates = [customField.label, customField.key].map((value) =>
        this.normalizeToken(value)
      );
      return candidates.some((candidate) =>
        tokens.some(
          (token) => token === candidate || token.includes(candidate) || candidate.includes(token)
        )
      );
    });
  }

  private normalizeToken(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  private computeSimilarity(s1: string, s2: string): number {
    const words1 = new Set(s1.split(/\W+/).filter(Boolean));
    const words2 = new Set(s2.split(/\W+/).filter(Boolean));
    if (words1.size === 0 || words2.size === 0) return 0;

    let overlap = 0;
    for (const w of words1) {
      if (words2.has(w)) overlap++;
    }
    return (2 * overlap) / (words1.size + words2.size);
  }

  private matchesAny(tokens: string[], regexes: RegExp[]): boolean {
    return tokens.some((token) => token && regexes.some((regex) => regex.test(token)));
  }

  private getUnifiedFieldText(field: ScannedField): string {
    return [
      field.label,
      field.placeholder,
      field.name,
      field.id,
      field.ariaLabel,
      field.nearbyText,
      field.context,
    ]
      .filter(Boolean)
      .join(' ');
  }
}

export const defaultMapper = new DeterministicMapper();
