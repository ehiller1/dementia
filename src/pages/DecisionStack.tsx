import { useState, useEffect } from 'react';
import { DecisionStackDashboard } from '@/components/decision-stack/DecisionStackDashboard';
import { DecisionStackDetail } from '@/components/decision-stack/DecisionStackDetail';
import { fetchDecisionStacks, createDecisionStack, updateDecisionStack, deleteDecisionStack, cloneDecisionStack } from '@/lib/api/decisionStacks';

export interface DecisionStack {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'draft' | 'deprecated';
  version: string;
  lastModified: string;
  template: string;
  modules: {
    commonTerms: number;
    eventPatterns: number;
    tunedModels: number;
    entityMap: number;
    playsWorkflows: number;
    promptTemplates: number;
  };
}

export const MOCK_STACKS: DecisionStack[] = [
  {
    id: 'stack-1',
    name: 'Retail Media Optimization',
    description: 'AI-driven retail media budget allocation and campaign optimization',
    status: 'active',
    version: '2.3.1',
    lastModified: '2025-10-15',
    template: 'Retail Media',
    modules: { commonTerms: 12, eventPatterns: 8, tunedModels: 3, entityMap: 45, playsWorkflows: 6, promptTemplates: 15 },
  },
  {
    id: 'stack-2',
    name: 'Trade Promotion Planning',
    description: 'Optimize trade promotions across retailers and channels',
    status: 'active',
    version: '1.8.0',
    lastModified: '2025-10-10',
    template: 'Trade Promotion',
    modules: { commonTerms: 18, eventPatterns: 12, tunedModels: 4, entityMap: 67, playsWorkflows: 9, promptTemplates: 22 },
  },
  {
    id: 'stack-3',
    name: 'Allocation & Service',
    description: 'Inventory allocation and service level optimization',
    status: 'draft',
    version: '0.5.0',
    lastModified: '2025-10-16',
    template: 'Allocation & Service',
    modules: { commonTerms: 8, eventPatterns: 5, tunedModels: 2, entityMap: 34, playsWorkflows: 3, promptTemplates: 10 },
  },
];

export default function DecisionStack() {
  const [stacks, setStacks] = useState<DecisionStack[]>([]);
  const [selectedStack, setSelectedStack] = useState<DecisionStack | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch stacks from API
  useEffect(() => {
    const loadStacks = async () => {
      try {
        setLoading(true);
        const data = await fetchDecisionStacks();
        setStacks(data.length > 0 ? data : MOCK_STACKS); // Fallback to mock if empty
      } catch (error) {
        console.error('[DecisionStack] Error loading stacks:', error);
        // Fallback to mock data on error
        setStacks(MOCK_STACKS);
      } finally {
        setLoading(false);
      }
    };

    loadStacks();
  }, []);

  const handleCreateStack = async (newStack: Omit<DecisionStack, 'id' | 'version' | 'lastModified'>) => {
    try {
      const created = await createDecisionStack(newStack);
      setStacks([...stacks, created]);
    } catch (error) {
      console.error('[DecisionStack] Error creating stack:', error);
      // Fallback: add locally
      const localStack: DecisionStack = {
        ...newStack,
        id: `stack-${Date.now()}`,
        version: '0.1.0',
        lastModified: new Date().toISOString().split('T')[0]
      };
      setStacks([...stacks, localStack]);
    }
  };

  const handleUpdateStack = async (updated: DecisionStack) => {
    try {
      const saved = await updateDecisionStack(updated.id, updated);
      setStacks(stacks.map(s => s.id === saved.id ? saved : s));
      setSelectedStack(saved);
    } catch (error) {
      console.error('[DecisionStack] Error updating stack:', error);
      // Fallback: update locally
      setStacks(stacks.map(s => s.id === updated.id ? updated : s));
      setSelectedStack(updated);
    }
  };

  const handleDeleteStack = async (id: string) => {
    try {
      await deleteDecisionStack(id);
      setStacks(stacks.filter(s => s.id !== id));
      if (selectedStack?.id === id) {
        setSelectedStack(null);
      }
    } catch (error) {
      console.error('[DecisionStack] Error deleting stack:', error);
      // Fallback: delete locally
      setStacks(stacks.filter(s => s.id !== id));
      if (selectedStack?.id === id) {
        setSelectedStack(null);
      }
    }
  };

  const handleCloneStack = async (stack: DecisionStack) => {
    try {
      const cloned = await cloneDecisionStack(stack.id);
      setStacks([...stacks, cloned]);
    } catch (error) {
      console.error('[DecisionStack] Error cloning stack:', error);
      // Fallback: clone locally
      const localClone: DecisionStack = {
        ...stack,
        id: `stack-${Date.now()}`,
        name: `${stack.name} (Copy)`,
        status: 'draft',
        version: '0.1.0',
        lastModified: new Date().toISOString().split('T')[0]
      };
      setStacks([...stacks, localClone]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p>Loading decision stacks...</p>
        </div>
      </div>
    );
  }

  if (selectedStack) {
    return (
      <DecisionStackDetail
        stack={selectedStack}
        onBack={() => setSelectedStack(null)}
        onUpdate={handleUpdateStack}
      />
    );
  }

  return (
    <DecisionStackDashboard
      stacks={stacks}
      onSelectStack={setSelectedStack}
      onCreateStack={handleCreateStack}
      onDeleteStack={handleDeleteStack}
      onCloneStack={handleCloneStack}
    />
  );
}
