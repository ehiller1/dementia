/**
 * Stub for validation
 * Backend services removed for frontend-only build
 */

export interface ValidationResult {
  success: boolean;
  data?: any;
  issues?: Array<{ field: string; message: string; severity: 'error' | 'warning' }>;
  executiveSummary?: string;
}

export function validateCanonical(data: any): ValidationResult {
  return { success: true, data, issues: [] };
}

