import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Settings, Network, Upload, Database, Link as LinkIcon } from 'lucide-react';

export function EntityMapTab() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Entity Map</h3>
          <p className="text-sm text-gray-400">Visual representation of business entity relationships</p>
        </div>
        <Button size="sm" className="bg-blue-600" onClick={() => setModalOpen(true)}>
          <LinkIcon className="h-4 w-4 mr-2" />
          Import Entities
        </Button>
      </div>

      <Card className="bg-slate-800 border-slate-700 p-6">
        <div className="text-center py-12">
          <Network className="h-16 w-16 mx-auto mb-4 text-blue-400 opacity-50" />
          <h4 className="text-lg font-semibold mb-2">Interactive Entity Graph</h4>
          <p className="text-gray-400 mb-4">Visual graph editor for entity relationships</p>
          <div className="flex justify-center space-x-4 text-sm text-gray-500 mb-6">
            <div>• SKUs: 1,245</div>
            <div>• Distribution Centers: 12</div>
            <div>• Retailers: 8</div>
            <div>• Relationships: 45</div>
          </div>
          <div className="flex justify-center space-x-3">
            <Button className="bg-blue-600">
              <Settings className="h-4 w-4 mr-2" />
              Configure Graph
            </Button>
            <Button variant="outline" className="border-slate-700" onClick={() => setModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Load Data
            </Button>
          </div>
        </div>
      </Card>

      {/* Entity Data Import Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Import Entity Data</DialogTitle>
            <DialogDescription className="text-gray-400">
              Load entity relationships from files, databases, or APIs
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="file" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800">
              <TabsTrigger value="file">File Upload</TabsTrigger>
              <TabsTrigger value="database">Database</TabsTrigger>
              <TabsTrigger value="api">API</TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4 mt-4">
              <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <Input
                  type="file"
                  className="mb-2"
                  accept=".csv,.json,.graphml,.gexf"
                />
                <p className="text-sm text-gray-400 mt-2">
                  Supported formats: CSV, JSON, GraphML, GEXF
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Entity Type Mapping</Label>
                <textarea
                  className="w-full bg-slate-800 border-slate-700 rounded p-2 font-mono text-sm mt-1"
                  rows={3}
                  placeholder='{"SKU": "id", "DC": "location_id", "Retailer": "partner_id"}'
                />
                <p className="text-xs text-gray-500">Define column mappings for entity types</p>
              </div>
            </TabsContent>

            <TabsContent value="database" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-gray-400">Database Type</Label>
                  <select className="w-full mt-1 bg-slate-800 border-slate-700 rounded p-2">
                    <option>PostgreSQL</option>
                    <option>MySQL</option>
                    <option>Neo4j (Graph DB)</option>
                    <option>Amazon Neptune</option>
                  </select>
                </div>
                <div>
                  <Label className="text-gray-400">Connection String</Label>
                  <Input 
                    className="bg-slate-800 border-slate-700 mt-1"
                    placeholder="postgres://user:pass@host:5432/database"
                  />
                </div>
                <div>
                  <Label className="text-gray-400">Entities Query</Label>
                  <textarea
                    className="w-full bg-slate-800 border-slate-700 rounded p-2 font-mono text-sm mt-1"
                    rows={3}
                    placeholder="SELECT id, type, name FROM entities"
                  />
                </div>
                <div>
                  <Label className="text-gray-400">Relationships Query</Label>
                  <textarea
                    className="w-full bg-slate-800 border-slate-700 rounded p-2 font-mono text-sm mt-1"
                    rows={3}
                    placeholder="SELECT source_id, target_id, relationship_type FROM relationships"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="api" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-gray-400">API Endpoint</Label>
                  <Input 
                    className="bg-slate-800 border-slate-700 mt-1"
                    placeholder="https://api.example.com/v1/entities"
                  />
                </div>
                <div>
                  <Label className="text-gray-400">Authentication</Label>
                  <Input 
                    type="password"
                    className="bg-slate-800 border-slate-700 mt-1"
                    placeholder="API Key or Bearer Token"
                  />
                </div>
                <div>
                  <Label className="text-gray-400">Response Path</Label>
                  <Input 
                    className="bg-slate-800 border-slate-700 mt-1"
                    placeholder="data.entities"
                  />
                  <p className="text-xs text-gray-500 mt-1">JSON path to entity data</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Database className="h-4 w-4 mr-2" />
              Import Entities
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
