/**
 * Core Utilities
 * 
 * This module contains commonly used utility functions extracted from server-real.mjs
 * for better code organization and reusability.
 */

// Rate limiting storage - moved from server scope
const conversationRequestTimestamps = new Map();
const REQUEST_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

/**
 * Check if a conversation ID is rate limited
 * 
 * @param {string} conversationId - The conversation identifier
 * @returns {boolean} True if rate limited
 */
export function isRateLimited(conversationId) {
  const now = Date.now();
  const arr = conversationRequestTimestamps.get(conversationId) || [];
  const pruned = arr.filter(ts => now - ts < REQUEST_WINDOW_MS);
  pruned.push(now);
  conversationRequestTimestamps.set(conversationId, pruned);
  return pruned.length > MAX_REQUESTS_PER_WINDOW;
}

/**
 * Generate a simple non-cryptographic hash for deduplication keys
 * 
 * @param {string} str - String to hash
 * @returns {string} Hash value in base36
 */
export function simpleHash(str) {
  // Lightweight non-cryptographic hash for dedupe keys
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h.toString(36);
}

/**
 * Map intent to category for classification
 * 
 * @param {string} intent - The intent to classify
 * @returns {string} Category classification
 */
export function mapIntentToCategory(intent) {
  const categoryMap = {
    'DATA_ANALYSIS': 'analytics',
    'EXCEL_ANALYSIS': 'analytics',
    'SALES_ANALYSIS': 'analytics',
    'CUSTOMER_ANALYSIS': 'analytics',
    'MARKET_ANALYSIS': 'analytics',
    'FINANCIAL_ANALYSIS': 'analytics',
    'BUSINESS_INTELLIGENCE': 'analytics',
    'DEMAND_FORECASTING': 'planning',
    'SUPPLY_PLANNING': 'planning',
    'CAPACITY_PLANNING': 'planning',
    'RESOURCE_PLANNING': 'planning',
    'INVENTORY_OPTIMIZATION': 'operations',
    'SUPPLY_CHAIN': 'operations',
    'MANUFACTURING': 'operations',
    'PROCUREMENT': 'operations',
    'QUALITY_ASSURANCE': 'operations',
    'RISK_ASSESSMENT': 'risk',
    'COMPLIANCE': 'risk',
    'AUDIT': 'risk',
    'CAMPAIGN_OPTIMIZATION': 'marketing',
    'CUSTOMER_ACQUISITION': 'marketing',
    'BRAND_ANALYSIS': 'marketing',
    'PERSONA_ANALYSIS': 'marketing'
  };
  
  return categoryMap[intent] || 'general';
}

/**
 * Ensure template data is in array format
 * 
 * @param {any} templateData - Template data to normalize
 * @returns {Array} Array of templates
 */
export function ensureTemplateArray(templateData) {
  if (!templateData) return [];
  if (Array.isArray(templateData)) return templateData;
  if (typeof templateData === 'object') return [templateData];
  return [];
}

/**
 * Map intent to domain for agent selection
 * 
 * @param {string} intent - The intent to map
 * @returns {string} Domain classification
 */
export function mapIntentToDomain(intent) {
  const domainMap = {
    'DATA_ANALYSIS': 'analytics',
    'EXCEL_ANALYSIS': 'analytics',
    'SALES_ANALYSIS': 'sales',
    'CUSTOMER_ANALYSIS': 'customer_intelligence',
    'MARKET_ANALYSIS': 'market_research',
    'FINANCIAL_ANALYSIS': 'finance',
    'DEMAND_FORECASTING': 'demand_planning',
    'SUPPLY_PLANNING': 'supply_chain',
    'INVENTORY_OPTIMIZATION': 'inventory_management',
    'CAPACITY_PLANNING': 'operations',
    'MANUFACTURING': 'manufacturing',
    'PROCUREMENT': 'procurement',
    'QUALITY_ASSURANCE': 'quality',
    'RISK_ASSESSMENT': 'risk_management',
    'CAMPAIGN_OPTIMIZATION': 'marketing',
    'CUSTOMER_ACQUISITION': 'sales'
  };
  
  return domainMap[intent] || 'general';
}

/**
 * Generate a unique ID with timestamp and random component
 * 
 * @param {string} prefix - Prefix for the ID
 * @returns {string} Unique identifier
 */
export function generateUniqueId(prefix = 'id') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Validate and sanitize query input
 * 
 * @param {string} query - Query string to validate
 * @returns {Object} Validation result with isValid and sanitized query
 */
export function validateQuery(query) {
  if (!query || typeof query !== 'string') {
    return { isValid: false, sanitized: '', error: 'Query must be a non-empty string' };
  }
  
  const sanitized = query.trim();
  if (sanitized.length === 0) {
    return { isValid: false, sanitized: '', error: 'Query cannot be empty' };
  }
  
  if (sanitized.length > 10000) {
    return { isValid: false, sanitized: '', error: 'Query too long (max 10000 characters)' };
  }
  
  return { isValid: true, sanitized, error: null };
}

/**
 * Format timestamp for consistent logging
 * 
 * @param {Date} date - Date to format (defaults to now)
 * @returns {string} Formatted timestamp
 */
export function formatTimestamp(date = new Date()) {
  return date.toISOString();
}

/**
 * Deep clone an object safely
 * 
 * @param {any} obj - Object to clone
 * @returns {any} Cloned object
 */
export function safeClone(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.warn('Failed to clone object:', error);
    return obj;
  }
}
