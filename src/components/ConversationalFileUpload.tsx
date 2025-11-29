
import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, X, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConversationalFileUploadProps {
  onFileUpload: (fileData: string, fileName: string, fileType: 'csv' | 'excel') => void;
  onCancel: () => void;
  isVisible: boolean;
  conversationId?: string;
}

export const ConversationalFileUpload = ({ onFileUpload, onCancel, isVisible, conversationId }: ConversationalFileUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ 
    name: string; 
    data: string; 
    type: 'csv' | 'excel';
    serverPath?: string;
    preview?: string;
  } | null>(null);
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
        // Handle CSV files as before
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setUploadedFile({ name: file.name, data: content, type: 'csv' });
        };
        reader.readAsText(file);
      } else {
        // For Excel files, we'll upload the file to the backend for processing
        await uploadFileToBackend(file);
      }
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to process the file. Please try again.",
        variant: "destructive"
      });
    }
  };

  const uploadFileToBackend = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId || 'default');
    
    try {
      const response = await fetch('http://localhost:8080/api/files/upload', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        setUploadedFile({ 
          name: file.name, 
          data: result.filePath, 
          type: file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'excel',
          serverPath: result.filePath,
          preview: result.preview || `${result.rowCount || 0} rows detected`
        });
        
        toast({
          title: "File Uploaded",
          description: `${file.name} uploaded successfully and ready for analysis.`,
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Could not upload file to server. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleConfirmUpload = () => {
    if (uploadedFile) {
      onFileUpload(uploadedFile.serverPath || uploadedFile.data, uploadedFile.name, uploadedFile.type);
      setUploadedFile(null);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
  };

  if (!isVisible) return null;

  return (
    <div className="my-4 animate-fade-in">
      <Card className="border-2 border-dashed border-blue-300 bg-blue-50">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Upload className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">Upload Your Data</span>
            </div>

            {!uploadedFile ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
                  dragActive ? 'border-blue-500 bg-blue-100' : 'border-gray-300 bg-white'
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
                    <p className="text-sm text-gray-500">Supports CSV and Excel files (.csv, .xlsx, .xls)</p>
                  </div>
                  <Input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload-input"
                  />
                  <label htmlFor="file-upload-input">
                    <Button variant="outline" className="cursor-pointer">
                      Browse Files
                    </Button>
                  </label>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {uploadedFile.type === 'excel' ? (
                      <FileSpreadsheet className="h-5 w-5 text-green-500" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    <div>
                      <p className="font-medium text-gray-800">{uploadedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {uploadedFile.preview || `${uploadedFile.data.split('\n').length - 1} rows detected`}
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
            )}

            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmUpload}
                disabled={!uploadedFile}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Use This Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
