/**
 * Shared constants for AI Job Application Agent
 */

// ============================================
// Field Classification Types
// ============================================

export const FIELD_CLASSIFICATION_TYPES = [
  'first_name',
  'last_name',
  'full_name',
  'email',
  'phone',
  'address',
  'city',
  'state',
  'country',
  'postal_code',
  'linkedin',
  'github',
  'portfolio',
  'resume',
  'cover_letter',
  'current_company',
  'current_title',
  'years_experience',
  'skills',
  'education',
  'degree',
  'university',
  'salary',
  'notice_period',
  'work_authorization',
  'visa_sponsorship',
  'relocation',
  'yes_no',
  'multiple_choice',
  'free_text',
  'sensitive',
  'unknown',
] as const;

export type FieldClassificationType = (typeof FIELD_CLASSIFICATION_TYPES)[number];

// ============================================
// Confidence Thresholds
// ============================================

export const CONFIDENCE_THRESHOLDS = {
  AUTO_FILL: 0.95,
  FILL_AND_HIGHLIGHT: 0.8,
  ASK_USER: 0.6,
  DO_NOT_FILL: 0.6,
} as const;

export type ConfidenceLevel = 'auto_fill' | 'fill_and_highlight' | 'ask_user' | 'do_not_fill';

export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= CONFIDENCE_THRESHOLDS.AUTO_FILL) return 'auto_fill';
  if (confidence >= CONFIDENCE_THRESHOLDS.FILL_AND_HIGHLIGHT) return 'fill_and_highlight';
  if (confidence >= CONFIDENCE_THRESHOLDS.ASK_USER) return 'ask_user';
  return 'do_not_fill';
}

// ============================================
// Fill Actions
// ============================================

export const FILL_ACTIONS = ['fill', 'skip', 'ask_user', 'do_not_answer'] as const;

export type FillAction = (typeof FILL_ACTIONS)[number];

// ============================================
// Fill Priority Order (higher = more priority)
// ============================================

export const FILL_PRIORITY = {
  USER_APPROVED_ANSWER: 100,
  VERIFIED_CANDIDATE_FACT: 90,
  DETERMINISTIC_MAPPING: 80,
  AI_GENERATED_ANSWER: 70,
  ASK_USER: 60,
  DO_NOT_ANSWER: 0,
} as const;

// ============================================
// Sensitive Field Types (require explicit user config)
// ============================================

export const SENSITIVE_FIELD_TYPES: FieldClassificationType[] = [
  'work_authorization',
  'visa_sponsorship',
  'relocation',
  'salary',
  'notice_period',
];

export function isSensitiveField(type: FieldClassificationType): boolean {
  return SENSITIVE_FIELD_TYPES.includes(type);
}

// ============================================
// Deterministic Field Mappings
// ============================================

