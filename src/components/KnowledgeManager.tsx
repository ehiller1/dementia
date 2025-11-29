import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { useRAG } from '../hooks/useRAG';
import { useToast } from '../hooks/use-toast';
import { seasonalityKnowledgeEntries } from '../data/seasonalityKnowledge';
import { Plus, Brain, Search, TrendingUp } from 'lucide-react';

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  team?: string;
  agent_class?: string;
  created_at: string;
}

export const KnowledgeManager = () => {
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    team: '',
    agent_class: ''
  });

  const { 
    createKnowledgeEntry, 
    getKnowledgeEntries, 
    searchSemantic, 
    regenerateEmbeddingsForPrompts,
    isLoading 
  } = useRAG();
  const { toast } = useToast();

  useEffect(() => {
    loadKnowledgeEntries();
    initializeSeasonalityKnowledge();
  }, []);

  const loadKnowledgeEntries = async () => {
    const entries = await getKnowledgeEntries();
    setKnowledgeEntries(entries);
  };

  const initializeSeasonalityKnowledge = async () => {
    if (hasInitialized) return;
    
    try {
      // Check if seasonality knowledge already exists
      const existing = await getKnowledgeEntries();
      const hasSeasonalityKnowledge = existing.some(entry => 
        entry.title.toLowerCase().includes('seasonality') || 
        entry.title.toLowerCase().includes('stl')
      );

      if (!hasSeasonalityKnowledge) {
        console.log('Initializing seasonality knowledge base...');
        
        // Add seasonality knowledge entries
        for (const entry of seasonalityKnowledgeEntries) {
          await createKnowledgeEntry(entry);
          // Small delay to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        toast({
          title: "Knowledge Base Initialized",
          description: "Added seasonality analysis capabilities to knowledge base",
        });

        loadKnowledgeEntries();
      }
      
      setHasInitialized(true);
    } catch (error) {
      console.error('Error initializing seasonality knowledge:', error);
    }
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive"
      });
      return;
    }

    try {
      await createKnowledgeEntry({
        title: formData.title,
        content: formData.content,
        team: formData.team || undefined,
        agent_class: formData.agent_class || undefined
      });

      setFormData({ title: '', content: '', team: '', agent_class: '' });
      setShowCreateForm(false);
      loadKnowledgeEntries();
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const results = await searchSemantic(searchQuery, undefined, undefined, 10);
      setSearchResults(results);
    } catch (error) {
      toast({
        title: "Error",
        description: "Search failed",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Knowledge Manager</h2>
          <Badge variant="secondary" className="ml-2 bg-green-600/30 text-green-300">
            <TrendingUp className="w-3 h-3 mr-1" />
            Seasonality Ready
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => regenerateEmbeddingsForPrompts()}
            disabled={isLoading}
            variant="outline"
            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            <Brain className="w-4 h-4 mr-2" />
            Sync Embeddings
          </Button>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Knowledge
          </Button>
        </div>
      </div>

      {/* Seasonality Knowledge Highlight */}
      <Card className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-700/30 p-4 text-black">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-black">Seasonality Analysis Available</h3>
        </div>
        <p className="text-black text-sm mb-3">
          Your agents now have access to professional seasonality analysis knowledge. Ask them about:
        </p>
        <div className="flex flex-wrap gap-2">
          {['STL Decomposition', 'Pattern Detection', 'Business Forecasting', 'Data Upload', 'Troubleshooting'].map((topic) => (
            <Badge key={topic} variant="outline" className="text-green-300 border-green-600">
              {topic}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Search */}
      <Card className="bg-slate-800/50 border-slate-700 p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search knowledge base..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="bg-slate-700 border-slate-600 text-white"
          />
          <Button 
            onClick={handleSearch}
            variant="outline"
            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-medium text-gray-300">Search Results:</h3>
            {searchResults.map((result, index) => (
              <div key={index} className="p-3 bg-slate-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-white">
                    {result.title || result.name}
                  </h4>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {result.source}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(result.similarity * 100)}% match
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-300 line-clamp-2">
                  {result.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <form onSubmit={handleCreateEntry} className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-gray-300">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Enter knowledge entry title"
              />
            </div>

            <div>
              <Label htmlFor="content" className="text-gray-300">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white min-h-[120px]"
                placeholder="Enter detailed content..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="team" className="text-gray-300">Team (Optional)</Label>
                <Select value={formData.team} onValueChange={(value) => setFormData(prev => ({ ...prev, team: value }))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="agent_class" className="text-gray-300">Agent Class (Optional)</Label>
                <Select value={formData.agent_class} onValueChange={(value) => setFormData(prev => ({ ...prev, agent_class: value }))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="analyst">Analyst</SelectItem>
                    <SelectItem value="strategist">Strategist</SelectItem>
                    <SelectItem value="executor">Executor</SelectItem>
                    <SelectItem value="specialist">Specialist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isLoading ? 'Creating...' : 'Create Entry'}
              </Button>
              <Button
                type="button"
                onClick={() => setShowCreateForm(false)}
                variant="outline"
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Knowledge Entries List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Knowledge Entries</h3>
        {knowledgeEntries.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700 p-6 text-center">
            <p className="text-gray-400">Loading knowledge entries...</p>
          </Card>
        ) : (
          knowledgeEntries.map((entry) => (
            <Card key={entry.id} className="bg-slate-800/50 border-slate-700 p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-lg font-medium text-white">{entry.title}</h4>
                <div className="flex gap-2">
                  {entry.title.toLowerCase().includes('seasonality') && (
                    <Badge variant="secondary" className="text-xs bg-green-600/30 text-green-300">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Seasonality
                    </Badge>
                  )}
                  {entry.team && (
                    <Badge variant="secondary" className="text-xs">
                      {entry.team}
                    </Badge>
                  )}
                  {entry.agent_class && (
                    <Badge variant="outline" className="text-xs">
                      {entry.agent_class}
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-2 line-clamp-3">
                {entry.content}
              </p>
              <p className="text-xs text-gray-500">
                Created: {new Date(entry.created_at).toLocaleDateString()}
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
