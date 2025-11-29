
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Calendar, TrendingUp, Lightbulb, Settings } from 'lucide-react';

interface DataPreview {
  filename: string;
  rows: number;
  columns: string[];
  dateColumn?: string;
  valueColumn?: string;
  suggestedPeriod?: number;
  seasonalityHints: string[];
}

interface AnalysisParameters {
  period: number;
  analysisDepth: 'basic' | 'detailed' | 'comprehensive';
  timeRange: 'last_year' | 'last_2_years' | 'all_data';
  focusArea: 'trends' | 'seasonal' | 'forecasting';
}

interface VisualAnalysisBuilderProps {
  onStartAnalysis: (params: AnalysisParameters) => void;
  isAnalyzing: boolean;
}

export const VisualAnalysisBuilder = ({ onStartAnalysis, isAnalyzing }: VisualAnalysisBuilderProps) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dataPreview, setDataPreview] = useState<DataPreview | null>(null);
  const [parameters, setParameters] = useState<AnalysisParameters>({
    period: 12,
    analysisDepth: 'detailed',
    timeRange: 'last_year',
    focusArea: 'seasonal'
  });

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      
      // Simulate data preview generation
      const preview: DataPreview = {
        filename: file.name,
        rows: 1248,
        columns: ['Date', 'Sales', 'Region', 'Product'],
        dateColumn: 'Date',
        valueColumn: 'Sales',
        suggestedPeriod: 12,
        seasonalityHints: [
          'Monthly data detected - suitable for yearly seasonality',
          'Strong Q4 pattern visible in preview',
          'Consistent growth trend with seasonal variation'
        ]
      };
      
      setDataPreview(preview);
      setParameters(prev => ({ ...prev, period: preview.suggestedPeriod || 12 }));
    }
  }, []);

  const handleStartAnalysis = () => {
    if (dataPreview && uploadedFile) {
      onStartAnalysis(parameters);
    }
  };

  const getAnalysisDescription = () => {
    const descriptions = {
      basic: 'Quick seasonal overview with key patterns',
      detailed: 'Comprehensive analysis with business insights',
      comprehensive: 'Deep analysis with forecasting and recommendations'
    };
    return descriptions[parameters.analysisDepth];
  };

  const getPeriodDescription = () => {
    const periods: Record<number, string> = {
      4: 'Quarterly patterns (4 periods per year)',
      12: 'Monthly patterns (12 periods per year)',
      52: 'Weekly patterns (52 periods per year)',
      365: 'Daily patterns (365 periods per year)'
    };
    return periods[parameters.period] || `${parameters.period} periods per cycle`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Data Upload & Analysis Builder
          </CardTitle>
          <CardDescription>
            Drag and drop your data or configure analysis parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    Click to upload
                  </span>
                  <span className="text-sm text-gray-500"> or drag and drop</span>
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-gray-500">
                CSV, Excel files up to 10MB
              </p>
            </div>
          </div>

          {/* Data Preview */}
          {dataPreview && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Data Preview: {dataPreview.filename}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Rows:</span> {dataPreview.rows.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Columns:</span> {dataPreview.columns.join(', ')}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Smart Suggestions:</span>
                  </div>
                  {dataPreview.seasonalityHints.map((hint, index) => (
                    <Badge key={index} variant="secondary" className="text-xs mr-2">
                      {hint}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Parameters */}
          {dataPreview && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Analysis Configuration
                </CardTitle>
                <CardDescription>
                  Customize your analysis to match your business needs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Analysis Depth */}
                <div className="space-y-2">
                  <Label>Analysis Depth</Label>
                  <Select
                    value={parameters.analysisDepth}
                    onValueChange={(value: 'basic' | 'detailed' | 'comprehensive') => 
                      setParameters(prev => ({ ...prev, analysisDepth: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic - Quick Overview</SelectItem>
                      <SelectItem value="detailed">Detailed - Business Insights</SelectItem>
                      <SelectItem value="comprehensive">Comprehensive - Full Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">{getAnalysisDescription()}</p>
                </div>

                {/* Seasonal Period */}
                <div className="space-y-2">
                  <Label>Seasonal Period: {parameters.period}</Label>
                  <Slider
                    value={[parameters.period]}
                    onValueChange={([value]) => setParameters(prev => ({ ...prev, period: value }))}
                    max={52}
                    min={4}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">{getPeriodDescription()}</p>
                </div>

                {/* Time Range */}
                <div className="space-y-2">
                  <Label>Time Range</Label>
                  <Select
                    value={parameters.timeRange}
                    onValueChange={(value: 'last_year' | 'last_2_years' | 'all_data') => 
                      setParameters(prev => ({ ...prev, timeRange: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last_year">Last 12 Months</SelectItem>
                      <SelectItem value="last_2_years">Last 2 Years</SelectItem>
                      <SelectItem value="all_data">All Available Data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Focus Area */}
                <div className="space-y-2">
                  <Label>Focus Area</Label>
                  <Select
                    value={parameters.focusArea}
                    onValueChange={(value: 'trends' | 'seasonal' | 'forecasting') => 
                      setParameters(prev => ({ ...prev, focusArea: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seasonal">Seasonal Patterns</SelectItem>
                      <SelectItem value="trends">Long-term Trends</SelectItem>
                      <SelectItem value="forecasting">Future Forecasting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleStartAnalysis}
                  disabled={isAnalyzing}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {isAnalyzing ? 'Starting Analysis...' : 'Start Seasonality Analysis'}
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
