/**
 * Dataset Browser Component
 * Displays and manages simulated datasets for contextual retrieval testing
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Database,
  Search,
  Filter,
  Clock,
  Tag,
  BarChart3,
  FileText,
  Briefcase,
  Target,
  ChevronRight
} from 'lucide-react';
import {
  simulatedDatasets,
  getDatasetsByMemoryType,
  getDatasetsByCategory,
  getDatasetStatistics,
  searchDatasets,
  type Dataset
} from '@/data/simulatedDatasets';

export function DatasetBrowser() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemoryType, setSelectedMemoryType] = useState<'all' | 'working' | 'short-term' | 'long-term'>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | Dataset['category']>('all');
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

  const stats = getDatasetStatistics();

  // Filter datasets based on search and filters
  const filteredDatasets = simulatedDatasets.filter(ds => {
    const matchesSearch = searchQuery === '' || 
      ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesMemoryType = selectedMemoryType === 'all' || ds.memoryType === selectedMemoryType;
    const matchesCategory = selectedCategory === 'all' || ds.category === selectedCategory;
    
    return matchesSearch && matchesMemoryType && matchesCategory;
  });

  const getCategoryIcon = (category: Dataset['category']) => {
    switch (category) {
      case 'business': return <Briefcase className="h-4 w-4" />;
      case 'technical': return <FileText className="h-4 w-4" />;
      case 'operational': return <BarChart3 className="h-4 w-4" />;
      case 'strategic': return <Target className="h-4 w-4" />;
    }
  };

  const getMemoryTypeColor = (memoryType: Dataset['memoryType']) => {
    switch (memoryType) {
      case 'working': return 'bg-green-600';
      case 'short-term': return 'bg-blue-600';
      case 'long-term': return 'bg-purple-600';
    }
  };

  const getCategoryColor = (category: Dataset['category']) => {
    switch (category) {
      case 'business': return 'bg-cyan-600/20 text-cyan-400 border-cyan-600';
      case 'technical': return 'bg-orange-600/20 text-orange-400 border-orange-600';
      case 'operational': return 'bg-green-600/20 text-green-400 border-green-600';
      case 'strategic': return 'bg-purple-600/20 text-purple-400 border-purple-600';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Dataset Browser
              </h1>
              <p className="text-gray-400 mt-2">
                Explore simulated datasets for contextual retrieval testing
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Total Datasets</div>
              <div className="text-3xl font-bold text-blue-400">{stats.total}</div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search datasets by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900 border-slate-700 text-white"
            />
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-900 border-slate-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Working Memory</div>
                <div className="text-2xl font-bold text-green-400">{stats.byMemoryType.working}</div>
              </div>
              <Database className="h-8 w-8 text-green-400" />
            </div>
          </Card>
          <Card className="bg-slate-900 border-slate-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Short-term</div>
                <div className="text-2xl font-bold text-blue-400">{stats.byMemoryType['short-term']}</div>
              </div>
              <Clock className="h-8 w-8 text-blue-400" />
            </div>
          </Card>
          <Card className="bg-slate-900 border-slate-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Long-term</div>
                <div className="text-2xl font-bold text-purple-400">{stats.byMemoryType['long-term']}</div>
              </div>
              <FileText className="h-8 w-8 text-purple-400" />
            </div>
          </Card>
          <Card className="bg-slate-900 border-slate-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Total Records</div>
                <div className="text-2xl font-bold text-cyan-400">{stats.totalRecords}</div>
              </div>
              <BarChart3 className="h-8 w-8 text-cyan-400" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={selectedMemoryType === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedMemoryType('all')}
              className={selectedMemoryType === 'all' ? 'bg-blue-600' : 'border-slate-700'}
            >
              All Types
            </Button>
            <Button
              size="sm"
              variant={selectedMemoryType === 'working' ? 'default' : 'outline'}
              onClick={() => setSelectedMemoryType('working')}
              className={selectedMemoryType === 'working' ? 'bg-green-600' : 'border-slate-700'}
            >
              Working
            </Button>
            <Button
              size="sm"
              variant={selectedMemoryType === 'short-term' ? 'default' : 'outline'}
              onClick={() => setSelectedMemoryType('short-term')}
              className={selectedMemoryType === 'short-term' ? 'bg-blue-600' : 'border-slate-700'}
            >
              Short-term
            </Button>
            <Button
              size="sm"
              variant={selectedMemoryType === 'long-term' ? 'default' : 'outline'}
              onClick={() => setSelectedMemoryType('long-term')}
              className={selectedMemoryType === 'long-term' ? 'bg-purple-600' : 'border-slate-700'}
            >
              Long-term
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
              className={selectedCategory === 'all' ? 'bg-blue-600' : 'border-slate-700'}
            >
              All Categories
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === 'business' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('business')}
              className={selectedCategory === 'business' ? 'bg-cyan-600' : 'border-slate-700'}
            >
              Business
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === 'operational' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('operational')}
              className={selectedCategory === 'operational' ? 'bg-green-600' : 'border-slate-700'}
            >
              Operational
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === 'strategic' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('strategic')}
              className={selectedCategory === 'strategic' ? 'bg-purple-600' : 'border-slate-700'}
            >
              Strategic
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === 'technical' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('technical')}
              className={selectedCategory === 'technical' ? 'bg-orange-600' : 'border-slate-700'}
            >
              Technical
            </Button>
          </div>
        </div>

        {/* Dataset List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredDatasets.map((dataset) => (
            <Card
              key={dataset.id}
              className="bg-slate-900 border-slate-800 hover:border-slate-600 transition-all cursor-pointer"
              onClick={() => setSelectedDataset(dataset)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getCategoryIcon(dataset.category)}
                      <CardTitle className="text-xl text-white">{dataset.name}</CardTitle>
                      <Badge className={`${getMemoryTypeColor(dataset.memoryType)} text-white`}>
                        {dataset.memoryType}
                      </Badge>
                      <Badge className={getCategoryColor(dataset.category)} variant="outline">
                        {dataset.category}
                      </Badge>
                    </div>
                    <CardDescription className="text-gray-400">
                      {dataset.description}
                    </CardDescription>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {dataset.tags.slice(0, 5).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs border-slate-600 text-gray-400">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {dataset.tags.length > 5 && (
                      <Badge variant="outline" className="text-xs border-slate-600 text-gray-400">
                        +{dataset.tags.length - 5} more
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Database className="h-4 w-4" />
                      <span>{dataset.recordCount} records</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(dataset.lastUpdated).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredDatasets.length === 0 && (
            <Card className="bg-slate-900 border-slate-800 p-12">
              <div className="text-center text-gray-400">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No datasets found matching your criteria</p>
                <p className="text-sm mt-2">Try adjusting your search or filters</p>
              </div>
            </Card>
          )}
        </div>

        {/* Dataset Detail Modal */}
        {selectedDataset && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
            onClick={() => setSelectedDataset(null)}
          >
            <Card
              className="bg-slate-900 border-slate-800 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      {getCategoryIcon(selectedDataset.category)}
                      <CardTitle className="text-2xl text-white">{selectedDataset.name}</CardTitle>
                    </div>
                    <CardDescription className="text-gray-400">
                      {selectedDataset.description}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDataset(null)}
                    className="border-slate-700"
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Memory Type</div>
                    <Badge className={`${getMemoryTypeColor(selectedDataset.memoryType)} text-white`}>
                      {selectedDataset.memoryType}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Category</div>
                    <Badge className={getCategoryColor(selectedDataset.category)} variant="outline">
                      {selectedDataset.category}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Record Count</div>
                    <div className="text-white font-medium">{selectedDataset.recordCount}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Status</div>
                    <Badge className="bg-green-600 text-white">{selectedDataset.status}</Badge>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Created</div>
                    <div className="text-white font-medium">
                      {new Date(selectedDataset.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Last Updated</div>
                    <div className="text-white font-medium">
                      {new Date(selectedDataset.lastUpdated).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <div className="text-sm text-gray-400 mb-2">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedDataset.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="border-slate-600 text-gray-300">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-slate-800">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Search className="h-4 w-4 mr-2" />
                    Search This Dataset
                  </Button>
                  <Button variant="outline" className="border-slate-700">
                    <FileText className="h-4 w-4 mr-2" />
                    View Records
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
