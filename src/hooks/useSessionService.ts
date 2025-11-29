import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import WorkspaceService from '../services/WorkspaceService';

export interface BusinessSession {
  id: string;
  userId: string;
  role: 'operator' | 'analyst' | 'manager' | 'admin';
  workspace: {
    uri: string;
    corpusName: string;
    businessDomain: string;
    layout: {
      activePanel: string;
      sidebarCollapsed: boolean;
    };
    activeDatasets: string[];
    pinnedTemplates: string[];
    savedSimulations: string[];
    lastAccessed: Date;
  };
  context: {
    conversationHistory: any[];
    executionPlans: any[];
    selectedMetrics: string[];
    contextFiles: ContextFile[];
  };
  created: Date;
  lastAccessed: Date;
}

export interface ContextFile {
  id: string;
  name: string;
  type: 'dataset' | 'template' | 'simulation' | 'report';
  path: string;
  metadata: Record<string, any>;
  created: Date;
}

export interface ContextPack {
  session: BusinessSession;
  exportedAt: Date;
  version: string;
}

const SESSION_STORAGE_KEY = 'quest-agent-forge-session';
const SESSIONS_STORAGE_KEY = 'quest-agent-forge-sessions';

export function useSessionService() {
  const [session, setSession] = useState<BusinessSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize session on mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem('lastSessionId');
    if (savedSessionId) {
      restoreSession(savedSessionId);
    } else {
      createNewSession();
    }
  }, []);

  const createNewSession = useCallback((role: BusinessSession['role'] = 'operator'): BusinessSession => {
    const newSession: BusinessSession = {
      id: uuidv4(),
      userId: uuidv4(), // Generate proper UUID instead of hardcoded string
      role,
      workspace: {
        uri: '/Users/erichillerbrand/quest-agent-forge-main',
        corpusName: 'ehiller1/quest-agent-forge',
        businessDomain: 'business_intelligence',
        layout: {
          activePanel: 'conversation',
          sidebarCollapsed: false
        },
        activeDatasets: [],
        pinnedTemplates: [],
        savedSimulations: [],
        lastAccessed: new Date()
      },
      context: {
        conversationHistory: [],
        executionPlans: [],
        selectedMetrics: [],
        contextFiles: []
      },
      created: new Date(),
      lastAccessed: new Date()
    };

    setSession(newSession);
    localStorage.setItem('lastSessionId', newSession.id);
    return newSession;
  }, []);

  const saveSession = useCallback(async (sessionToSave: BusinessSession) => {
    try {
      setIsLoading(true);
      
      // Update last accessed time
      const updatedSession = {
        ...sessionToSave,
        lastAccessed: new Date()
      };

      // Save to localStorage
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
      
      // Save to sessions list
      const existingSessions = JSON.parse(localStorage.getItem(SESSIONS_STORAGE_KEY) || '[]');
      const sessionIndex = existingSessions.findIndex((s: BusinessSession) => s.id === updatedSession.id);
      
      if (sessionIndex >= 0) {
        existingSessions[sessionIndex] = updatedSession;
      } else {
        existingSessions.push(updatedSession);
      }
      
      // Keep only last 10 sessions
      const recentSessions = existingSessions
        .sort((a: BusinessSession, b: BusinessSession) => 
          new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime()
        )
        .slice(0, 10);
      
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(recentSessions));
      
      setSession(updatedSession);
      localStorage.setItem('lastSessionId', updatedSession.id);
      
      return updatedSession;
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const restoreSession = useCallback(async (sessionId?: string): Promise<BusinessSession | null> => {
    try {
      setIsLoading(true);
      
      let sessionToRestore: BusinessSession | null = null;
      
      if (sessionId) {
        // Try to find specific session
        const sessions = JSON.parse(localStorage.getItem(SESSIONS_STORAGE_KEY) || '[]');
        sessionToRestore = sessions.find((s: BusinessSession) => s.id === sessionId) || null;
      } else {
        // Restore last session
        const lastSession = localStorage.getItem(SESSION_STORAGE_KEY);
        if (lastSession) {
          sessionToRestore = JSON.parse(lastSession);
        }
      }
      
      if (sessionToRestore) {
        // Convert date strings back to Date objects
        sessionToRestore.created = new Date(sessionToRestore.created);
        sessionToRestore.lastAccessed = new Date(sessionToRestore.lastAccessed);
        sessionToRestore.workspace.lastAccessed = new Date(sessionToRestore.workspace.lastAccessed);
        
        setSession(sessionToRestore);
        localStorage.setItem('lastSessionId', sessionToRestore.id);
        return sessionToRestore;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to restore session:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const listSessions = useCallback((): BusinessSession[] => {
    try {
      const sessions = JSON.parse(localStorage.getItem(SESSIONS_STORAGE_KEY) || '[]');
      return sessions.map((s: any) => ({
        ...s,
        created: new Date(s.created),
        lastAccessed: new Date(s.lastAccessed),
        workspace: {
          ...s.workspace,
          lastAccessed: new Date(s.workspace.lastAccessed)
        }
      }));
    } catch (error) {
      console.error('Failed to list sessions:', error);
      return [];
    }
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const sessions = JSON.parse(localStorage.getItem(SESSIONS_STORAGE_KEY) || '[]');
      const filteredSessions = sessions.filter((s: BusinessSession) => s.id !== sessionId);
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(filteredSessions));
      
      // If we're deleting the current session, create a new one
      if (session?.id === sessionId) {
        createNewSession();
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw error;
    }
  }, [session, createNewSession]);

  const exportContextPack = useCallback(async (): Promise<ContextPack> => {
    if (!session) {
      throw new Error('No active session to export');
    }
    
    return {
      session,
      exportedAt: new Date(),
      version: '1.0.0'
    };
  }, [session]);

  const importContextPack = useCallback(async (contextPack: ContextPack) => {
    try {
      setIsLoading(true);
      
      // Create new session ID to avoid conflicts
      const importedSession: BusinessSession = {
        ...contextPack.session,
        id: uuidv4(),
        created: new Date(),
        lastAccessed: new Date()
      };
      
      await saveSession(importedSession);
      return importedSession;
    } catch (error) {
      console.error('Failed to import context pack:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [saveSession]);

  const updateSessionContext = useCallback((updates: Partial<BusinessSession['context']>) => {
    if (!session) return;
    
    const updatedSession = {
      ...session,
      context: {
        ...session.context,
        ...updates
      }
    };
    
    saveSession(updatedSession);
  }, [session, saveSession]);

  const addContextFile = useCallback((file: Omit<ContextFile, 'id' | 'created'>) => {
    const contextFile: ContextFile = {
      ...file,
      id: uuidv4(),
      created: new Date()
    };
    
    updateSessionContext({
      contextFiles: [...(session?.context.contextFiles || []), contextFile]
    });
    
    return contextFile;
  }, [session, updateSessionContext]);

  const removeContextFile = useCallback((fileId: string) => {
    updateSessionContext({
      contextFiles: session?.context.contextFiles.filter(f => f.id !== fileId) || []
    });
  }, [session, updateSessionContext]);

  return {
    session,
    isLoading,
    createNewSession,
    saveSession,
    restoreSession,
    listSessions,
    deleteSession,
    exportContextPack,
    importContextPack,
    updateSessionContext,
    addContextFile,
    removeContextFile
  };
}
