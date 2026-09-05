/**
 * Zod schemas for validation
 * These schemas mirror the types and provide runtime validation
 */

import { z } from 'zod';

// ============================================
// Source Metadata
// ============================================

export const FactSourceSchema = z.enum(['resume', 'user_input', 'user_approved_ai', 'ai_generated']);

export const VerifiedFactSchema = z.object({
  value: z.unknown(),
  source: FactSourceSchema,
  verified: z.boolean(),
  extractedAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type VerifiedFact<T> = z.infer<typeof VerifiedFactSchema> & { value: T };

// ============================================
// Personal Information
// ============================================

export const PersonalInfoSchema = z.object({
  firstName: VerifiedFactSchema,
  lastName: VerifiedFactSchema,
  fullName: VerifiedFactSchema,
  email: VerifiedFactSchema,
  phone: VerifiedFactSchema,
  address: VerifiedFactSchema,
  city: VerifiedFactSchema,
  state: VerifiedFactSchema,
  country: VerifiedFactSchema,
  postalCode: VerifiedFactSchema,
  linkedin: VerifiedFactSchema,
  github: VerifiedFactSchema,
  portfolio: VerifiedFactSchema,
});

// ============================================
// Education
// ============================================

export const EducationEntrySchema = z.object({
  id: z.string(),
  university: VerifiedFactSchema,
  degree: VerifiedFactSchema,
  field: VerifiedFactSchema,
  startDate: VerifiedFactSchema,
  endDate: VerifiedFactSchema,
  gpa: VerifiedFactSchema.optional(),
  additional: VerifiedFactSchema.optional(),
});

export const EducationSchema = z.object({
  entries: z.array(EducationEntrySchema),
});

// ============================================
// Experience
// ============================================

export const ExperienceEntrySchema = z.object({
  id: z.string(),
  company: VerifiedFactSchema,
  title: VerifiedFactSchema,
  startDate: VerifiedFactSchema,
  endDate: VerifiedFactSchema,
  description: VerifiedFactSchema,
  responsibilities: VerifiedFactSchema,
  achievements: VerifiedFactSchema,
  technologies: VerifiedFactSchema,
});

export const ExperienceSchema = z.object({
  entries: z.array(ExperienceEntrySchema),
});

// ============================================
// Skills
// ============================================

export const SkillsSchema = z.object({
  programmingLanguages: VerifiedFactSchema,
  frameworks: VerifiedFactSchema,
  databases: VerifiedFactSchema,
  cloud: VerifiedFactSchema,
  tools: VerifiedFactSchema,
  other: VerifiedFactSchema,
});

// ============================================
// Projects
// ============================================

export const ProjectEntrySchema = z.object({
  id: z.string(),
  name: VerifiedFactSchema,
  description: VerifiedFactSchema,
  technologies: VerifiedFactSchema,
  url: VerifiedFactSchema,
  responsibilities: VerifiedFactSchema,
});

export const ProjectsSchema = z.object({
  entries: z.array(ProjectEntrySchema),
});

// ============================================
// Preferences
// ============================================

export const PreferencesSchema = z.object({
  desiredRoles: VerifiedFactSchema,
  desiredLocations: VerifiedFactSchema,
  remotePreference: VerifiedFactSchema,
  relocationPreference: VerifiedFactSchema,
  salaryExpectations: VerifiedFactSchema,
  noticePeriod: VerifiedFactSchema,
});

// ============================================
// Application Answers
// ============================================

export const ApplicationAnswerSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
  status: z.enum(['approved', 'ai_generated', 'draft']),
  tags: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ApplicationAnswersSchema = z.object({
  entries: z.array(ApplicationAnswerSchema),
});

// ============================================
// Complete Candidate Profile
// ============================================

export const CandidateProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  personal: PersonalInfoSchema,
  education: EducationSchema,
  experience: ExperienceSchema,
  skills: SkillsSchema,
  projects: ProjectsSchema,
  preferences: PreferencesSchema,
  applicationAnswers: ApplicationAnswersSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ============================================
// Field Classification
// ============================================

export const FieldClassificationTypeSchema = z.enum([
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
]);

export const FieldClassificationSchema = z.object({
  fieldId: z.string(),
  classification: FieldClassificationTypeSchema,
  confidence: z.number().min(0).max(1),
  reasoning: z.string().optional(),
  options: z.array(z.string()).optional(),
});

export const ScannedFieldSchema = z.object({
  fieldId: z.string(),
  tag: z.string(),
  type: z.string(),
  name: z.string().optional(),
  id: z.string().optional(),
  placeholder: z.string().optional(),
  ariaLabel: z.string().optional(),
  label: z.string().optional(),
  nearbyText: z.string().optional(),
  required: z.boolean(),
  visible: z.boolean(),
  currentValue: z.string().optional(),
  options: z.array(z.string()).optional(),
  domOrder: z.number(),
  context: z.string().optional(),
});

export const FieldClassificationInputSchema = z.object({
  fields: z.array(ScannedFieldSchema),
  jobInfo: z.object({
    title: z.string().optional(),
    company: z.string().optional(),
    location: z.string().optional(),
    employmentType: z.string().optional(),
    description: z.string().optional(),
    requirements: z.string().optional(),
    requiredSkills: z.array(z.string()).optional(),
    experienceRequirements: z.string().optional(),
    salary: z.string().optional(),
    url: z.string(),
    extractedAt: z.string(),
  }).optional(),
});

export const FieldClassificationResultSchema = z.object({
  classifications: z.array(FieldClassificationSchema),
  timestamp: z.string(),
});

// ============================================
// Job Information
// ============================================

export const JobInfoSchema = z.object({
  title: z.string().optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  employmentType: z.string().optional(),
  description: z.string().optional(),
  requirements: z.string().optional(),
  requiredSkills: z.array(z.string()).optional(),
  experienceRequirements: z.string().optional(),
  salary: z.string().optional(),
  url: z.string(),
  extractedAt: z.string(),
});

// ============================================
// Fill Plan
// ============================================

export const FillActionSchema = z.enum(['fill', 'skip', 'ask_user', 'do_not_answer']);

export const FillPlanEntrySchema = z.object({
  fieldId: z.string(),
  classification: FieldClassificationTypeSchema,
  action: FillActionSchema,
  value: z.string().optional(),
  confidence: z.number().min(0).max(1),
  source: z.enum([
    'verified_profile',
    'deterministic_mapping',
    'ai_generated',
    'approved_answer',
    'user_input',
  ]),
  reasoning: z.string().optional(),
  options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});

export const FillPlanSchema = z.object({
  entries: z.array(FillPlanEntrySchema),
  jobInfo: JobInfoSchema,
  profileId: z.string(),
  createdAt: z.string(),
});

// ============================================
// AI Answer Generation
// ============================================

export const AnswerGenerationInputSchema = z.object({
  question: z.string(),
  jobInfo: JobInfoSchema,
  candidateProfile: CandidateProfileSchema,
  classification: FieldClassificationTypeSchema,
});

export const AnswerGenerationResultSchema = z.object({
  answer: z.string(),
  confidence: z.number().min(0).max(1),
  source: z.literal('ai_generated'),
  reasoning: z.string(),
});

// ============================================
// Application History
// ============================================

export const ApplicationHistoryEntrySchema = z.object({
  id: z.string(),
  company: z.string(),
  jobTitle: z.string(),
  url: z.string(),
  location: z.string().optional(),
  appliedAt: z.string(),
  status: z.enum(['draft', 'submitted', 'interviewing', 'rejected', 'offer', 'withdrawn']),
  questionsEncountered: z.array(z.string()),
  fieldsFilled: z.number(),
  generatedAnswers: z.array(z.string()),
  approvedAnswers: z.array(z.string()),
  errors: z.array(z.string()),
  fillPlanId: z.string().optional(),
});

// ============================================
// API Response
// ============================================

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.unknown().optional(),
      })
      .optional(),
  });

