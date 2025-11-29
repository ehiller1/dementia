import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { MemoryType, MemorySourceType } from '@/lib/memory/types';

// Memory Fabric schema: memory_cards
interface MemoryCard {
  id: string;
  tenant_id: string;
  user_id?: string | null;
  conversation_id?: string | null;
  type: string; // e.g., 'decision', 'insight', 'policy', 'action_execution', 'template_execution'
  title?: string | null;
  content: string;
  tags?: string[];
  cross_functional?: Record<string, any>;
  sources?: string[];
  importance: number;
  retention: string; // working | short_term | long_term
  created_at: string;
  updated_at: string;
}

// Memory Fabric links: memory_links
interface MemoryLink {
  id: string;
  tenant_id: string;
  source_card_id: string;
  target_card_id?: string | null;
  target_type?: string | null;
  target_id?: string | null;
  relation: string;
  created_at: string;
}

interface MemoryInspectorProps {
  tenantId: string;
  userId: string;
  contextId?: string;
  refreshTrigger?: any; // When this changes, memories will be reloaded
  apiMemoryData?: {
    workingMemory?: Array<{
      query: string;
      intent?: any;
      agentResults?: any;
      timestamp?: string;
    }>;
    retrieved?: number;
    conversationTurns?: number;
  }; // Memory data from API response
}

/**
 * Memory Inspector Component
 * Visualizes and allows exploration of the hierarchical memory system
 */
