/**
 * Core type definitions for AI Job Application Agent
 * These types are shared between the web app and Chrome extension
 */

// ============================================
// Source Metadata
// ============================================

export type FactSource = 'resume' | 'user_input' | 'user_approved_ai' | 'ai_generated';

export interface VerifiedFact<T> {
  value: T;
  source: FactSource;
  verified: boolean;
  extractedAt?: string;
  updatedAt?: string;
}

// ============================================
// Personal Information
// ============================================

export interface PersonalInfo {
  firstName: VerifiedFact<string>;
  lastName: VerifiedFact<string>;
  fullName: VerifiedFact<string>;
  email: VerifiedFact<string>;
  phone: VerifiedFact<string>;
  address: VerifiedFact<string>;
  city: VerifiedFact<string>;
  state: VerifiedFact<string>;
  country: VerifiedFact<string>;
  postalCode: VerifiedFact<string>;
  linkedin: VerifiedFact<string>;
  github: VerifiedFact<string>;
  portfolio: VerifiedFact<string>;
}

// ============================================
// Education
// ============================================

export interface EducationEntry {
  id: string;
  university: VerifiedFact<string>;
  degree: VerifiedFact<string>;
  field: VerifiedFact<string>;
  startDate: VerifiedFact<string>;
  endDate: VerifiedFact<string>;
  gpa?: VerifiedFact<string>;
  additional?: VerifiedFact<string>;
}

export interface Education {
  entries: EducationEntry[];
}

// ============================================
// Experience
// ============================================

export interface ExperienceEntry {
  id: string;
  company: VerifiedFact<string>;
  title: VerifiedFact<string>;
  startDate: VerifiedFact<string>;
  endDate: VerifiedFact<string>;
  description: VerifiedFact<string>;
  responsibilities: VerifiedFact<string[]>;
  achievements: VerifiedFact<string[]>;
  technologies: VerifiedFact<string[]>;
}

export interface Experience {
  entries: ExperienceEntry[];
}

// ============================================
// Skills
// ============================================

export interface Skills {
  programmingLanguages: VerifiedFact<string[]>;
  frameworks: VerifiedFact<string[]>;
  databases: VerifiedFact<string[]>;
  cloud: VerifiedFact<string[]>;
  tools: VerifiedFact<string[]>;
  other: VerifiedFact<string[]>;
}

// ============================================
// Projects
// ============================================

export interface ProjectEntry {
  id: string;
  name: VerifiedFact<string>;
  description: VerifiedFact<string>;
  technologies: VerifiedFact<string[]>;
  url: VerifiedFact<string>;
  responsibilities: VerifiedFact<string[]>;
}

export interface Projects {
  entries: ProjectEntry[];
}

// ============================================
// Preferences
// ============================================

export interface Preferences {
  desiredRoles: VerifiedFact<string[]>;
  desiredLocations: VerifiedFact<string[]>;
  remotePreference: VerifiedFact<'remote' | 'hybrid' | 'onsite' | 'any'>;
  relocationPreference: VerifiedFact<boolean>;
  salaryExpectations: VerifiedFact<string>;
  noticePeriod: VerifiedFact<string>;
}

// ============================================
// Application Answers
// ============================================

