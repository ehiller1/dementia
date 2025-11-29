import React, { useEffect, useMemo, useState } from 'react';
import { memoryCreate, memoryPromote, memorySearch, MemoryItem } from '../../lib/memory/memoryClient';

interface Props {
  sessionId?: string;
}

export default function WorkingMemoryBar({ sessionId }: Props) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [draft, setDraft] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await memorySearch({ query: '', scope: 'session', limit: 20 });
      setItems(res.filter((i) => i.tier === 'working'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function addScratch() {
    if (!draft.trim()) return;
    await memoryCreate({ tier: 'working', title: draft.slice(0, 60), value: draft, scope: 'session' });
    setDraft('');
    await load();
  }

  async function promote(id: string) {
    await memoryPromote({ id, from: 'working', to: 'short_term' });
    await load();
  }

  const soonExpiringIds = useMemo(() => new Set(items
    .filter(i => i.decay_at && (new Date(i.decay_at).getTime() - Date.now()) < 3 * 60 * 1000)
    .map(i => i.id)), [items]);

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-gray-500">Working Notes</span>
        {loading && <span className="text-xs text-gray-400">loading…</span>}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          className="flex-1 border rounded px-2 py-1 text-sm"
          placeholder="Add a scratch note…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addScratch(); }}
        />
        <button className="px-3 py-1 bg-gray-800 text-white rounded text-sm" onClick={addScratch}>Add</button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map(i => (
          <div key={i.id} className="flex items-center gap-2 px-2 py-1 rounded-full border bg-white shadow-sm">
            <span className="text-xs">{i.title}</span>
            <span className={`w-2 h-2 rounded-full ${soonExpiringIds.has(i.id) ? 'bg-yellow-400' : 'bg-gray-300'}`} title={i.decay_at ? `expires ${new Date(i.decay_at).toLocaleTimeString()}` : ''} />
            <button className="text-xs text-blue-600 hover:underline" onClick={() => promote(i.id)} title="Promote to Session (STM)">Promote</button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-xs text-gray-500">No working notes yet—run an action or start typing. We’ll capture context here.</div>
        )}
      </div>
    </div>
  );
}
