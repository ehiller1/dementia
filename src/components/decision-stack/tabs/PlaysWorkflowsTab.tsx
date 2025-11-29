import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Zap, GitBranch, Upload, Link as LinkIcon, FileText } from 'lucide-react';

export function PlaysWorkflowsTab() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Plays & Workflows</h3>
          <p className="text-sm text-gray-400">Decision workflows that operationalize AI recommendations</p>
        </div>
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" className="border-slate-700" onClick={() => setModalOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button size="sm" className="bg-blue-600">
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        </div>
      </div>

      <Card className="bg-slate-800 border-slate-700 p-6">
        <div className="text-center py-12">
          <GitBranch className="h-16 w-16 mx-auto mb-4 text-purple-400 opacity-50" />
          <h4 className="text-lg font-semibold mb-2">Workflow Builder</h4>
          <p className="text-gray-400 mb-4">Drag-and-drop editor for defining decision workflows</p>
          <div className="flex justify-center space-x-4 text-sm text-gray-500 mb-6">
            <div>• Active Workflows: 6</div>
            <div>• Pending Approval: 2</div>
            <div>• Total Executions: 1,234</div>
          </div>
          <div className="flex justify-center space-x-3">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Zap className="h-4 w-4 mr-2" />
              Open Workflow Editor
            </Button>
            <Button variant="outline" className="border-slate-700" onClick={() => setModalOpen(true)}>
              <LinkIcon className="h-4 w-4 mr-2" />
              Import Workflow
            </Button>
          </div>
        </div>
      </Card>

      {/* Workflow Import Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Import Workflow Definition</DialogTitle>
            <DialogDescription className="text-gray-400">
              Load workflow configurations from files or templates
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="file" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800">
              <TabsTrigger value="file">File Upload</TabsTrigger>
              <TabsTrigger value="template">Templates</TabsTrigger>
              <TabsTrigger value="url">From URL</TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4 mt-4">
              <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <Input
                  type="file"
                  className="mb-2"
                  accept=".json,.yaml,.yml,.bpmn"
                />
                <p className="text-sm text-gray-400 mt-2">
                  Supported formats: JSON, YAML, BPMN 2.0
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Workflow Name (optional)</Label>
                <Input 
                  className="bg-slate-800 border-slate-700"
                  placeholder="Override name from file"
                />
              </div>
            </TabsContent>

            <TabsContent value="template" className="space-y-4 mt-4">
              <div className="space-y-3">
                <Label className="text-gray-400">Select Template</Label>
                <select className="w-full bg-slate-800 border-slate-700 rounded p-2">
                  <option>Budget Approval Workflow</option>
                  <option>Campaign Launch Checklist</option>
                  <option>Inventory Reorder Process</option>
                  <option>Promotion Planning</option>
                  <option>Price Change Approval</option>
                </select>
                <div className="bg-slate-800 p-4 rounded mt-4">
                  <h4 className="font-semibold mb-2">Template Preview: Budget Approval Workflow</h4>
                  <p className="text-sm text-gray-400 mb-3">
                    Multi-stage approval process for budget allocation decisions
                  </p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>• Steps: 5</div>
                    <div>• Approval Levels: 2</div>
                    <div>• Avg Duration: 2-3 days</div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-gray-400">Workflow URL</Label>
                  <Input 
                    className="bg-slate-800 border-slate-700 mt-1"
                    placeholder="https://example.com/workflows/budget-approval.json"
                  />
                  <p className="text-xs text-gray-500 mt-1">Load workflow from external URL</p>
                </div>
                <div>
                  <Label className="text-gray-400">Authentication (optional)</Label>
                  <Input 
                    type="password"
                    className="bg-slate-800 border-slate-700 mt-1"
                    placeholder="API Key or Bearer Token"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <FileText className="h-4 w-4 mr-2" />
              Import Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
