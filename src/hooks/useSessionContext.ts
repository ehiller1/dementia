import { useEffect, useMemo, useState } from 'react';
import { SessionService, SessionState, ConversationMessage } from '@/services/SessionService';

// React hook wrapper to manage a session with offline cache and auto-save
export function useSessionContext(sessionId: string) {
  const service = useMemo(() => new SessionService(), []);
  const [session, setSession] = useState<SessionState | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const loaded = await service.load(sessionId);
      const s: SessionState = loaded || { id: sessionId, messages: [], updatedAt: new Date().toISOString() };
      if (mounted) setSession(s);
    })();
    return () => { mounted = false; };
  }, [sessionId, service]);

  const addMessage = async (msg: ConversationMessage) => {
    if (!session) return;
    const next = { ...session, messages: [...session.messages, { ...msg, timestamp: new Date().toISOString() }], updatedAt: new Date().toISOString() };
    setSession(next);
    await service.save(next);
  };

  const save = async (partial: Partial<SessionState>) => {
    if (!session) return;
    const next: SessionState = { ...session, ...partial, updatedAt: new Date().toISOString() };
    setSession(next);
    await service.save(next);
  };

  const exportPack = async () => service.exportContextPack(sessionId);
  const importPack = async (pack: any) => service.importContextPack(pack);

  return { session, addMessage, save, exportPack, importPack };
}
