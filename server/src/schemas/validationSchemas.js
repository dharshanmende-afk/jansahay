import { z } from 'zod';

// ==============================================================================
// Authentication Schemas
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
  sessionId: z.string().optional(),
  language: z.enum(['en', 'mr', 'hi']).optional().default('en'),
  schemeId: z.union([z.number(), z.string()]).optional()
}).refine(data => data.question || data.message, {
  message: 'Either question or message field is required',
  path: ['question']
});

export const aiExplainSchema = z.object({
  language: z.enum(['en', 'mr', 'hi']).optional().default('en')
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
  requiredDocuments: z.array(z.string()).optional()
});

export const schemeUpdateSchema = schemeCreateSchema.partial();
