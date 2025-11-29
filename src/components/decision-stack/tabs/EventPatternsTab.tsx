import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Database as DatabaseIcon, Link as LinkIcon, Upload, CheckCircle } from 'lucide-react';
import { mockEventPatterns } from '@/data/mockDecisionStackData';

export function EventPatternsTab() {
  const [patterns] = useState(mockEventPatterns);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<any>(null);

  const handleConfigureSource = (pattern: any) => {
    setSelectedPattern(pattern);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Event Patterns</h3>
          <p className="text-sm text-gray-400">Define event detection rules based on data streams</p>
        </div>
        <Button size="sm" className="bg-blue-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Pattern
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {patterns.map((pattern) => (
          <Card key={pattern.id} className="bg-slate-800 border-slate-700 p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="font-semibold">{pattern.name}</h4>
                  <Badge className={
                    pattern.alertLevel === 'high' ? 'bg-red-600' :
                    pattern.alertLevel === 'medium' ? 'bg-yellow-600' :
                    'bg-blue-600'
                  }>
                    {pattern.alertLevel}
                  </Badge>
                </div>
                <p className="text-sm text-gray-400 mb-3">{pattern.description}</p>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 mb-1">Data Source</div>
                    <Button
                      size="sm"
                      variant={pattern.sourceConnected ? "outline" : "ghost"}
                      onClick={() => handleConfigureSource(pattern)}
                      className="text-xs h-8"
                    >
                      {pattern.sourceConnected ? (
                        <><CheckCircle className="h-3 w-3 mr-1 text-green-400" /> {pattern.dataSource}</>
                      ) : (
                        <><LinkIcon className="h-3 w-3 mr-1" /> Configure</>
                      )}
                    </Button>
                  </div>
                  <div>
                    <div className="text-gray-500">Trigger Condition</div>
                    <div className="text-white">{pattern.triggerCondition}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Threshold</div>
                    <div className="text-white">{pattern.threshold}</div>
                  </div>
                  <div className="flex space-x-2 justify-end">
                    <Button size="sm" variant="ghost"><Edit className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Data Source Configuration Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Configure Event Data Source: {selectedPattern?.name}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Connect to a live data source to detect events in real-time
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="api" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-800">
              <TabsTrigger value="api">API</TabsTrigger>
              <TabsTrigger value="database">Database</TabsTrigger>
              <TabsTrigger value="stream">Stream</TabsTrigger>
              <TabsTrigger value="file">File</TabsTrigger>
            </TabsList>

            <TabsContent value="api" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-gray-400">API Endpoint</Label>
                  <Input 
                    className="bg-slate-800 border-slate-700 mt-1"
                    placeholder="https://api.retailmedia.com/v1/metrics"
                  />
                </div>
                <div>
                  <Label className="text-gray-400">Method</Label>
                  <select className="w-full mt-1 bg-slate-800 border-slate-700 rounded p-2">
                    <option>GET</option>
                    <option>POST</option>
                  </select>
                </div>
                <div>
                  <Label className="text-gray-400">Headers (JSON)</Label>
                  <textarea
                    className="w-full bg-slate-800 border-slate-700 rounded p-2 font-mono text-sm mt-1"
                    rows={3}
                    placeholder='{"Authorization": "Bearer YOUR_TOKEN"}'
                  />
                </div>
                <div>
                  <Label className="text-gray-400">Polling Interval</Label>
                  <Input 
                    type="number"
                    className="bg-slate-800 border-slate-700 mt-1"
                    placeholder="60"
                    defaultValue="60"
                  />
                  <p className="text-xs text-gray-500 mt-1">Seconds between API calls</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="database" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-gray-400">Database Type</Label>
                  <select className="w-full mt-1 bg-slate-800 border-slate-700 rounded p-2">
                    <option>PostgreSQL</option>
                    <option>MySQL</option>
                    <option>Snowflake</option>
                    <option>BigQuery</option>
                    <option>Redshift</option>
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
                    placeholder="SELECT event_date, metric_value FROM events WHERE event_type = 'sales'"
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
                  </select>
                </div>
                <div>
                  <Label className="text-gray-400">Topic / Stream Name</Label>
                  <Input 
                    className="bg-slate-800 border-slate-700 mt-1"
                    placeholder="retail-events-stream"
                  />
                </div>
                <div>
                  <Label className="text-gray-400">Broker URL</Label>
                  <Input 
                    className="bg-slate-800 border-slate-700 mt-1"
                    placeholder="kafka://broker:9092"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="file" className="space-y-4 mt-4">
              <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <Input
                  type="file"
                  className="mb-2"
                  accept=".csv,.json,.xlsx"
                />
                <p className="text-sm text-gray-400 mt-2">
                  Upload historical event data for pattern testing
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <DatabaseIcon className="h-4 w-4 mr-2" />
              Connect Data Source
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
