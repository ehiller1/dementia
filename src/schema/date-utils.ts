/**
 * Stub for date-utils
 * Backend services removed for frontend-only build
 */

export function daysUntil(date: string | Date): number {
  if (!date) return 0;
  const target = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function humanLabel(date: string | Date): string {
  if (!date) return 'Not specified';
  const target = typeof date === 'string' ? new Date(date) : date;
  const days = daysUntil(target);
  
  if (days < 0) return `${Math.abs(days)} days ago`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `In ${days} days`;
  if (days < 30) return `In ${Math.floor(days / 7)} weeks`;
  if (days < 365) return `In ${Math.floor(days / 30)} months`;
  return `In ${Math.floor(days / 365)} years`;
}

