
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateSalesData, generateWebTrafficData, convertToCSV } from '@/utils/sampleDataGenerator';
import { Download, Upload, FileText } from 'lucide-react';

export const DataUploader = () => {
  const [selectedSampleData, setSelectedSampleData] = useState<string>('');

  const downloadSampleData = (type: string) => {
    let data, filename;
    
    switch (type) {
      case 'sales':
        data = generateSalesData();
        filename = 'sample_sales_data.csv';
        break;
      case 'traffic':
        data = generateWebTrafficData();
        filename = 'sample_traffic_data.csv';
        break;
      default:
        return;
    }

    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        console.log('File uploaded:', file.name);
        console.log('Content preview:', content.substring(0, 200) + '...');
        // Here you could save to state or process the data
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Upload your own data or generate sample datasets for testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Section */}
          <div className="space-y-3">
            <Label htmlFor="file-upload" className="text-base font-semibold">Upload Your Data</Label>
            <div className="flex items-center gap-3">
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.json,.xlsx"
                onChange={handleFileUpload}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              <Upload className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600">
              Supported formats: CSV, JSON, Excel (.xlsx)
            </p>
          </div>

          {/* Sample Data Section */}
          <div className="border-t pt-6">
            <Label className="text-base font-semibold">Generate Sample Data</Label>
            <p className="text-sm text-gray-600 mb-4">
              Download realistic sample datasets to test the seasonality analysis
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monthly Sales Data</Label>
                <Button 
                  onClick={() => downloadSampleData('sales')} 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Sales Dataset
                </Button>
                <p className="text-xs text-gray-500">48 months of sales data with seasonal patterns</p>
              </div>

              <div className="space-y-2">
                <Label>Daily Web Traffic</Label>
                <Button 
                  onClick={() => downloadSampleData('traffic')} 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Traffic Dataset
                </Button>
                <p className="text-xs text-gray-500">365 days of web traffic with weekly patterns</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
