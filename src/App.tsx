import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConversationProvider } from "@/contexts/ConversationContext";
import { EnhancedUnifiedConversationProvider } from "@/contexts/EnhancedUnifiedConversationProvider";
import { LoggingProvider } from './contexts/LoggingContext';
import { AppHeader } from './components/AppHeader';
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import SignalsDashboard from "./pages/SignalsDashboard";
import DecisionStack from "./pages/DecisionStack";
import SimulationSources from "./pages/SimulationSources";
import RMNCommandConsole from "./pages/RMNCommandConsole";
import AdminLayout from "./pages/admin/AdminLayout";
import SystemConfig from "./pages/admin/SystemConfig";
import AgentMarketplace from "./pages/admin/AgentMarketplace";
import AgentRegistry from "./pages/admin/AgentRegistry";
import AgentFlowVisualization from "./pages/admin/AgentFlowVisualization";
import MemoryInspector from "./pages/admin/MemoryInspector";
import EventMonitor from "./pages/admin/EventMonitor";
import OrchestrationState from "./pages/admin/OrchestrationState";
import IntelligenceMetrics from "./pages/admin/IntelligenceMetrics";
import StackBuilder from "./pages/admin/StackBuilder";
import { DecisionStackManager } from "@/components/admin/DecisionStackManager";
import { initializeReactiveTemplates } from "@/services/continuous-orchestration/ReactiveTemplateUpdater";
import { RoleBasedWorkspace } from "@/components/executive/RoleBasedWorkspace";
import RepWorkspaceDemo from "./pages/rep-workspace-demo";
import MarketingSpendDemo from "./pages/admin/MarketingSpendDemo";
import PlanningDemo from "./pages/admin/PlanningDemo";
import FacilitiesDemo from "./pages/admin/FacilitiesDemo";
// Disabled: TaskRouter imports server-only code
// import '@/services/task-router/TaskRouter'; // Initialize TaskRouter
import "./App.css";
import { SupabaseAuthProvider } from "./contexts/SupabaseAuthContext";

const queryClient = new QueryClient();

const App = () => {
  // Initialize reactive template system on app startup
  useEffect(() => {
    console.log('🚀 [App] Initializing reactive template system...');
    console.log('🚀 [App] Component tree rendering...');
    initializeReactiveTemplates();
    
    // Backend health check removed for frontend-only mode
  }, []);

  console.log('🎨 [App] Rendering App component');

  return (
    <QueryClientProvider client={queryClient}>
      <LoggingProvider>
        <SupabaseAuthProvider>
          <ConversationProvider>
            <EnhancedUnifiedConversationProvider>
              <TooltipProvider>
            <Toaster />
            <Sonner />
            <RoleBasedWorkspace allowManualOverride={true} showModeIndicator={true}>
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AppHeader />
                <div className="pt-16"> {/* Add padding for fixed header */}
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/home" element={<Home />} />
                    {/* <Route path="/workspace" element={<Index />} /> */}
                    <Route path="/rmn-command" element={<RMNCommandConsole />} />
                    {/* Deprecated: RMN Workspace - redirect to Home */}
                    <Route path="/rmn-workspace" element={<Home />} />
                    <Route path="/signals" element={<SignalsDashboard />} />
                    <Route path="/decision-stack" element={<DecisionStack />} />
                    <Route path="/simulation-sources" element={<SimulationSources />} />
                    <Route path="/call-center-coaching" element={<RepWorkspaceDemo />} />
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route path="system-config" element={<SystemConfig />} />
                      <Route path="agent-marketplace" element={<AgentMarketplace />} />
                      <Route path="agent-registry" element={<AgentRegistry />} />
                      <Route path="agent-flow" element={<AgentFlowVisualization />} />
                      <Route path="memory-inspector" element={<MemoryInspector />} />
                      <Route path="event-monitor" element={<EventMonitor />} />
                      <Route path="orchestration-state" element={<OrchestrationState />} />
                      <Route path="intelligence-metrics" element={<IntelligenceMetrics />} />
                      <Route path="stack-builder" element={<StackBuilder />} />
                      <Route path="decision-stacks" element={<DecisionStackManager />} />
                      <Route path="demo/call-center" element={<RepWorkspaceDemo />} />
                      <Route path="demo/marketing-spend" element={<MarketingSpendDemo />} />
                      <Route path="demo/planning" element={<PlanningDemo />} />
                      <Route path="demo/facilities" element={<FacilitiesDemo />} />
                    </Route>
                  </Routes>
                </div>
              </BrowserRouter>
            </RoleBasedWorkspace>
              </TooltipProvider>
            </EnhancedUnifiedConversationProvider>
          </ConversationProvider>
        </SupabaseAuthProvider>
      </LoggingProvider>
    </QueryClientProvider>
  );
};

export default App;
