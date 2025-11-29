import React, { useEffect, useMemo, useState } from 'react';
import { memoryApproveSession, memoryBatch, memoryPromote, memorySearch, MemoryItem } from '../../lib/memory/memoryClient';

interface Props {
  sessionId?: string;
}

const tabs = [
  { key: 'working', label: 'Working' },
  { key: 'short_term', label: 'Session' },
  { key: 'long_term', label: 'Project/Org' },
] as const;

export default function MemoryDock({ sessionId }: Props) {
  const [active, setActive] = useState<typeof tabs[number]['key']>('short_term');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [freshness, setFreshness] = useState<'all' | 'active' | 'expiring_10m'>('all');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [scope, setScope] = useState<'session' | 'project' | 'org' | 'public' | 'all'>('all');
  const [status, setStatus] = useState<'all' | 'draft' | 'proposed' | 'approved' | 'deprecated'>('all');
  const [owner, setOwner] = useState<string>('');
  const [minConfidence, setMinConfidence] = useState<number | ''>('');

  async function load() {
    setLoading(true);
    try {
      const effectiveScope = scope === 'all' ? (active === 'long_term' ? 'project' : 'session') : scope;
      const res = await memorySearch({ query: q, scope: effectiveScope, limit: 30 });
      let filtered = res.filter(i => i.tier === active);
      if (freshness !== 'all') {
        filtered = filtered.filter(i => {
          const t = i.decay_at ? new Date(i.decay_at).getTime() - Date.now() : Infinity;
          if (freshness === 'expiring_10m') return t < 10 * 60 * 1000;
          if (freshness === 'active') return t >= 10 * 60 * 1000;
          return true;
        });
      }
      if (status !== 'all') {
        filtered = filtered.filter(i => (i.status || 'draft') === status);
      }
      if (owner.trim()) {
        const ow = owner.trim().toLowerCase();
        filtered = filtered.filter(i => (i.owner_name || i.owner_id || '').toLowerCase().includes(ow));
      }
      if (minConfidence !== '' && typeof minConfidence === 'number') {
        filtered = filtered.filter(i => (i.confidence ?? 0) >= minConfidence);
      }
      setItems(filtered);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [active]);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [freshness]);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [scope, status]);
  useEffect(() => {
    const h = setTimeout(() => load(), 300);
    return () => clearTimeout(h);
    // eslint-disable-next-line
  }, [q]);

  const selectedIds = useMemo(() => new Set(Object.keys(selected).filter(k => selected[k])), [selected]);

  async function onPromoteSelected() {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      if (active === 'working') {
        await memoryPromote({ id, from: 'working', to: 'short_term' });
      } else if (active === 'short_term') {
        await memoryPromote({ id, from: 'short_term', to: 'long_term' });
      }
    }
    await load();
  }

  async function onApproveSession(id: string) {
    await memoryApproveSession(id);
    await load();
  }

  async function onBatch(operation: 'request_review' | 'retire') {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    await memoryBatch(operation, ids);
    await load();
  }

  return (
    <div className="border rounded-lg bg-white shadow-sm h-full p-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {tabs.map(t => (
            <button key={t.key}
              onClick={() => setActive(t.key)}
              className={`px-2 py-1 rounded text-xs ${active === t.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>{t.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select className="border rounded px-2 py-1 text-sm" value={freshness} onChange={e => setFreshness(e.target.value as any)}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="expiring_10m">Expiring &lt;10m</option>
          </select>
          <select className="border rounded px-2 py-1 text-sm" value={scope} onChange={e => setScope(e.target.value as any)}>
            <option value="all">Any scope</option>
            <option value="session">Session</option>
            <option value="project">Project</option>
            <option value="org">Org</option>
            <option value="public">Public</option>
          </select>
          <select className="border rounded px-2 py-1 text-sm" value={status} onChange={e => setStatus(e.target.value as any)}>
            <option value="all">Any status</option>
            <option value="draft">Draft</option>
            <option value="proposed">Proposed</option>
            <option value="approved">Approved</option>
            <option value="deprecated">Deprecated</option>
          </select>
          <input className="border rounded px-2 py-1 text-sm" placeholder="Owner (name or id)" value={owner} onChange={e => setOwner(e.target.value)} />
          <input className="border rounded px-2 py-1 text-sm w-24" type="number" min={0} max={1} step={0.05}
            placeholder= "Conf ≥"
            value={minConfidence === '' ? '' : String(minConfidence)}
            onChange={e => {
              const v = e.target.value;
              if (v === '') setMinConfidence('');
              else setMinConfidence(Math.max(0, Math.min(1, Number(v))));
            }}
          />
          <input className="border rounded px-2 py-1 text-sm" placeholder="Search" value={q} onChange={e => setQ(e.target.value)} />
          <button className="text-sm px-2 py-1 bg-gray-800 text-white rounded" onClick={load}>{loading ? 'Loading…' : 'Search'}</button>
        </div>
      </div>

      <div className="mt-3 space-y-2 max-h-[70vh] overflow-auto">
        {items.map(it => (
          <div key={it.id} className="border rounded p-2 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{it.title}</div>
              <div className="text-xs text-gray-500">tier: {it.tier} {it.approved_for_session ? '· approved' : ''}</div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={!!selected[it.id]} onChange={(e)=> setSelected(prev => ({ ...prev, [it.id]: e.target.checked }))} />
              {active === 'working' && (
                <button className="text-xs text-blue-600 hover:underline" onClick={() => memoryPromote({ id: it.id, from: 'working', to: 'short_term' }).then(load)}>Promote</button>
              )}
              {active === 'short_term' && (
                <>
                  <button className="text-xs text-green-600 hover:underline" onClick={() => onApproveSession(it.id)}>Approve</button>
                  <button className="text-xs text-blue-600 hover:underline" onClick={() => memoryPromote({ id: it.id, from: 'short_term', to: 'long_term' }).then(load)}>Propose LTM</button>
                </>
              )}
              {active === 'long_term' && (
                <span className="text-xs text-gray-400">canonical</span>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-xs text-gray-500">No items.</div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-gray-500">Selected: {selectedIds.size}</div>
        <div className="flex gap-2">
          <button className="text-xs text-gray-700 border rounded px-2 py-1 disabled:opacity-50" onClick={onPromoteSelected} disabled={selectedIds.size === 0}>
            {active === 'working' ? 'Batch Promote to Session' : active === 'short_term' ? 'Batch Propose LTM' : 'Batch Disabled'}
          </button>
          <button className="text-xs text-gray-700 border rounded px-2 py-1 disabled:opacity-50" onClick={() => onBatch('request_review')} disabled={selectedIds.size === 0}>
            Request Review
          </button>
          <button className="text-xs text-red-700 border border-red-300 rounded px-2 py-1 disabled:opacity-50" onClick={() => onBatch('retire')} disabled={selectedIds.size === 0}>
            Retire
          </button>
        </div>
      </div>
    </div>
  );
}