const MemoryInspector: React.FC<MemoryInspectorProps> = ({ 
  tenantId, 
  userId,
  contextId,
  refreshTrigger,
  apiMemoryData
}) => {
  const [activeTab, setActiveTab] = useState<MemoryType>(MemoryType.SHORT_TERM);
  const [memories, setMemories] = useState<MemoryCard[]>([]);
  const [associations, setAssociations] = useState<MemoryLink[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<MemoryCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<MemorySourceType | 'all'>('all');

  // Load memories on tab change, filters, refresh trigger, or API memory data
  useEffect(() => {
    loadMemories();
  }, [activeTab, tenantId, userId, contextId, sourceTypeFilter, refreshTrigger, apiMemoryData]);

  // Load associations when a memory is selected
  useEffect(() => {
    if (selectedMemory) {
      loadAssociations(selectedMemory.id);
    } else {
      setAssociations([]);
    }
  }, [selectedMemory]);

  const loadMemories = async () => {
    setLoading(true);
    try {
      console.log('🔍 [MemoryInspector] Loading memories...', { tenantId, userId, contextId, activeTab });

      // First attempt: Memory Fabric (memory_cards) if present
      // Map MemoryType to retention column in memory_cards
      let query = supabase
        .from('memory_cards')
        .select('*')
        .eq('retention', activeTab.toLowerCase());

      // IMPORTANT: Only filter by tenant_id/user_id if they are actual UUIDs
      // If using default values like 'default_tenant', skip the filter to show all seeded data
      const isValidUUID = (str: string) => {
        return str && str.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      };

      if (tenantId && tenantId !== 'default_tenant' && isValidUUID(tenantId)) {
        console.log('🔍 [MemoryInspector] Filtering by tenant_id:', tenantId);
        query = query.eq('tenant_id', tenantId);
      } else {
        console.log('🔍 [MemoryInspector] Skipping tenant_id filter (using default or invalid UUID)');
      }

      if (userId && userId !== 'default_user' && isValidUUID(userId)) {
        console.log('🔍 [MemoryInspector] Filtering by user_id:', userId);
        query = query.eq('user_id', userId);
      } else {
        console.log('🔍 [MemoryInspector] Skipping user_id filter (using default or invalid UUID)');
      }

      if (contextId && contextId !== 'main_conversation' && isValidUUID(contextId)) {
        console.log('🔍 [MemoryInspector] Filtering by conversation_id:', contextId);
        query = query.eq('conversation_id', contextId);
      } else {
        console.log('🔍 [MemoryInspector] Skipping conversation_id filter (using default or invalid UUID)');
      }

      if (sourceTypeFilter !== 'all') {
        // In Memory Fabric, use `type` to filter categories
        query = query.eq('type', sourceTypeFilter as any);
      }

      if (searchTerm) {
        // Fallback to ILIKE search across title and content
        query = query.or(
          `title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ [MemoryInspector] Query error:', error);
        // don't throw yet; we'll try knowledge_base next
      }

      if (data && data.length > 0) {
        console.log(`✅ [MemoryInspector] Loaded ${data?.length || 0} memories from memory_cards`, data);
        setMemories((data as any) || []);
        return;
      }

      // Fallback: Backend knowledge_base (short_term / long_term)
      const memoryType = activeTab === MemoryType.LONG_TERM ? 'long_term' : 'short_term';
      let kbQuery = supabase
        .from('knowledge_base')
        .select('*')
        .eq('memory_type', memoryType)
        .order('created_at', { ascending: false })
        .limit(50);

      // Filter by userId if provided and valid (not default placeholder)
      if (userId && userId !== 'default_user') {
        console.log('🔍 [MemoryInspector] Filtering knowledge_base by user_id:', userId);
        kbQuery = kbQuery.eq('user_id', userId);
      }
      
      // Filter by conversationId if provided (supports both UUID and conv-{userId} format)
      if (contextId && contextId !== 'main_conversation') {
        console.log('🔍 [MemoryInspector] Filtering knowledge_base by conversation_id:', contextId);
        kbQuery = kbQuery.eq('conversation_id', contextId);
      }

      const { data: kbData, error: kbError } = await kbQuery;
      if (kbError) {
        console.error('❌ [MemoryInspector] knowledge_base query error:', kbError);
        throw kbError;
      }

      // Map knowledge_base rows to MemoryCard shape
      const mapped: MemoryCard[] = (kbData as any[] || []).map((row) => {
        const title =
          row.metadata?.intent ||
          (typeof row.content === 'string' ? row.content.slice(0, 48) : 'Insight');
        return {
          id: row.id,
          tenant_id: row.metadata?.tenantId || tenantId || '-',
          user_id: row.user_id,
          conversation_id: row.conversation_id,
          type: 'insight',
          title,
          content: row.content,
          tags: row.metadata?.tags || [],
          cross_functional: row.metadata?.cross_functional || null,
          sources: row.metadata?.sources || [],
          importance: row.metadata?.importance ?? 0.5,
          retention: row.memory_type === 'long_term' ? 'long_term' : 'short_term',
          created_at: row.created_at,
          updated_at: row.updated_at || row.created_at,
        } as MemoryCard;
      });

      console.log(`✅ [MemoryInspector] Loaded ${mapped.length} memories from knowledge_base`, mapped);
      
      // Merge with API memory data if available
      let finalMemories = [...mapped];
      
      // If API memory data is available, add working memory items
      if (apiMemoryData?.workingMemory && apiMemoryData.workingMemory.length > 0) {
        const apiWorkingMemories: MemoryCard[] = apiMemoryData.workingMemory.map((wm, index) => {
          const content = wm.agentResults?.synthesizedAnswer || 
                         wm.agentResults?.outputs?.[0]?.output || 
                         wm.query || 'Working memory item';
          const title = wm.query || `Query ${index + 1}`;
          
          return {
            id: `api-working-${index}-${Date.now()}`,
            tenant_id: tenantId || '-',
            user_id: userId || '-',
            conversation_id: contextId || '-',
            type: 'insight',
            title: title.length > 50 ? title.substring(0, 50) + '...' : title,
            content: content,
            tags: wm.intent?.keywords || [],
            cross_functional: null,
            sources: wm.agentResults?.agents || [],
            importance: 0.8,
            retention: 'short_term', // Show working memory in short-term tab
            created_at: wm.timestamp || new Date().toISOString(),
            updated_at: wm.timestamp || new Date().toISOString(),
          } as MemoryCard;
        });
        
        // Prepend API working memory to the list (most recent first)
        finalMemories = [...apiWorkingMemories, ...finalMemories];
        console.log(`✅ [MemoryInspector] Added ${apiWorkingMemories.length} working memory items from API`);
      }
      
      setMemories(finalMemories);
    } catch (error) {
      console.error('❌ [MemoryInspector] Error loading memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssociations = async (memoryId: string) => {
    try {
      // Generate valid UUID for tenant_id if it's a string
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      const validTenantId = tenantId === 'default_tenant' ? generateUUID() : tenantId;

      let query = supabase
        .from('memory_links')
        .select('*')
        .or(`source_card_id.eq.${memoryId},target_card_id.eq.${memoryId}`)
        .order('created_at', { ascending: false });

      // Only add tenant_id filter if we have a valid UUID
      if (validTenantId && validTenantId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        query = query.eq('tenant_id', validTenantId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAssociations((data as any) || []);
    } catch (error) {
      console.error('Error loading associations:', error);
    }
  };

  const handleMemorySelect = (memory: MemoryCard) => {
    setSelectedMemory(memory === selectedMemory ? null : memory);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadMemories();
  };

  const getSourceTypeLabel = (sourceType: string) => sourceType;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const renderMemoryContent = (content: any) => {
    if (!content) return <p>No content</p>;
    
    if (typeof content === 'string') {
      return <p>{content}</p>;
    }
    
    return (
      <div className="overflow-auto max-h-80">
        <pre className="text-xs">{JSON.stringify(content, null, 2)}</pre>
      </div>
    );
  };

  const renderTabs = () => (
    <div className="flex space-x-1 mb-2 bg-gray-100 p-0.5 rounded">
      {Object.values(MemoryType)
        .filter(type => type !== MemoryType.WORKING)
        .map((type) => (
        <button
          key={type}
          className={`px-2 py-0.5 text-[10px] rounded ${
            activeTab === type
              ? 'bg-indigo-500 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab(type)}
        >
          {type.replace('_', ' ')}
        </button>
      ))}
    </div>
  );

  const renderSourceTypeFilter = () => (
    <select
      className="px-3 py-2 border rounded-md text-sm"
      value={sourceTypeFilter}
      onChange={(e) => setSourceTypeFilter(e.target.value as any)}
    >
      <option value="all">All Source Types</option>
      {Object.values(MemorySourceType).map((type) => (
        <option key={type} value={type}>
          {getSourceTypeLabel(type)}
        </option>
      ))}
    </select>
  );

  const renderSearch = () => (
    <form onSubmit={handleSearch} className="flex space-x-2">
      <input
        type="text"
        placeholder="Search memory content..."
        className="flex-1 px-3 py-2 border rounded-md text-sm"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm"
      >
        Search
      </button>
    </form>
  );

  const renderMemoryList = () => (
    <div className="space-y-1.5">
      {loading ? (
        <div className="flex justify-center items-center py-6">
          <p className="text-xs text-gray-400">Loading...</p>
        </div>
      ) : memories.length === 0 ? (
        <div className="flex justify-center items-center py-6">
          <p className="text-xs text-gray-400">No memories</p>
        </div>
      ) : (
        memories.slice(0, 4).map((memory) => (
          <div
            key={memory.id}
            onClick={() => handleMemorySelect(memory)}
            className={`p-2 rounded border cursor-pointer transition-all ${
              selectedMemory?.id === memory.id 
                ? 'border-indigo-400 bg-indigo-50 shadow-sm' 
                : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between mb-1">
              <h4 className="text-xs font-medium text-gray-800 line-clamp-1 flex-1">
                {memory.title || 'Untitled'}
              </h4>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 ml-2 whitespace-nowrap">
                {Math.round((memory.importance || 0) * 100)}%
              </span>
            </div>
            <p className="text-[10px] text-gray-600 line-clamp-1 mb-1">
              {typeof memory.content === 'string' ? memory.content : JSON.stringify(memory.content).slice(0, 80)}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                {memory.type}
              </span>
              <span className="text-[9px] text-gray-400">
                {new Date(memory.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderMemoryDetail = () => {
    if (!selectedMemory) {
      return (
        <div className="border rounded-md p-4 h-96 flex items-center justify-center">
          <p className="text-gray-500">Select a memory to view details</p>
        </div>
      );
    }

    return (
      <div className="border rounded-md p-4 h-96 overflow-auto">
        <h3 className="text-lg font-semibold mb-2">Memory Detail</h3>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <p className="text-sm text-gray-500">ID</p>
            <p className="text-sm">{selectedMemory.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Title</p>
            <p className="text-sm">{selectedMemory.title || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Type</p>
            <p className="text-sm">{getSourceTypeLabel(selectedMemory.type)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="text-sm">{formatDate(selectedMemory.created_at)}</p>
          </div>
          {selectedMemory.conversation_id && (
            <div>
              <p className="text-sm text-gray-500">Conversation</p>
              <p className="text-sm">{selectedMemory.conversation_id}</p>
            </div>
          )}
        </div>

        <div className="mb-4">
          <h4 className="text-md font-medium mb-2">Content</h4>
          {renderMemoryContent(selectedMemory.content)}
        </div>

        <div className="mb-4">
          <h4 className="text-md font-medium mb-2">Tags / Sources / Cross-functional</h4>
          <div className="overflow-auto max-h-40 text-xs space-y-2">
            {selectedMemory.tags?.length ? (
              <div>
                <div className="font-medium">Tags</div>
                <pre>{JSON.stringify(selectedMemory.tags, null, 2)}</pre>
              </div>
            ) : null}
            {selectedMemory.sources?.length ? (
              <div>
                <div className="font-medium">Sources</div>
                <pre>{JSON.stringify(selectedMemory.sources, null, 2)}</pre>
              </div>
            ) : null}
            {selectedMemory.cross_functional ? (
              <div>
                <div className="font-medium">Cross-functional</div>
                <pre>{JSON.stringify(selectedMemory.cross_functional, null, 2)}</pre>
              </div>
            ) : null}
          </div>
        </div>

        {associations.length > 0 && (
          <div>
            <h4 className="text-md font-medium mb-2">Associations</h4>
            <ul className="space-y-1 text-sm">
              {associations.map((assoc) => (
                <li key={assoc.id} className="p-2 bg-gray-50 rounded-md">
                  <div className="flex justify-between">
                    <span>
                      {assoc.source_card_id === selectedMemory.id
                        ? '→ ' + (assoc.target_card_id || assoc.target_id || '—')
                        : '← ' + assoc.source_card_id}
                    </span>
                    <span className="text-blue-500">{assoc.relation}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{assoc.target_type ? `Target: ${assoc.target_type}` : ''}</span>
                    <span>{formatDate(assoc.created_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700">Memory</h2>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
          {memories.length}
        </span>
      </div>
      {renderTabs()}
      <div className="flex-1 min-h-0">
        {renderMemoryList()}
      </div>
      {selectedMemory && (
        <div className="mt-2 p-2 border-t border-gray-200">
          <div className="text-[10px] text-gray-500 mb-1">Selected</div>
          <div className="text-xs font-medium text-gray-800 line-clamp-2">
            {selectedMemory.title || 'Untitled'}
          </div>
          {selectedMemory.tags && selectedMemory.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {selectedMemory.tags.slice(0, 3).map((tag, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MemoryInspector;
