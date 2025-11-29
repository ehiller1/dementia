import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, 
  Link, 
  TrendingUp, 
  Clock, 
  Target, 
  Lightbulb,
  ChevronRight,
  Network
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface InstitutionalConnection {
  id: string;
  currentThemeId: string;
  historicalMemoryId: string;
  connectionType: 'similar_problem' | 'shared_entity' | 'solution_pattern' | 'contextual_relevance';
  similarity: number;
  bridgingContext: Record<string, any>;
  historicalMemory?: {
    title: string;
    content: string;
    created_at: string;
    tags: string[];
  };
}

interface TemplateTheme {
  id: string;
  templateId: string;
  themes: string[];
  entities: string[];
  solutionPattern: string;
  confidence: number;
  extractedAt: string;
  connections?: InstitutionalConnection[];
}

interface InstitutionalMemoryBridgeProps {
  conversationId: string;
  tenantId?: string;
  userId?: string;
}

const InstitutionalMemoryBridge: React.FC<InstitutionalMemoryBridgeProps> = ({
  conversationId,
  tenantId = 'default_tenant',
  userId = 'default_user'
}) => {
  const [themes, setThemes] = useState<TemplateTheme[]>([]);
  const [connections, setConnections] = useState<InstitutionalConnection[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<TemplateTheme | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalThemes: 0,
    totalConnections: 0,
    avgConfidence: 0,
    topSolutionPattern: ''
  });

  useEffect(() => {
    loadThemesAndConnections();
  }, [conversationId, tenantId, userId]);

  const loadThemesAndConnections = async () => {
    setLoading(true);
    try {
      // Load template themes for current conversation
      const { data: themeData, error: themeError } = await supabase
        .from('memory_cards')
        .select('*')
        .eq('type', 'template_theme')
        .eq('conversation_id', conversationId)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (themeError) throw themeError;

      // Parse themes and load their connections
      const parsedThemes: TemplateTheme[] = [];
      const allConnections: InstitutionalConnection[] = [];

      for (const theme of themeData || []) {
        try {
          const content = JSON.parse(theme.content);
          const parsedTheme: TemplateTheme = {
            id: theme.id,
            templateId: content.templateId || 'unknown',
            themes: content.themes || [],
            entities: content.entities || [],
            solutionPattern: content.solutionPattern || 'general',
            confidence: theme.importance || 0,
            extractedAt: theme.created_at
          };

          // Load connections for this theme
          const { data: linkData, error: linkError } = await supabase
            .from('memory_links')
            .select(`
              *,
              target_memory:memory_cards!memory_links_target_card_id_fkey(
                id,
                title,
                content,
                created_at,
                tags
              )
            `)
            .eq('source_card_id', theme.id)
            .eq('tenant_id', tenantId);

          if (!linkError && linkData) {
            const themeConnections = linkData.map(link => ({
              id: link.id,
              currentThemeId: theme.id,
              historicalMemoryId: link.target_card_id,
              connectionType: link.relation as any,
              similarity: (link.metadata as any)?.connection_strength || 0,
              bridgingContext: (link.metadata as any)?.bridging_context || {},
              historicalMemory: (link as any).target_memory ? {
                title: (link as any).target_memory.title,
                content: (link as any).target_memory.content?.substring(0, 200),
                created_at: (link as any).target_memory.created_at,
                tags: (link as any).target_memory.tags || []
              } : undefined
            }));

            parsedTheme.connections = themeConnections;
            allConnections.push(...themeConnections);
          }

          parsedThemes.push(parsedTheme);
        } catch (parseError) {
          console.warn('Failed to parse theme:', parseError);
        }
      }

      setThemes(parsedThemes);
      setConnections(allConnections);

      // Calculate stats
      const totalThemes = parsedThemes.length;
      const totalConnections = allConnections.length;
      const avgConfidence = totalThemes > 0 
        ? parsedThemes.reduce((sum, t) => sum + t.confidence, 0) / totalThemes 
        : 0;
      
      const patternCounts = parsedThemes.reduce((acc, theme) => {
        acc[theme.solutionPattern] = (acc[theme.solutionPattern] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topSolutionPattern = Object.entries(patternCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';

      setStats({
        totalThemes,
        totalConnections,
        avgConfidence,
        topSolutionPattern
      });

    } catch (error) {
      console.error('Failed to load themes and connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConnectionTypeIcon = (type: string) => {
    switch (type) {
      case 'similar_problem': return <Brain className="h-4 w-4" />;
      case 'shared_entity': return <Target className="h-4 w-4" />;
      case 'solution_pattern': return <Lightbulb className="h-4 w-4" />;
      case 'contextual_relevance': return <Clock className="h-4 w-4" />;
      default: return <Link className="h-4 w-4" />;
    }
  };

  const getConnectionTypeColor = (type: string) => {
    switch (type) {
      case 'similar_problem': return 'bg-blue-100 text-blue-700';
      case 'shared_entity': return 'bg-green-100 text-green-700';
      case 'solution_pattern': return 'bg-purple-100 text-purple-700';
      case 'contextual_relevance': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const renderStats = () => (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Template Themes</p>
              <p className="text-2xl font-bold">{stats.totalThemes}</p>
            </div>
            <Brain className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Institutional Links</p>
              <p className="text-2xl font-bold">{stats.totalConnections}</p>
            </div>
            <Network className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Confidence</p>
              <p className="text-2xl font-bold">{Math.round(stats.avgConfidence * 100)}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Top Pattern</p>
              <p className="text-sm font-medium">{stats.topSolutionPattern.replace('_', ' ')}</p>
            </div>
            <Lightbulb className="h-8 w-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderThemeList = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Template Themes
        </CardTitle>
        <CardDescription>
          Extracted themes from template executions with institutional connections
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <p>Loading themes...</p>
            </div>
          ) : themes.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <p className="text-gray-500">No template themes found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTheme?.id === theme.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTheme(theme === selectedTheme ? null : theme)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{theme.templateId}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {Math.round(theme.confidence * 100)}%
                      </Badge>
                      {theme.connections && theme.connections.length > 0 && (
                        <Badge className="bg-green-100 text-green-700">
                          {theme.connections.length} links
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    <Badge className="bg-purple-100 text-purple-700 text-xs">
                      {theme.solutionPattern.replace('_', ' ')}
                    </Badge>
                    {theme.themes.slice(0, 3).map((t, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {t}
                      </Badge>
                    ))}
                    {theme.themes.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{theme.themes.length - 3} more
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    {formatDate(theme.extractedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );

  const renderConnectionDetails = () => {
    if (!selectedTheme || !selectedTheme.connections || selectedTheme.connections.length === 0) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <Network className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {selectedTheme 
                ? 'No institutional connections found for this theme'
                : 'Select a theme to view its institutional connections'
              }
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Institutional Connections
          </CardTitle>
          <CardDescription>
            Historical knowledge linked to "{selectedTheme.templateId}"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {selectedTheme.connections.map((connection) => (
                <div key={connection.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getConnectionTypeIcon(connection.connectionType)}
                      <Badge className={getConnectionTypeColor(connection.connectionType)}>
                        {connection.connectionType.replace('_', ' ')}
                      </Badge>
                    </div>
                    <Badge variant="outline">
                      {Math.round(connection.similarity * 100)}% match
                    </Badge>
                  </div>
                  
                  {connection.historicalMemory && (
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">
                        {connection.historicalMemory.title}
                      </h5>
                      <p className="text-sm text-gray-600">
                        {connection.historicalMemory.content}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatDate(connection.historicalMemory.created_at)}</span>
                        <div className="flex gap-1">
                          {connection.historicalMemory.tags?.slice(0, 2).map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {connection.bridgingContext && Object.keys(connection.bridgingContext).length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-medium text-gray-700 mb-1">Bridge Context:</p>
                      <div className="text-xs text-gray-600">
                        {Object.entries(connection.bridgingContext).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">{key.replace('_', ' ')}:</span>
                            <span className="font-mono">
                              {typeof value === 'string' ? value.substring(0, 30) : JSON.stringify(value).substring(0, 30)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Institutional Memory Bridge</h2>
          <p className="text-gray-600">
            Connecting present approaches with institutional knowledge
          </p>
        </div>
        <Button onClick={loadThemesAndConnections} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {renderStats()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderThemeList()}
        {renderConnectionDetails()}
      </div>
    </div>
  );
};

export default InstitutionalMemoryBridge;