// ============================================
// Exported types for inference
// ============================================

export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type EducationEntry = z.infer<typeof EducationEntrySchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type ExperienceEntry = z.infer<typeof ExperienceEntrySchema>;
export type Skills = z.infer<typeof SkillsSchema>;
export type Projects = z.infer<typeof ProjectsSchema>;
export type ProjectEntry = z.infer<typeof ProjectEntrySchema>;
export type Preferences = z.infer<typeof PreferencesSchema>;
export type ApplicationAnswer = z.infer<typeof ApplicationAnswerSchema>;
export type ApplicationAnswers = z.infer<typeof ApplicationAnswersSchema>;
export type CandidateProfile = z.infer<typeof CandidateProfileSchema>;
export type FieldClassificationType = z.infer<typeof FieldClassificationTypeSchema>;
export type FieldClassification = z.infer<typeof FieldClassificationSchema>;
export type ScannedField = z.infer<typeof ScannedFieldSchema>;
export type FieldClassificationInput = z.infer<typeof FieldClassificationInputSchema>;
export type FieldClassificationResult = z.infer<typeof FieldClassificationResultSchema>;
export type JobInfo = z.infer<typeof JobInfoSchema>;
export type FillAction = z.infer<typeof FillActionSchema>;
export type FillPlanEntry = z.infer<typeof FillPlanEntrySchema>;
export type FillPlan = z.infer<typeof FillPlanSchema>;
export type AnswerGenerationInput = z.infer<typeof AnswerGenerationInputSchema>;
export type AnswerGenerationResult = z.infer<typeof AnswerGenerationResultSchema>;
export type ApplicationHistoryEntry = z.infer<typeof ApplicationHistoryEntrySchema>;