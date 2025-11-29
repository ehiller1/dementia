
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SeasonalityAgent } from '@/components/SeasonalityAgent';
import { DataUploader } from '@/components/DataUploader';
import { RAGTestingInterface } from '@/components/RAGTestingInterface';
import { TrendingUp, BarChart3, PieChart, LineChart, Database, TestTube } from 'lucide-react';

export const AgentSpecialties = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Agent Specialties</CardTitle>
          <CardDescription>
            Specialized AI agents with advanced analytical capabilities
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="seasonality" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data
          </TabsTrigger>
          <TabsTrigger value="seasonality" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Seasonality
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Testing
          </TabsTrigger>
          <TabsTrigger value="forecasting" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Forecasting
          </TabsTrigger>
          <TabsTrigger value="clustering" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Clustering
          </TabsTrigger>
          <TabsTrigger value="anomaly" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Anomaly Detection
          </TabsTrigger>
        </TabsList>

        <TabsContent value="data">
          <DataUploader />
        </TabsContent>

        <TabsContent value="seasonality">
          <SeasonalityAgent />
        </TabsContent>

        <TabsContent value="testing">
          <RAGTestingInterface />
        </TabsContent>

        <TabsContent value="forecasting">
          <Card>
            <CardHeader>
              <CardTitle>Forecasting Agent</CardTitle>
              <CardDescription>Coming soon - Advanced time series forecasting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Forecasting agent implementation in progress...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clustering">
          <Card>
            <CardHeader>
              <CardTitle>Clustering Agent</CardTitle>
              <CardDescription>Coming soon - Customer and data segmentation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Clustering agent implementation in progress...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomaly">
          <Card>
            <CardHeader>
              <CardTitle>Anomaly Detection Agent</CardTitle>
              <CardDescription>Coming soon - Automated anomaly detection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Anomaly detection agent implementation in progress...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