export interface ApplicationAnswer {
  id: string;
  question: string;
  answer: string;
  status: 'approved' | 'ai_generated' | 'draft';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationAnswers {
  entries: ApplicationAnswer[];
}

// ============================================
// Custom Fields
// ============================================

export interface CustomFieldEntry {
  id: string;
  label: string;
  key: string;
  value: string;
  category?: 'personal' | 'screening' | 'preferences' | 'other';
  verified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// Complete Candidate Profile
// ============================================

export interface CandidateProfile {
  id: string;
  userId: string;
  personal: PersonalInfo;
  education: Education;
  experience: Experience;
  skills: Skills;
  projects: Projects;
  preferences: Preferences;
  applicationAnswers: ApplicationAnswers;
  customFields?: CustomFieldEntry[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Field Classification
// ============================================

export type FieldClassificationType =
  | 'first_name'
  | 'last_name'
  | 'full_name'
  | 'email'
  | 'phone'
  | 'address'
  | 'city'
  | 'state'
  | 'country'
  | 'postal_code'
  | 'linkedin'
  | 'github'
  | 'portfolio'
  | 'resume'
  | 'cover_letter'
  | 'current_company'
  | 'current_title'
  | 'years_experience'
  | 'skills'
  | 'education'
  | 'degree'
  | 'university'
  | 'salary'
  | 'notice_period'
  | 'work_authorization'
  | 'visa_sponsorship'
  | 'relocation'
  | 'yes_no'
  | 'multiple_choice'
  | 'free_text'
  | 'sensitive'
  | 'unknown';

export interface FieldClassification {
  fieldId: string;
  classification: FieldClassificationType;
  confidence: number;
  reasoning?: string;
  options?: string[]; // For multiple_choice fields
}

export interface FieldClassificationInput {
  fields: ScannedField[];
  jobInfo?: JobInfo;
}

export interface FieldClassificationResult {
  classifications: FieldClassification[];
  timestamp: string;
}

// ============================================
// Scanned Field (from DOM Scanner)
// ============================================

export interface ScannedField {
  fieldId: string;
  tag: string;
  type: string;
  name?: string;
  id?: string;
  placeholder?: string;
  ariaLabel?: string;
  label?: string;
  nearbyText?: string;
  required: boolean;
  visible: boolean;
  currentValue?: string;
  options?: string[];
  domOrder: number;
  context?: string;
}

// ============================================
// Job Information
// ============================================

export interface JobInfo {
  title?: string;
  company?: string;
  location?: string;
  employmentType?: string;
  description?: string;
  requirements?: string;
  requiredSkills?: string[];
  experienceRequirements?: string;
  salary?: string;
  url: string;
  extractedAt: string;
}

// ============================================
// Fill Plan
// ============================================

export type FillAction = 'fill' | 'skip' | 'ask_user' | 'do_not_answer';

export interface FillPlanEntry {
  fieldId: string;
  classification: FieldClassificationType;
  action: FillAction;
  value?: string;
  confidence: number;
  source: 'verified_profile' | 'deterministic_mapping' | 'ai_generated' | 'approved_answer' | 'user_input';
  reasoning?: string;
  options?: { value: string; label: string }[]; // For dropdowns
}

export interface FillPlan {
  entries: FillPlanEntry[];
  jobInfo: JobInfo;
  profileId: string;
  createdAt: string;
}

// ============================================
// AI Answer Generation
// ============================================

export interface AnswerGenerationInput {
  question: string;
  jobInfo: JobInfo;
  candidateProfile: CandidateProfile;
  classification: FieldClassificationType;
}

export interface AnswerGenerationResult {
  answer: string;
  confidence: number;
  source: 'ai_generated';
  reasoning: string;
}

// ============================================
// Application History
// ============================================

export interface ApplicationHistoryEntry {
  id: string;
  company: string;
  jobTitle: string;
  url: string;
  location?: string;
  appliedAt: string;
  status: 'draft' | 'submitted' | 'interviewing' | 'rejected' | 'offer' | 'withdrawn';
  questionsEncountered: string[];
  fieldsFilled: number;
  generatedAnswers: string[];
  approvedAnswers: string[];
  errors: string[];
  fillPlanId?: string;
}

// ============================================
// Extension Messages
// ============================================

export interface ExtensionMessage {
  type: string;
  payload: unknown;
  requestId?: string;
}

export interface ScanPageMessage extends ExtensionMessage {
  type: 'SCAN_PAGE';
  payload: { url: string };
}

export interface FillFormMessage extends ExtensionMessage {
  type: 'FILL_FORM';
  payload: FillPlan;
}

export interface GetProfileMessage extends ExtensionMessage {
  type: 'GET_PROFILE';
  payload: { profileId: string };
}

// ============================================
// API Request/Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}