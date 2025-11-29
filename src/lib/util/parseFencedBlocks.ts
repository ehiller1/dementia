/**
 * Parse fenced code blocks from LLM output
 * Supports JSON, JSONC, JSON5, TEXT/PLAINTEXT blocks
 * Handles BOM, whitespace variations, and case-insensitivity
 */

export interface FencedBlocks {
  json?: string;
  text?: string;
  hasJson: boolean;
  hasText: boolean;
}

const JSON_FENCES = [
  /```jsonc?\s*([\s\S]*?)```/i,
  /```json5\s*([\s\S]*?)```/i,
  /```JSON\s*([\s\S]*?)```/i,
  /```json\s*([\s\S]*?)```/i
];

const TEXT_FENCES = [
  /```plaintext\s*([\s\S]*?)```/i,
  /```text\s*([\s\S]*?)```/i,
  /```txt\s*([\s\S]*?)```/i,
  /```TXT\s*([\s\S]*?)```/i
];

export function parseFencedBlocks(raw: string): FencedBlocks {
  // Try all JSON fence patterns
  const jsonMatch = JSON_FENCES
    .map(regex => raw.match(regex))
    .find(match => match !== null);
  
  const json = jsonMatch?.[1]
    ?.replace(/^\uFEFF/, '') // Remove BOM
    ?.trim();
  
  // Try all TEXT fence patterns
  const textMatch = TEXT_FENCES
    .map(regex => raw.match(regex))
    .find(match => match !== null);
  
  const text = textMatch?.[1]?.trim();

  return {
    json,
    text,
    hasJson: !!json,
    hasText: !!text
  };
}
