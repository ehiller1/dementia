/**
 * PII Redaction Utilities
 * 
 * Redacts emails, phones, SSNs, and other sensitive data from logs and UI.
 */

/**
 * Redact email addresses
 */
export function redactEmail(text: string): string {
  // Match email pattern and replace with redacted version
  return text.replace(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    (match) => {
      const [local, domain] = match.split('@');
      const redactedLocal = local.length > 2 
        ? `${local[0]}***${local[local.length - 1]}`
        : '***';
      return `${redactedLocal}@${domain}`;
    }
  );
}

/**
 * Redact phone numbers
 */
export function redactPhone(text: string): string {
  // Match various phone formats
  return text.replace(
    /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    (match) => {
      // Keep last 4 digits
      const digits = match.replace(/\D/g, '');
      return `***-***-${digits.slice(-4)}`;
    }
  );
}

/**
 * Redact SSN
 */
export function redactSSN(text: string): string {
  return text.replace(
    /\b\d{3}-\d{2}-\d{4}\b/g,
    '***-**-****'
  );
}

/**
 * Redact credit card numbers
 */
export function redactCreditCard(text: string): string {
  return text.replace(
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    (match) => {
      const digits = match.replace(/\D/g, '');
      return `****-****-****-${digits.slice(-4)}`;
    }
  );
}

/**
 * Redact all PII from text
 */
export function redactPII(text: string): string {
  let redacted = text;
  redacted = redactEmail(redacted);
  redacted = redactPhone(redacted);
  redacted = redactSSN(redacted);
  redacted = redactCreditCard(redacted);
  return redacted;
}

/**
 * Redact PII from object (deep)
 */
export function redactPIIFromObject(obj: any, maxDepth: number = 10): any {
  if (maxDepth === 0) return obj;
  
  if (typeof obj === 'string') {
    return redactPII(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => redactPIIFromObject(item, maxDepth - 1));
  }
  
  if (obj && typeof obj === 'object') {
    const redacted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      redacted[key] = redactPIIFromObject(value, maxDepth - 1);
    }
    return redacted;
  }
  
  return obj;
}

/**
 * Create snippet with PII redaction
 * 
 * Truncates text and redacts PII for safe display
 */
export function createSafeSnippet(text: string, maxLength: number = 200): string {
  const truncated = text.length > maxLength 
    ? text.slice(0, maxLength) + '...'
    : text;
  
  return redactPII(truncated);
}

/**
 * Redact sensitive fields from batch data for logging
 */
export function redactBatchDataForLogging(batchData: any): any {
  if (!batchData) return batchData;
  
  const redacted = { ...batchData };
  
  // Redact email bodies and subjects
  if (redacted.items && Array.isArray(redacted.items)) {
    redacted.items = redacted.items.map((item: any) => ({
      ...item,
      summary: createSafeSnippet(item.summary || '', 100),
      // Remove entities entirely from logs (may contain PII)
      entities: item.entities ? '[REDACTED]' : undefined
    }));
  }
  
  return redacted;
}
