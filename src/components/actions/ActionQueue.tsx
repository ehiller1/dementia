import React, { useEffect, useState } from 'react';
import { ActionGovernanceService, ApprovalRecord } from '@/services/ActionGovernanceService';

export const ActionQueue: React.FC = () => {
  const [items, setItems] = useState<ApprovalRecord[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    let interval: any;
    const fetchPending = async () => {
      try {
        const list = await ActionGovernanceService.list('pending');
        if (mounted) setItems(list);
      } catch (e) {
        console.warn('Failed to fetch pending approvals:', e);
      }
    };
    fetchPending();
    interval = setInterval(fetchPending, 5000);
    return () => { mounted = false; if (interval) clearInterval(interval); };
  }, []);

  const approve = async (id: string) => {
    await ActionGovernanceService.decide(id, 'approved', 'admin', notes[id] || '');
    setItems(await ActionGovernanceService.list('pending'));
  };
  const reject = async (id: string) => {
    await ActionGovernanceService.decide(id, 'rejected', 'admin', notes[id] || '');
    setItems(await ActionGovernanceService.list('pending'));
  };

  return (
    <div>
      <h3>Action Approvals</h3>
      {items.length === 0 && <div>No pending approvals</div>}
      {items.map(a => (
        <div key={a.id} style={{ border: '1px solid #ddd', padding: 8, marginBottom: 8 }}>
          <div><b>{a.title}</b> (action: {a.actionId})</div>
          <div>Requested by: {a.requestedBy}</div>
          <div>Thresholds: {JSON.stringify(a.thresholds || {})}</div>
          <div style={{ marginTop: 6 }}>
            <label>
              Decision notes:
              <textarea
                style={{ width: '100%', minHeight: 60, display: 'block', marginTop: 4 }}
                value={notes[a.id] || ''}
                onChange={(e) => setNotes(prev => ({ ...prev, [a.id]: e.target.value }))}
                placeholder="Optional notes for approval/rejection"
              />
            </label>
          </div>
          <button onClick={() => approve(a.id)}>Approve</button>
          <button onClick={() => reject(a.id)} style={{ marginLeft: 8 }}>Reject</button>
        </div>
      ))}
    </div>
  );
};
