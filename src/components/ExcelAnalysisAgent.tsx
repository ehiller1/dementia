import React, { useState } from 'react';
import { Button } from './ui/button.js';
import { Input } from './ui/input.js';
import { Card } from './ui/card.js';
import { Textarea } from './ui/textarea.js';
import { createExcelAnalystAgent, excelAnalysisTasks } from '../lib/agents/excel-analyst-agent.js';

/**
 * Excel Analysis Agent Component
 * 
 * A UI component that allows users to analyze Excel files using the CrewAI Excel Analyst agent.
 */
const ExcelAnalysisAgent: React.FC = () => {
  const [filePath, setFilePath] = useState('');
  const [analysisQuery, setAnalysisQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeExcel = async () => {
    if (!filePath) {
      setError('Please provide a valid file path');
      return;
    }

    if (!analysisQuery) {
      setError('Please provide an analysis query');
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setResult(null);

    try {
      // Create the Excel Analyst agent
      const agent = await createExcelAnalystAgent({
        name: 'Excel Data Analyst',
        verbose: true,
      });

      console.log('Excel Analyst agent created successfully');

      // Create the analysis task
      const analysisTask = excelAnalysisTasks.analyzeExcelFile(filePath, analysisQuery);
      
      console.log('Starting Excel analysis...');
      
      // Execute the task
      const analysisResult = await analysisTask.execute({ agent });
      
      console.log('Analysis complete');
      setResult(analysisResult);
    } catch (err) {
      console.error('Error during Excel analysis:', err);
      setError(`Analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQueryExcel = async () => {
    if (!filePath) {
      setError('Please provide a valid file path');
      return;
    }

    if (!analysisQuery) {
      setError('Please provide a query');
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setResult(null);

    try {
      // Create the Excel Analyst agent
      const agent = await createExcelAnalystAgent({
        name: 'Excel Data Querier',
        verbose: true,
      });

      // Create the query task
      const queryTask = excelAnalysisTasks.queryExcelData(filePath, analysisQuery);
      
      // Execute the task
      const queryResult = await queryTask.execute({ agent });
      
      setResult(queryResult);
    } catch (err) {
      setError(`Query failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Excel Analysis Agent</h2>
      <p className="text-gray-600 mb-6">
        Upload an Excel file and ask questions or request analysis using CrewAI and Langchain
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Excel File Path</label>
          <Input
            type="text"
            placeholder="/path/to/your/excelfile.xlsx"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the absolute path to your Excel file
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Analysis Query / Question</label>
          <Textarea
            placeholder="What are the sales trends in Q2? Compare performance across regions..."
            value={analysisQuery}
            onChange={(e) => setAnalysisQuery(e.target.value)}
            rows={3}
            className="resize-y"
          />
        </div>
      </div>

      <div className="flex space-x-3">
        <Button 
          onClick={handleAnalyzeExcel} 
          disabled={isAnalyzing || !filePath || !analysisQuery}
        >
          {isAnalyzing ? 'Analyzing...' : 'Run Complete Analysis'}
        </Button>
        <Button 
          onClick={handleQueryExcel}
          variant="outline" 
          disabled={isAnalyzing || !filePath || !analysisQuery}
        >
          Simple Query
        </Button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-md">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Analysis Results</h3>
          <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap text-sm">
            {result}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ExcelAnalysisAgent;