export const DETERMINISTIC_FIELD_PATTERNS: Record<FieldClassificationType, RegExp[]> = {
  first_name: [/^first[_-]?name$/i, /^fname$/i, /^given[_-]?name$/i, /^firstname$/i],
  last_name: [/^last[_-]?name$/i, /^lname$/i, /^surname$/i, /^familyname$/i, /^lastname$/i],
  full_name: [/^full[_-]?name$/i, /^name$/i, /^fullname$/i],
  email: [/^email$/i, /^email[_-]?address$/i, /^contact[_-]?email$/i, /^e[_-]?mail$/i],
  phone: [
    /^phone$/i,
    /^phone[_-]?number$/i,
    /^mobile$/i,
    /^cell$/i,
    /^telephone$/i,
    /^contact[_-]?number$/i,
  ],
  address: [/^address$/i, /^street[_-]?address$/i, /^address[_-]?line[_-]?1$/i],
  city: [/^city$/i, /^town$/i],
  state: [/^state$/i, /^province$/i, /^region$/i],
  country: [/^country$/i, /^nation$/i],
  postal_code: [/^postal[_-]?code$/i, /^zip[_-]?code$/i, /^zip$/i, /^postcode$/i],
  linkedin: [/^linkedin$/i, /^linked[_-]?in$/i, /^linkedin[_-]?url$/i, /^linkedin[_-]?profile$/i],
  github: [/^github$/i, /^git[_-]?hub$/i, /^github[_-]?url$/i, /^github[_-]?profile$/i],
  portfolio: [/^portfolio$/i, /^portfolio[_-]?url$/i, /^website$/i, /^personal[_-]?website$/i],
  resume: [/^resume$/i, /^cv$/i, /^curriculum[_-]?vitae$/i],
  cover_letter: [/^cover[_-]?letter$/i, /^coverletter$/i],
  current_company: [/^current[_-]?company$/i, /^employer$/i, /^company$/i],
  current_title: [/^current[_-]?title$/i, /^job[_-]?title$/i, /^position$/i, /^role$/i],
  years_experience: [
    /^years?[_-]?of?[_-]?experience$/i,
    /^experience[_-]?years$/i,
    /^total[_-]?experience$/i,
  ],
  skills: [/^skills$/i, /^technical[_-]?skills$/i, /^competencies$/i],
  education: [/^education$/i, /^educational[_-]?background$/i],
  degree: [/^degree$/i, /^qualification$/i],
  university: [/^university$/i, /^college$/i, /^institution$/i, /^school$/i],
  salary: [/^salary$/i, /^expected[_-]?salary$/i, /^desired[_-]?salary$/i, /^compensation$/i],
  notice_period: [/^notice[_-]?period$/i, /^availability$/i, /^start[_-]?date$/i],
  work_authorization: [
    /^work[_-]?authorization$/i,
    /^authorized[_-]?to[_-]?work$/i,
    /^employment[_-]?authorization$/i,
  ],
  visa_sponsorship: [
    /^visa[_-]?sponsorship$/i,
    /^require[_-]?sponsorship$/i,
    /^will.*require.*sponsor/i,
    /^sponsor.*visa/i,
  ],
  relocation: [/^relocation$/i, /^willing[_-]?to[_-]?relocate$/i, /^open[_-]?to[_-]?relocation$/i],
  yes_no: [/^yes[_-]?no$/i, /^true[_-]?false$/i],
  multiple_choice: [],
  free_text: [],
  sensitive: [],
  unknown: [],
};

// ============================================
// Field Classification Type Labels (for UI)
// ============================================

export const FIELD_CLASSIFICATION_LABELS: Record<FieldClassificationType, string> = {
  first_name: 'First Name',
  last_name: 'Last Name',
  full_name: 'Full Name',
  email: 'Email',
  phone: 'Phone',
  address: 'Address',
  city: 'City',
  state: 'State',
  country: 'Country',
  postal_code: 'Postal Code',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  portfolio: 'Portfolio',
  resume: 'Resume',
  cover_letter: 'Cover Letter',
  current_company: 'Current Company',
  current_title: 'Current Title',
  years_experience: 'Years of Experience',
  skills: 'Skills',
  education: 'Education',
  degree: 'Degree',
  university: 'University',
  salary: 'Salary Expectations',
  notice_period: 'Notice Period',
  work_authorization: 'Work Authorization',
  visa_sponsorship: 'Visa Sponsorship',
  relocation: 'Relocation',
  yes_no: 'Yes/No Question',
  multiple_choice: 'Multiple Choice',
  free_text: 'Free Text',
  sensitive: 'Sensitive Information',
  unknown: 'Unknown',
};

// ============================================
// Status Icons for Review UI
// ============================================

export const FIELD_STATUS_ICONS = {
  auto_filled: '✓',
  ai_generated: '✦',
  needs_review: '⚠',
  failed: '✕',
  unknown: '?',
  skipped: '⊘',
  user_filled: '✎',
} as const;

export type FieldStatus = keyof typeof FIELD_STATUS_ICONS;

// ============================================
// API Endpoints
// ============================================

export const API_ENDPOINTS = {
  PROFILE: '/api/profile',
  RESUME: '/api/resume',
  JOBS_ANALYZE: '/api/jobs/analyze',
  APPLICATION_ANALYZE: '/api/application/analyze',
  APPLICATION_FILL_PLAN: '/api/application/fill-plan',
  APPLICATION_GENERATE_ANSWER: '/api/application/generate-answer',
  APPLICATION_LOG: '/api/application/log',
  APPLICATIONS: '/api/applications',
  APPLICATION_BY_ID: (id: string) => `/api/applications/${id}`,
} as const;

// ============================================
// Extension Message Types
// ============================================

