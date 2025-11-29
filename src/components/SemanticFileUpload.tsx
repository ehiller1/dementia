import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, X, CheckCircle, Brain, Target, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SemanticFileUploadProps {
  onFileUpload: (result: any) => void;
  onCancel: () => void;
  isVisible: boolean;
  conversationId?: string;
}

interface AgentProposal {
  agentName: string;
  confidence: number;
  semanticSimilarity: number;
  fieldBonus: number;
  analysisPlan: string;
  bid: {
    score: number;
  };
}

interface UploadResult {
  fileName: string;
  datasetProfile: any;
  agentCount: number;
  topAgent: AgentProposal;
  proposals: AgentProposal[];
  semanticScores: any[];
}

export const SemanticFileUpload = ({ onFileUpload, onCancel, isVisible, conversationId }: SemanticFileUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ 
    name: string; 
    data: string; 
    type: 'csv' | 'excel';
  } | null>(null);
  const [userDescription, setUserDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files && files[0]) {
      processFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    
    if (!isCSV && !isExcel) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV or Excel file (.csv, .xlsx, .xls).",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isCSV) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setUploadedFile({ 
            name: file.name, 
            data: content, 
            type: 'csv' 
          });
        };
        reader.readAsText(file);
      } else {
        // For Excel files, we'd need additional processing
        toast({
          title: "Excel Support",
          description: "Excel file support coming soon. Please use CSV files for now.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to process the file. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSemanticUpload = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/files/upload-with-agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileData: uploadedFile.data,
          fileName: uploadedFile.name,
          fileType: uploadedFile.type,
          conversationId: conversationId || 'default',
          userDescription: userDescription
        })
      });

      if (response.ok) {
        const result = await response.json();
        setUploadResult(result);
        
        toast({
          title: "🧠 Semantic Analysis Complete",
          description: `Found ${result.agentCount} matching agents. Best match: ${result.topAgent?.agentName || 'None'}`,
        });
      } else {
        throw new Error('Semantic upload failed');
      }
    } catch (error) {
      console.error('Semantic upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Could not process file with semantic analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmSelection = () => {
    if (uploadResult) {
      onFileUpload(uploadResult);
      // Reset state
      setUploadedFile(null);
      setUploadResult(null);
      setUserDescription('');
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadResult(null);
    setUserDescription('');
  };

  if (!isVisible) return null;

  return (
    <div className="my-4 animate-fade-in">
      <Card className="border-2 border-dashed border-purple-300 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <span className="text-purple-800">Smart File Upload with Agent Discovery</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!uploadedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
                dragActive ? 'border-purple-500 bg-purple-100' : 'border-gray-300 bg-white'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <FileText className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-700">Drop your data file here</p>
                  <p className="text-sm text-gray-500">Supports CSV files (.csv)</p>
                </div>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="semantic-file-upload-input"
                />
                <label htmlFor="semantic-file-upload-input">
                  <Button variant="outline" className="cursor-pointer">
                    Browse Files
                  </Button>
                </label>
              </div>
            </div>
          ) : !uploadResult ? (
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-gray-800">{uploadedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {uploadedFile.data.split('\n').length - 1} rows detected
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {uploadedFile.type.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Describe your data (optional)
                </label>
                <Textarea
                  value={userDescription}
                  onChange={(e) => setUserDescription(e.target.value)}
                  placeholder="e.g., 'Monthly sales data for Q4 analysis' or 'Customer transaction history for churn prediction'"
                  rows={2}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">
                  This helps our AI find the most relevant agents for your analysis
                </p>
              </div>

              <div className="flex justify-between items-center pt-4">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSemanticUpload}
                  disabled={isProcessing}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isProcessing ? (
                    <>
                      <Brain className="mr-2 h-4 w-4 animate-spin" />
                      Finding Agents...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Analyze & Find Agents
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Dataset Analysis Results */}
              <div className="bg-white rounded-lg p-4 border">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Dataset Analysis
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">File:</span>
                    <span className="ml-2 font-medium">{uploadResult.fileName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Fields:</span>
                    <span className="ml-2 font-medium">{uploadResult.datasetProfile?.fieldCount || 0}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium">{uploadResult.datasetProfile?.description}</span>
                  </div>
                </div>
              </div>

              {/* Agent Discovery Results */}
              <div className="bg-white rounded-lg p-4 border">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  Agent Discovery Results
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Agents Found:</span>
                    <Badge variant="secondary">{uploadResult.agentCount}</Badge>
                  </div>
                  
                  {uploadResult.topAgent && (
                    <div className="border rounded p-3 bg-green-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-green-800">
                          🏆 Best Match: {uploadResult.topAgent.agentName}
                        </span>
                        <Badge className="bg-green-600">
                          {(uploadResult.topAgent.confidence * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="text-xs text-green-700 space-y-1">
                        <div>🎯 Confidence: {(uploadResult.topAgent.confidence * 100).toFixed(1)}%</div>
                        <div>🧠 Semantic Match: {(uploadResult.topAgent.semanticSimilarity * 100).toFixed(1)}%</div>
                        <div>📊 Field Bonus: +{(uploadResult.topAgent.fieldBonus * 100).toFixed(1)}%</div>
                        <div>💰 Bid Score: {uploadResult.topAgent.bid?.score?.toFixed(2) || 'N/A'}</div>
                      </div>
                    </div>
                  )}

                  {uploadResult.semanticScores && uploadResult.semanticScores.length > 1 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-gray-700">Other Candidates:</span>
                      {uploadResult.semanticScores.slice(1, 3).map((agent, idx) => (
                        <div key={idx} className="border rounded p-2 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{agent.name}</span>
                            <Badge variant="outline">
                              {(agent.confidence * 100).toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <Button variant="outline" onClick={handleRemoveFile}>
                  Try Different File
                </Button>
                <Button 
                  onClick={handleConfirmSelection}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Target className="mr-2 h-4 w-4" />
                  Use {uploadResult.topAgent?.agentName || 'Selected Agent'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SemanticFileUpload;
