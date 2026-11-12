import { z } from 'zod';

// ==============================================================================
// Authentication & Account Privacy Schemas
// ==============================================================================

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long').max(100, 'Name must not exceed 100 characters'),
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum(['CITIZEN', 'ADMIN']).optional().default('CITIZEN')
});

export const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

export const quickLoginSchema = z.object({
  role: z.enum(['admin', 'student', 'farmer', 'business']).optional().default('student')
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10, 'Valid refresh token is required')
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password confirmation is required to delete your account')
});

export const deleteDataSchema = z.object({
  confirmation: z.literal('DELETE_MY_DATA', {
    errorMap: () => ({ message: 'Please type DELETE_MY_DATA to confirm removal of your profile and documents' })
  }).optional()
});

// ==============================================================================
// Profile Schemas
// ==============================================================================

export const profileSchema = z.object({
  category: z.string().min(1, 'Category is required (e.g., OPEN, OBC, SC, ST, EWS)'),
  state: z.string().trim().min(1, 'State is required'),
  district: z.string().trim().optional().nullable(),
  occupation: z.string().trim().optional().nullable(),
  incomeRange: z.string().min(1, 'Income range is required'),
  annualIncome: z.union([z.number().nonnegative(), z.string().transform(v => parseFloat(v) || 0)]).optional(),
  educationLevel: z.string().optional().nullable(),
  course: z.string().optional().nullable(),
  currentYear: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]).optional().nullable(),
  instituteName: z.string().optional().nullable(),
  farmingType: z.string().optional().nullable(),
  cropActivity: z.string().optional().nullable(),
  landArea: z.union([z.number().nonnegative(), z.string().transform(v => parseFloat(v) || 0)]).optional().nullable(),
  landOwnership: z.string().optional().nullable(),
  businessType: z.string().optional().nullable(),
  businessStage: z.string().optional().nullable(),
  msmeStatus: z.string().optional().nullable(),
  businessDescription: z.string().optional().nullable(),
  disabilityStatus: z.string().optional().nullable(),
  inHandDocuments: z.array(z.string()).optional()
});

export const anonymousProfileSchema = profileSchema.partial().extend({
  state: z.string().default('Maharashtra'),
  category: z.string().default('GENERAL')
});

// ==============================================================================
// Document Schemas
// ==============================================================================

export const updateDocumentStatusSchema = z.object({
  documentName: z.string().min(1, 'Document name is required'),
  documentType: z.string().optional(),
  status: z.enum([
    'AVAILABLE',
    'MISSING',
    'NEEDS_VERIFICATION',
    'NOT_YET_CHECKED',
    'HAVE_ORIGINAL',
    'HAVE_DIGITAL',
    'APPLIED',
    'PENDING'
  ]),
  documentNumber: z.string().optional(),
  notes: z.string().optional()
});

export const updateChecklistSchema = z.object({
  documents: z.array(z.string()).optional(),
  isReady: z.boolean().optional()
});

// ==============================================================================
// AI Schemas
// ==============================================================================

export const aiChatSchema = z.object({
  question: z.string().trim().min(1, 'Question parameter cannot be empty').max(1000, 'Question exceeds 1000 characters limit').optional(),
  message: z.string().trim().min(1, 'Message parameter cannot be empty').max(1000, 'Message exceeds 1000 characters limit').optional(),
  sessionId: z.string().max(120).optional().nullable(),
  language: z.enum(['en', 'mr', 'hi']).optional(),
  schemeId: z.union([z.number(), z.string()]).optional().nullable(),
  mode: z.enum(['default', 'simpler', 'checklist']).optional(),
  inHandDocuments: z.array(z.string()).max(50).optional()
}).refine(data => data.question || data.message, {
  message: 'Either question or message field is required',
  path: ['question']
});

export const aiExplainSchema = z.object({
  language: z.enum(['en', 'mr', 'hi']).optional().default('en')
});

export const aiFeedbackSchema = z.object({
  sessionId: z.string().max(120).optional().nullable(),
  messageId: z.union([z.number(), z.string()]).optional().nullable(),
  rating: z.enum(['up', 'down']),
  question: z.string().trim().max(400).optional(),
  comment: z.string().trim().max(1000).optional()
});

// ==============================================================================
// Scheme & Document Query / Param Schemas
// ==============================================================================

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a positive integer').transform(Number)
});

export const schemeQuerySchema = z.object({
  category: z.string().optional(),
  state: z.string().optional(),
  search: z.string().optional(),
  q: z.string().optional(),
  page: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]).optional().default(1),
  limit: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]).optional().default(50)
});

export const guideQuerySchema = z.object({
  category: z.string().optional(),
  state: z.string().optional(),
  search: z.string().optional()
});

// ==============================================================================
// Feedback & Correction Reporting Schemas
// ==============================================================================

export const feedbackSchema = z.object({
  schemeId: z.union([z.number(), z.string().transform(Number)]).optional().nullable(),
  guideId: z.union([z.number(), z.string().transform(Number)]).optional().nullable(),
  feedbackType: z.enum(['CORRECTION', 'SUGGESTION', 'RATING', 'ERROR_REPORT']).optional().default('CORRECTION'),
  comment: z.string().trim().min(3, 'Comment must be at least 3 characters long').max(2000, 'Comment exceeds 2000 characters limit'),
  rating: z.union([z.number().int().min(1).max(5), z.string().transform(Number)]).optional().nullable()
});

// ==============================================================================
// Scheme Management Schemas (Admin)
// ==============================================================================

export const schemeCreateSchema = z.object({
  name: z.string().trim().min(3, 'Scheme name must be at least 3 characters'),
  code: z.string().optional(),
  category: z.string().min(2, 'Category is required'),
  department: z.string().optional(),
  level: z.string().optional().default('Central'),
  state: z.string().optional().default('All India'),
  targetAudience: z.string().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  benefits: z.string().optional(),
  maxBenefitAmount: z.number().optional(),
  officialPortalUrl: z.string().url('Must be a valid official URL').optional().or(z.literal('')),
  applicationSteps: z.array(z.string()).optional(),
  requiredDocuments: z.array(z.string()).optional(),
  eligibilityRules: z.array(z.any()).optional()
});

export const schemeUpdateSchema = schemeCreateSchema.partial();
