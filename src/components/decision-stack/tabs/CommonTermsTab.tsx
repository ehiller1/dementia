import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Upload, Database, Link as LinkIcon, CheckCircle } from 'lucide-react';

import { mockCommonTerms } from '@/data/mockDecisionStackData';

export function CommonTermsTab() {
  const [terms] = useState(mockCommonTerms);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [streamUrl, setStreamUrl] = useState('');

  const handleEditDataSource = (term: any) => {
    setSelectedTerm(term);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Common Terms</h3>
          <p className="text-sm text-gray-400">Define KPIs, metrics, and shared glossary terms</p>
        </div>
        <Button size="sm" className="bg-blue-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Term
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-slate-700">
            <TableHead className="text-gray-400">Name</TableHead>
            <TableHead className="text-gray-400">Definition</TableHead>
            <TableHead className="text-gray-400">Formula</TableHead>
            <TableHead className="text-gray-400">Data Source</TableHead>
            <TableHead className="text-gray-400">Owner</TableHead>
            <TableHead className="text-gray-400">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {terms.map((term) => (
            <TableRow key={term.id} className="border-slate-700">
              <TableCell className="font-medium">{term.name}</TableCell>
              <TableCell className="text-gray-400">{term.definition}</TableCell>
              <TableCell className="text-sm font-mono text-blue-400">{term.formula || '-'}</TableCell>
              <TableCell>
                <Button 
                  size="sm" 
                  variant={term.dataSource ? "outline" : "ghost"}
                  onClick={() => handleEditDataSource(term)}
                  className="text-xs"
                >
                  {term.dataSource ? (
                    <><CheckCircle className="h-3 w-3 mr-1 text-green-400" /> {term.dataSource}</>
                  ) : (
                    <><LinkIcon className="h-3 w-3 mr-1" /> Link Data</>
                  )}
                </Button>
              </TableCell>
              <TableCell><Badge variant="outline">{term.owner}</Badge></TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button size="sm" variant="ghost"><Edit className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost"><Trash2 className="h-3 w-3" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Data Source Selection Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Configure Data Source: {selectedTerm?.name}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Select a file, database, or stream to provide data for this term
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="file" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800">
              <TabsTrigger value="file">File Upload</TabsTrigger>
              <TabsTrigger value="database">Database</TabsTrigger>
              <TabsTrigger value="stream">Data Stream</TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4 mt-4">
              <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <Input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="mb-2"
                  accept=".csv,.json,.xlsx"
                />
                <p className="text-sm text-gray-400 mt-2">
                  Supported formats: CSV, JSON, XLSX
                </p>
                {selectedFile && (
                  <div className="mt-4 p-3 bg-slate-800 rounded">
                    <CheckCircle className="h-4 w-4 inline mr-2 text-green-400" />
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="database" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-gray-400">Database Type</Label>
                  <select className="w-full mt-1 bg-slate-800 border-slate-700 rounded p-2">
                    <option>PostgreSQL</option>
                    <option>MySQL</option>
                    <option>SQL Server</option>
                    <option>Snowflake</option>
                    <option>BigQuery</option>
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
                  <Label className="text-gray-400">Query</Label>
                  <textarea
                    className="w-full bg-slate-800 border-slate-700 rounded p-2 font-mono text-sm mt-1"
                    rows={4}
                    placeholder="SELECT metric_name, value FROM metrics WHERE category = 'kpi'"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stream" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-gray-400">Stream Type</Label>
                  <select className="w-full mt-1 bg-slate-800 border-slate-700 rounded p-2">
                    <option>Kafka</option>
                    <option>Kinesis</option>
                    <option>Pub/Sub</option>
                    <option>EventHub</option>
                    <option>WebSocket</option>
                  </select>
                </div>
                <div>
                  <Label className="text-gray-400">Stream URL / Topic</Label>
                  <Input 
                    className="bg-slate-800 border-slate-700 mt-1"
                    placeholder="kafka://broker:9092/metrics-topic"
                    value={streamUrl}
                    onChange={(e) => setStreamUrl(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-gray-400">Authentication</Label>
                  <Input 
                    type="password"
                    className="bg-slate-800 border-slate-700 mt-1"
                    placeholder="API Key or Token"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Save Data Source
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