export const EXTENSION_MESSAGE_TYPES = {
  SCAN_PAGE: 'SCAN_PAGE',
  FILL_FORM: 'FILL_FORM',
  GET_PROFILE: 'GET_PROFILE',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  PAGE_DETECTED: 'PAGE_DETECTED',
  FORM_DETECTED: 'FORM_DETECTED',
  FIELD_SCANNED: 'FIELD_SCANNED',
  FILL_COMPLETE: 'FILL_COMPLETE',
  FILL_ERROR: 'FILL_ERROR',
  REQUEST_PROFILE: 'REQUEST_PROFILE',
  PROFILE_RESPONSE: 'PROFILE_RESPONSE',
} as const;

// ============================================
// Storage Keys
// ============================================

export const STORAGE_KEYS = {
  PROFILE_ID: 'ai_job_agent_profile_id',
  AUTH_TOKEN: 'ai_job_agent_auth_token',
  SETTINGS: 'ai_job_agent_settings',
  CACHED_PROFILE: 'ai_job_agent_cached_profile',
  LAST_FILL_PLAN: 'ai_job_agent_last_fill_plan',
} as const;

// ============================================
// Default Values
// ============================================

export const DEFAULT_VALUES = {
  REMOTE_PREFERENCE: 'any' as const,
  RELOCATION_PREFERENCE: false,
  CONFIDENCE_DECIMAL_PLACES: 2,
  MAX_FIELD_SCAN_DEPTH: 10,
  SCAN_DEBOUNCE_MS: 300,
  FILL_VERIFY_RETRIES: 3,
  FILL_VERIFY_DELAY_MS: 100,
} as const;

// ============================================
// Regex Patterns for Job Extraction
// ============================================

export const JOB_EXTRACTION_PATTERNS = {
  TITLE_SELECTORS: [
    '[data-testid="job-title"]',
    '[data-automation-id="jobTitle"]',
    '.job-title',
    '.jobTitle',
    'h1.job-title',
    'h1[data-cy="job-title"]',
    'h1',
  ],
  COMPANY_SELECTORS: [
    '[data-testid="company-name"]',
    '[data-automation-id="companyName"]',
    '.company-name',
    '.companyName',
    '.employer-name',
  ],
  LOCATION_SELECTORS: [
    '[data-testid="job-location"]',
    '[data-automation-id="jobLocation"]',
    '.job-location',
    '.location',
    '[data-cy="job-location"]',
  ],
  DESCRIPTION_SELECTORS: [
    '[data-testid="job-description"]',
    '[data-automation-id="jobDescription"]',
    '.job-description',
    '.description',
    '#job-description',
  ],
} as const;

// ============================================
// Form Detection Keywords
// ============================================

export const FORM_DETECTION_KEYWORDS = [
  'apply',
  'application',
  'careers',
  'jobs',
  'position',
  'role',
  'candidate',
  'resume',
  'cv',
  'cover letter',
  'work authorization',
  'visa',
  'sponsorship',
  'relocation',
  'salary',
  'experience',
  'education',
  'skills',
  'university',
  'degree',
  'linkedin',
  'github',
  'portfolio',
] as const;

// ============================================
// Supported File Types for Resume Upload
// ============================================

export const SUPPORTED_RESUME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
] as const;

export const SUPPORTED_RESUME_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt'] as const;

// ============================================
// Default / Initial Candidate Profile
// ============================================

