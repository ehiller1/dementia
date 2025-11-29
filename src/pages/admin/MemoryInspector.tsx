import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Search, 
  Trash2, 
  Download, 
  TrendingUp,
  Clock,
  Brain,
  Archive,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface MemoryItem {
  id: string;
  type: 'working' | 'long-term';
  content: string;
  confidence: number;
  timestamp: string;
  usageCount: number;
  tags: string[];
  source: string;
}

export default function MemoryInspector() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('working');

  // Mock data - replace with actual memory data
  const [memories, setMemories] = useState<MemoryItem[]>([
    {
      id: 'mem-001',
      type: 'working',
      content: 'Current Q4 revenue target is $2.5M with 15% growth YoY',
      confidence: 0.95,
      timestamp: '2025-10-21T16:45:00Z',
      usageCount: 12,
      tags: ['revenue', 'targets', 'Q4'],
      source: 'conversation-context'
    },
    {
      id: 'mem-002',
      type: 'working',
      content: 'User prefers aggressive pricing strategy for new product launches',
      confidence: 0.88,
      timestamp: '2025-10-21T15:30:00Z',
      usageCount: 5,
      tags: ['pricing', 'strategy', 'preferences'],
      source: 'user-preference'
    },
    {
      id: 'mem-003',
      type: 'long-term',
      content: 'Historical seasonality pattern: 40% spike in November-December',
      confidence: 0.97,
      timestamp: '2025-09-15T10:00:00Z',
      usageCount: 45,
      tags: ['seasonality', 'patterns', 'historical'],
      source: 'data-analysis'
    },
    {
      id: 'mem-004',
      type: 'long-term',
      content: 'Competitor pricing typically 8-12% below our baseline',
      confidence: 0.92,
      timestamp: '2025-08-20T14:20:00Z',
      usageCount: 28,
      tags: ['competitive', 'pricing', 'intelligence'],
      source: 'market-analysis'
    },
  ]);

  const filteredMemories = memories.filter(mem => {
    const matchesSearch = mem.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mem.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTab = selectedTab === 'all' || mem.type === selectedTab;
    return matchesSearch && matchesTab;
  });

  const stats = {
    working: memories.filter(m => m.type === 'working').length,
    longTerm: memories.filter(m => m.type === 'long-term').length,
    avgConfidence: (memories.reduce((sum, m) => sum + m.confidence, 0) / memories.length * 100).toFixed(1),
    totalUsage: memories.reduce((sum, m) => sum + m.usageCount, 0),
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-400';
    if (confidence >= 0.75) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const handleClearMemory = (id: string) => {
    setMemories(memories.filter(m => m.id !== id));
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(memories, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `memory-export-${new Date().toISOString()}.json`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Database className="h-8 w-8 text-green-400" />
            Memory Inspector
          </h1>
          <p className="text-gray-400 mt-1">
            Browse and manage system memory - working context and institutional knowledge
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            className="border-slate-700 text-gray-300 hover:bg-slate-800"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Memory
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Working Memory</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{stats.working}</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Brain className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Long-term Memory</p>
              <p className="text-2xl font-bold text-purple-400 mt-1">{stats.longTerm}</p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Archive className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Avg Confidence</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{stats.avgConfidence}%</p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Usage</p>
              <p className="text-2xl font-bold text-orange-400 mt-1">{stats.totalUsage}</p>
            </div>
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <Clock className="h-6 w-6 text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search memories by content or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-slate-900 border-slate-700 text-white"
        />
      </div>

      {/* Memory Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="working" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
            Working Memory
          </TabsTrigger>
          <TabsTrigger value="long-term" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            Long-term Memory
          </TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
            All Memory
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6 space-y-4">
          {filteredMemories.map((memory) => (
            <Card key={memory.id} className="bg-slate-900/50 border-slate-800 p-6 hover:border-green-500/50 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="outline" className={`${memory.type === 'working' ? 'border-blue-500 text-blue-400' : 'border-purple-500 text-purple-400'}`}>
                      {memory.type === 'working' ? 'Working' : 'Long-term'}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1 ${getConfidenceColor(memory.confidence)}`}>
                        {memory.confidence >= 0.9 ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        <span className="text-sm font-semibold">{(memory.confidence * 100).toFixed(0)}% confidence</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-white text-base mb-3">{memory.content}</p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {memory.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-slate-800 text-gray-300 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Source</p>
                      <p className="text-white font-medium">{memory.source}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Usage Count</p>
                      <p className="text-white font-medium">{memory.usageCount}x</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Last Updated</p>
                      <p className="text-white font-medium">{new Date(memory.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleClearMemory(memory.id)}
                  className="border-slate-700 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}

          {filteredMemories.length === 0 && (
            <Card className="bg-slate-900/50 border-slate-800 p-12 text-center">
              <Database className="h-16 w-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-semibold text-white mb-2">No memories found</h3>
              <p className="text-gray-400">Try adjusting your search or filters</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
