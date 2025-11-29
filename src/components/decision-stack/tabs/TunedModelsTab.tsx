import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Play, Upload, Database, Link as LinkIcon, CheckCircle } from 'lucide-react';
import { mockTunedModels } from '@/data/mockDecisionStackData';

export function TunedModelsTab() {
  const [models] = useState(mockTunedModels);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<any>(null);

  const handleConfigureDataset = (model: any) => {
    setSelectedModel(model);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Tuned Models</h3>
          <p className="text-sm text-gray-400">AI models fine-tuned for function-specific tasks</p>
        </div>
        <Button size="sm" className="bg-blue-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Model
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {models.map((model) => (
          <Card key={model.id} className="bg-slate-800 border-slate-700 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold">{model.name}</h4>
                <p className="text-sm text-gray-400">{model.type}</p>
              </div>
              <Badge className={
                model.status === 'active' ? 'bg-green-600' :
                model.status === 'training' ? 'bg-yellow-600' :
                'bg-gray-600'
              }>
                {model.status}
              </Badge>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Accuracy</span>
                <span className="font-semibold">{(model.accuracy * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${model.accuracy * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Last Trained: {model.lastTrained}</span>
              </div>
            </div>
            
            <div className="text-xs text-gray-400 mb-3">
              <div className="font-semibold mb-1">Training Dataset:</div>
              <Button
                size="sm"
                variant={model.datasetConnected ? "outline" : "ghost"}
                onClick={() => handleConfigureDataset(model)}
                className="text-xs h-7 mt-1 w-full justify-start"
              >
                {model.datasetConnected ? (
                  <><CheckCircle className="h-3 w-3 mr-1 text-green-400" /> {model.dataset}</>
                ) : (
                  <><LinkIcon className="h-3 w-3 mr-1" /> Link Dataset</>
                )}
              </Button>
            </div>
            
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" className="flex-1 border-slate-700">
                <Play className="h-3 w-3 mr-1" />
                Test
              </Button>
              <Button size="sm" variant="outline" className="border-slate-700">
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Dataset Configuration Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Configure Training Dataset: {selectedModel?.name}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Select a dataset for model training and validation
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="file" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800">
              <TabsTrigger value="file">File Upload</TabsTrigger>
              <TabsTrigger value="database">Database</TabsTrigger>
              <TabsTrigger value="cloud">Cloud Storage</TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4 mt-4">
              <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <Input
                  type="file"
                  className="mb-2"
                  accept=".csv,.json,.parquet,.xlsx"
                />
                <p className="text-sm text-gray-400 mt-2">
                  Supported formats: CSV, JSON, Parquet, XLSX
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Training/Validation Split</Label>
                <Input type="number" className="bg-slate-800 border-slate-700" defaultValue="80" placeholder="80" />
                <p className="text-xs text-gray-500">Percentage for training (remainder for validation)</p>
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
                    placeholder="SELECT features, target FROM training_data WHERE created_at > '2022-01-01'"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cloud" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-gray-400">Cloud Provider</Label>
                  <select className="w-full mt-1 bg-slate-800 border-slate-700 rounded p-2">
                    <option>Amazon S3</option>
                    <option>Google Cloud Storage</option>
                    <option>Azure Blob Storage</option>
                  </select>
                </div>
                <div>
                  <Label className="text-gray-400">Bucket / Container</Label>
                  <Input 
                    className="bg-slate-800 border-slate-700 mt-1"
                    placeholder="my-training-data-bucket"
                  />
                </div>
                <div>
                  <Label className="text-gray-400">File Path</Label>
                  <Input 
                    className="bg-slate-800 border-slate-700 mt-1"
                    placeholder="datasets/campaign-data/train.csv"
                  />
                </div>
                <div>
                  <Label className="text-gray-400">Access Key / Credentials</Label>
                  <Input 
                    type="password"
                    className="bg-slate-800 border-slate-700 mt-1"
                    placeholder="Enter access credentials"
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
              <Database className="h-4 w-4 mr-2" />
              Link Dataset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
