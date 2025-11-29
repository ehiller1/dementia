export type MemoryTier = 'working' | 'short_term' | 'long_term';

export interface MemoryItem {
  id: string;
  tier: MemoryTier;
  title: string;
  value: string;
  scope?: 'session' | 'project' | 'org' | 'public';
  status?: 'draft' | 'proposed' | 'approved' | 'deprecated';
  approved_for_session?: boolean;
  decay_at?: string;
  created_at?: string;
  usage_count?: number;
  last_used?: string;
  // Optional, if backend provides ownership metadata
  owner_id?: string;
  owner_name?: string;
  // Optional, confidence score for ranking/filtering
  confidence?: number;
}

const BASE = '/api/memory';

export async function memoryCreate(partial: Partial<MemoryItem> & { tier: MemoryTier; title: string; value: string }) {
  const r = await fetch(`${BASE}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(partial),
  });
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  return data.item as MemoryItem;
}

export async function memorySearch(params: { query?: string; scope?: string; limit?: number }) {
  const r = await fetch(`${BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  return data.items as MemoryItem[];
}

export async function memoryPromote(body: { id: string; from: MemoryTier; to: MemoryTier }) {
  const r = await fetch(`${BASE}/promote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()).item as MemoryItem;
}

export async function memoryApproveSession(id: string) {
  const r = await fetch(`${BASE}/approve-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()).item as MemoryItem;
}

export async function memoryItem(id: string) {
  const r = await fetch(`${BASE}/item/${id}`);
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()).item as MemoryItem;
}

export async function memoryBatch(operation: 'promote' | 'request_review' | 'retire', ids: string[]) {
  const r = await fetch(`${BASE}/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation, ids })
  });
  if (!r.ok) throw new Error(await r.text());
  return await r.json();
}
