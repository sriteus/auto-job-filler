/**
 * Barrel export for @ai-job-agent/shared package
 */

// Types - main types
export * from './types';

// Schemas (re-export with namespace to avoid conflicts)
export * as schemas from './schemas';

// Constants - only export constants that don't conflict with types
export {
  FIELD_CLASSIFICATION_TYPES,
  CONFIDENCE_THRESHOLDS,
  getConfidenceLevel,
  FILL_ACTIONS,
  FILL_PRIORITY,
  SENSITIVE_FIELD_TYPES,
  isSensitiveField,
  DETERMINISTIC_FIELD_PATTERNS,
  FIELD_CLASSIFICATION_LABELS,
  FIELD_STATUS_ICONS,
  API_ENDPOINTS,
  EXTENSION_MESSAGE_TYPES,
  STORAGE_KEYS,
  DEFAULT_VALUES,
  JOB_EXTRACTION_PATTERNS,
  FORM_DETECTION_KEYWORDS,
  SUPPORTED_RESUME_TYPES,
  SUPPORTED_RESUME_EXTENSIONS,
  DEFAULT_CANDIDATE_PROFILE,
} from './constants';
