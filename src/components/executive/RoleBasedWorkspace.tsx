/**
 * Role-Based Workspace - Executive Observation Framework
 * 
 * Dynamically switches UI layout based on detected executive role
 */

import React, { useEffect, useState } from 'react';
import { OperatorDashboard } from './OperatorDashboard';
import { BuilderDashboard } from './BuilderDashboard';
import { StrategistDashboard } from './StrategistDashboard';
import { ExecutiveDashboard } from './ExecutiveDashboard';
import { ModeSwitcher } from './ModeSwitcher';
import { AlertCircle } from 'lucide-react';
import { eventBus } from '@/services/events/EventBus';

export type ExecutiveRole = 'Operator' | 'Builder' | 'Strategist' | 'Executive';

export interface RoleBasedWorkspaceProps {
  children?: React.ReactNode;
  allowManualOverride?: boolean;
  showModeIndicator?: boolean;
}

export function RoleBasedWorkspace({
  children,
  allowManualOverride = true,
  showModeIndicator = true
}: RoleBasedWorkspaceProps) {
  console.log('🎭 [RoleBasedWorkspace] Component rendering');
  console.log('🎭 [RoleBasedWorkspace] Children:', children);
  console.log('🎭 [RoleBasedWorkspace] Props:', { allowManualOverride, showModeIndicator });
  
  // Use eventBus directly from continuous orchestration
  // (fallback if OrchestrationContext not available)
  const [currentRole, setCurrentRole] = useState<ExecutiveRole>('Executive');
  const [roleConfidence, setRoleConfidence] = useState<number>(0.85);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [manualOverride, setManualOverride] = useState<ExecutiveRole | null>(null);
  
  console.log('🎭 [RoleBasedWorkspace] Current role:', currentRole);

  useEffect(() => {
    // Subscribe to role change events
    const subscription = eventBus.subscribe('role.changed', (event) => {
      console.log(`🎭 [RoleBasedWorkspace] Role change detected: ${event.previousRole} → ${event.newRole}`);
      
      // Only apply if no manual override
      if (!manualOverride) {
        setIsTransitioning(true);
        
        // Smooth transition animation
        setTimeout(() => {
          setCurrentRole(event.newRole);
          setRoleConfidence(event.confidence);
          setIsTransitioning(false);
        }, 200);
      }
    });

    return () => subscription.unsubscribe();
  }, [manualOverride]);

  const handleManualRoleChange = (role: ExecutiveRole) => {
    console.log(`🎭 [RoleBasedWorkspace] Manual role override: ${role}`);
    setManualOverride(role);
    setCurrentRole(role);
    setRoleConfidence(1.0); // Full confidence for manual selection
    
    // Publish manual override event
    eventBus.publish('role.manual_override', {
      role,
      timestamp: new Date().toISOString()
    });
  };

  const clearManualOverride = () => {
    console.log('🎭 [RoleBasedWorkspace] Clearing manual override');
    setManualOverride(null);
    // System will auto-detect role on next evaluation
  };

  const renderDashboard = () => {
    switch (currentRole) {
      case 'Operator':
        return <OperatorDashboard />;
      case 'Builder':
        return <BuilderDashboard />;
      case 'Strategist':
        return <StrategistDashboard />;
      case 'Executive':
        return <ExecutiveDashboard />;
      default:
        return <ExecutiveDashboard />;
    }
  };

  const getRoleDescription = () => {
    switch (currentRole) {
      case 'Operator':
        return 'Immediate tactical actions and operational execution';
      case 'Builder':
        return 'System design, process improvement, and architecture';
      case 'Strategist':
        return 'Long-term planning and cross-functional coordination';
      case 'Executive':
        return 'Strategic synthesis, oversight, and high-level decisions';
      default:
        return 'Executive mode';
    }
  };

  const getRoleColor = () => {
    switch (currentRole) {
      case 'Operator':
        return 'bg-red-500';
      case 'Builder':
        return 'bg-blue-500';
      case 'Strategist':
        return 'bg-purple-500';
      case 'Executive':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={`role-based-workspace h-full ${isTransitioning ? 'opacity-50 transition-opacity duration-200' : ''}`}>
      {/* Just render children - the dashboard rendering is disabled for now */}
      {/* The role-based workspace will be activated when needed */}
      {children}
    </div>
  );
}
