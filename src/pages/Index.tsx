import { useState, useEffect, useCallback } from "react";
import { AppHeader } from "@/components/AppHeader";
import { WindsurfConversationInterface } from "@/components/WindsurfConversationInterface";
import LiveNarrativeStream from "@/components/LiveNarrativeStream";
import DecisionInbox from "@/components/DecisionInbox";
import MemoryInspector from '@/components/memory/MemoryInspector';
import { OrchestrationProvider } from "@/services/context/OrchestrationContext";
import { eventBus } from "@/services/events/EventBus";
import { InMemoryWorkflowGraphService } from "@/services/graph/WorkflowGraphService";
import { OrchestrationController } from "@/services/conversation/OrchestrationController";
import { initializeOrchestration, stopOrchestration } from "@/services/continuous-orchestration/initializeOrchestration";
import { createEventToSignalBridge } from "@/services/EventToSignalBridge";
import { OrchestrationDiagnostics } from "@/utils/orchestrationDiagnostics";
import { Activity, Layers } from "lucide-react";

// LLM Models from intelligence router configuration
const LLM_MODELS = [
  { id: "demand-forecast", name: "Demand Forecast LLM", description: "Specialized in demand forecasting and inventory optimization" },
  { id: "company", name: "Company LLM", description: "General business intelligence and strategic planning" },
  { id: "marketing", name: "Marketing LLM", description: "Marketing campaigns, customer insights, and ROI analysis" },
];

const Index = () => {
  console.log('🏠 [Index] Component rendering');
  
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const conversationId = 'main_conversation';
  const tenantId = 'default_tenant';
  const userId = 'default_user';

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    if (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || 
        file.type === "application/vnd.ms-excel" ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls')) {
      setUploadedFile(file);
      setUploadStatus("success");
      console.log("📊 File uploaded:", file.name);
    } else {
      setUploadStatus("error");
      console.error("❌ Invalid file type. Please upload an Excel file.");
    }
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  console.log('🏠 [Index] Rendering JSX');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-100 to-gray-100">
      {/* Header with Model Selection and Excel Upload */}
      <AppHeader />

      {/* Three-Panel Card Layout */}
      <div className="pt-20">
        <OrchestrationProvider>
          <div className="dashboard-grid">
            {/* Left Panel - Story Building & Memory */}
            <div className="panel-card">
              <div className="panel-card-header">
                <h2 className="panel-card-title">
                  <Activity className="h-5 w-5" />
                  Story Building
                </h2>
                <span className="status-badge active">Live</span>
              </div>
              <div className="panel-card-content space-y-4">
                <LiveNarrativeStream />
                <div className="mt-4">
                  <MemoryInspector 
                    tenantId={tenantId}
                    userId={userId}
                    contextId={conversationId}
                  />
                </div>
              </div>
            </div>

            {/* Center Panel - Conversational Interface */}
            <div className="panel-card">
              <div className="panel-card-header">
                <h2 className="panel-card-title">
                  AMIGO
                </h2>
              </div>
              <div className="panel-card-content">
                <WindsurfConversationInterface conversationId={conversationId} />
              </div>
            </div>

            {/* Right Panel - Decision Inbox */}
            <div className="panel-card">
              <div className="panel-card-header">
                <h2 className="panel-card-title">
                  <Layers className="h-5 w-5" />
                  Decision Inbox
                </h2>
              </div>
              <div className="panel-card-content">
                <DecisionInbox 
                  onSimulate={(decisionId) => console.log('Simulate decision:', decisionId)}
                />
              </div>
            </div>
          </div>
        </OrchestrationProvider>
      </div>
    </div>
  );
};

export default Index;