export const DEFAULT_CANDIDATE_PROFILE = {
  id: 'default-profile',
  userId: 'default-user',
  personal: {
    firstName: { value: 'Sarthak', source: 'user_input', verified: true },
    lastName: { value: 'Gupta', source: 'user_input', verified: true },
    fullName: { value: 'Sarthak Gupta', source: 'user_input', verified: true },
    email: { value: 'sarthak@example.com', source: 'user_input', verified: true },
    phone: { value: '+1 (555) 234-5678', source: 'user_input', verified: true },
    address: { value: '123 Tech Boulevard', source: 'user_input', verified: true },
    city: { value: 'San Francisco', source: 'user_input', verified: true },
    state: { value: 'California', source: 'user_input', verified: true },
    country: { value: 'United States', source: 'user_input', verified: true },
    postalCode: { value: '94105', source: 'user_input', verified: true },
    linkedin: {
      value: 'https://linkedin.com/in/sarthakgupta',
      source: 'user_input',
      verified: true,
    },
    github: { value: 'https://github.com/sarthakgupta', source: 'user_input', verified: true },
    portfolio: { value: 'https://sarthakgupta.dev', source: 'user_input', verified: true },
  },
  education: {
    entries: [
      {
        id: 'edu-1',
        university: { value: 'Stanford University', source: 'user_input', verified: true },
        degree: { value: "Master's Degree", source: 'user_input', verified: true },
        field: { value: 'Computer Science', source: 'user_input', verified: true },
        startDate: { value: '2019-09', source: 'user_input', verified: true },
        endDate: { value: '2021-06', source: 'user_input', verified: true },
        gpa: { value: '3.9', source: 'user_input', verified: true },
      },
    ],
  },
  experience: {
    entries: [
      {
        id: 'exp-1',
        company: { value: 'Tech Innovations Inc.', source: 'user_input', verified: true },
        title: { value: 'Senior Software Engineer', source: 'user_input', verified: true },
        startDate: { value: '2021-07', source: 'user_input', verified: true },
        endDate: { value: 'Present', source: 'user_input', verified: true },
        description: {
          value: 'Leading full-stack engineering and cloud automation.',
          source: 'user_input',
          verified: true,
        },
        responsibilities: {
          value: ['Architected microservices', 'Spearheaded frontend redesign'],
          source: 'user_input',
          verified: true,
        },
        achievements: {
          value: ['Improved app latency by 45%'],
          source: 'user_input',
          verified: true,
        },
        technologies: {
          value: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS'],
          source: 'user_input',
          verified: true,
        },
      },
    ],
  },
  skills: {
    programmingLanguages: {
      value: ['TypeScript', 'JavaScript', 'Python', 'Go', 'SQL'],
      source: 'user_input',
      verified: true,
    },
    frameworks: {
      value: ['React', 'Next.js', 'Node.js', 'Express', 'TailwindCSS', 'Ant Design'],
      source: 'user_input',
      verified: true,
    },
    databases: { value: ['PostgreSQL', 'MongoDB', 'Redis'], source: 'user_input', verified: true },
    cloud: { value: ['AWS', 'Docker', 'Kubernetes', 'GCP'], source: 'user_input', verified: true },
    tools: {
      value: ['Git', 'Vite', 'Webpack', 'Jest', 'Playwright'],
      source: 'user_input',
      verified: true,
    },
    other: {
      value: ['REST APIs', 'GraphQL', 'System Design', 'Agile'],
      source: 'user_input',
      verified: true,
    },
  },
  projects: {
    entries: [
      {
        id: 'proj-1',
        name: { value: 'AI Job Application Agent', source: 'user_input', verified: true },
        description: {
          value:
            'Intelligent automated job application assistant Chrome extension and web dashboard.',
          source: 'user_input',
          verified: true,
        },
        technologies: {
          value: ['TypeScript', 'React', 'Next.js', 'Chrome Extension MV3'],
          source: 'user_input',
          verified: true,
        },
        url: {
          value: 'https://github.com/sarthakgupta/ai-job-agent',
          source: 'user_input',
          verified: true,
        },
        responsibilities: {
          value: ['Built DOM scanner and form filling engine'],
          source: 'user_input',
          verified: true,
        },
      },
    ],
  },
  preferences: {
    desiredRoles: {
      value: ['Senior Software Engineer', 'Full Stack Engineer', 'Frontend Engineer'],
      source: 'user_input',
      verified: true,
    },
    desiredLocations: {
      value: ['San Francisco, CA', 'Remote'],
      source: 'user_input',
      verified: true,
    },
    remotePreference: { value: 'remote' as const, source: 'user_input', verified: true },
    relocationPreference: { value: true, source: 'user_input', verified: true },
    salaryExpectations: { value: '$160,000 - $190,000', source: 'user_input', verified: true },
    noticePeriod: { value: '2 weeks', source: 'user_input', verified: true },
  },
  applicationAnswers: {
    entries: [
      {
        id: 'ans-1',
        question: 'Why are you interested in this role?',
        answer:
          'I am excited about building scalable web applications and leveraging AI to streamline user workflows.',
        status: 'approved' as const,
        tags: ['interest', 'general'],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  },
  customFields: [
    {
      id: 'custom-1',
      label: 'Security Clearance',
      key: 'clearance_level',
      value: 'None / Eligible',
      category: 'screening',
      verified: true,
    },
    {
      id: 'custom-2',
      label: 'US Veteran Status',
      key: 'veteran_status',
      value: 'I am not a protected veteran',
      category: 'screening',
      verified: true,
    },
    {
      id: 'custom-3',
      label: 'Preferred Pronouns',
      key: 'pronouns',
      value: 'He/Him',
      category: 'personal',
      verified: true,
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
