import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Play, Upload, FileText, Link as LinkIcon } from 'lucide-react';

export function PromptTemplatesTab() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Prompt Templates</h3>
          <p className="text-sm text-gray-400">Reusable prompt templates for AI reasoning and testing</p>
        </div>
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" className="border-slate-700" onClick={() => setModalOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button size="sm" className="bg-blue-600">
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      <Card className="bg-slate-800 border-slate-700 p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-4 mb-4">
            <Select defaultValue="budget-allocation">
              <SelectTrigger className="w-64 bg-slate-900 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="budget-allocation">Budget Allocation Prompt</SelectItem>
                <SelectItem value="incrementality">Incrementality Analysis</SelectItem>
                <SelectItem value="scenario">Scenario Planning</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="border-slate-700">
              <Play className="h-4 w-4 mr-2" />
              Test Prompt
            </Button>
          </div>

          <div>
            <Label className="text-gray-400 mb-2">Template Content</Label>
            <Textarea
              rows={8}
              className="bg-slate-900 border-slate-700 font-mono text-sm"
              defaultValue={`You are an expert in retail media budget optimization. Analyze the following scenario:

Current Budget: {{budget}}
ROAS Target: {{target_roas}}
Channels: {{channels}}
Historical Performance: {{performance_data}}

Provide recommendations for:
1. Budget allocation across channels
2. Expected ROAS per channel
3. Risk factors and mitigation strategies
4. Alternative scenarios to consider`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-400 mb-2">Variables</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-slate-900 rounded">
                  <code className="text-sm text-blue-400">{'{{budget}}'}</code>
                  <span className="text-xs text-gray-500">Currency</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-900 rounded">
                  <code className="text-sm text-blue-400">{'{{target_roas}}'}</code>
                  <span className="text-xs text-gray-500">Number</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-900 rounded">
                  <code className="text-sm text-blue-400">{'{{channels}}'}</code>
                  <span className="text-xs text-gray-500">Array</span>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-gray-400 mb-2">Output Format</Label>
              <Card className="bg-slate-900 border-slate-700 p-3 text-sm text-gray-400">
                <div className="space-y-1">
                  <div>• Structured JSON</div>
                  <div>• Markdown Report</div>
                  <div>• Executive Summary</div>
                  <div>• Action Items List</div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Prompt Template</DialogTitle>
            <DialogDescription className="text-gray-400">Load templates from files or library</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <Input type="file" accept=".txt,.md,.json" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="bg-blue-600">Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
