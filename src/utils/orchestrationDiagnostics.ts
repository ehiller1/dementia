/**
 * Orchestration Diagnostics Utility
 * Run this in browser console to check system health
 */

import { supabase } from '@/integrations/supabase/client';

export interface DiagnosticResult {
  component: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details?: any;
}

export class OrchestrationDiagnostics {
  
  /**
   * Run full system diagnostics
   */
  static async runFullDiagnostics(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    console.log('🔍 Running orchestration diagnostics...\n');

    // 1. Check business signals
    results.push(await this.checkBusinessSignals());

    // 2. Check orchestration states
    results.push(await this.checkOrchestrationStates());

    // 3. Check executable actions
    results.push(await this.checkExecutableActions());

    // 4. Check recent activity
    results.push(await this.checkRecentActivity());

    // Print results
    this.printResults(results);

    return results;
  }

  /**
   * Check business signals table
   */
  private static async checkBusinessSignals(): Promise<DiagnosticResult> {
    try {
      const { data, error } = await supabase
        .from('business_signals')
        .select('*')
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
        .order('created_at', { ascending: false });

      if (error) {
        return {
          component: 'Business Signals',
          status: 'error',
          message: `Database error: ${error.message}`,
          details: error
        };
      }

      const count = data?.length || 0;
      const recentCount = data?.filter(s => 
        new Date(s.created_at).getTime() > Date.now() - 60000
      ).length || 0;

      if (count === 0) {
        return {
          component: 'Business Signals',
          status: 'warning',
          message: 'No signals in last 5 minutes - EventToSignalBridge may not be creating signals',
          details: { total: 0, lastMinute: 0 }
        };
      }

      return {
        component: 'Business Signals',
        status: 'healthy',
        message: `${count} signals in last 5 min (${recentCount} in last minute)`,
        details: { 
          total: count, 
          lastMinute: recentCount,
          recentSignals: data?.slice(0, 3).map(s => ({
            type: s.signal_type,
            source: s.source_system,
            severity: s.severity,
            created: new Date(s.created_at).toLocaleTimeString()
          }))
        }
      };
    } catch (error) {
      return {
        component: 'Business Signals',
        status: 'error',
        message: `Exception: ${(error as Error).message}`
      };
    }
  }

  /**
   * Check orchestration states
   */
  private static async checkOrchestrationStates(): Promise<DiagnosticResult> {
    try {
      const { data, error } = await supabase
        .from('orchestration_states')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Last 10 minutes
        .order('timestamp', { ascending: false });

      if (error) {
        return {
          component: 'Orchestration States',
          status: 'error',
          message: `Database error: ${error.message}`,
          details: error
        };
      }

      const count = data?.length || 0;

      if (count === 0) {
        return {
          component: 'Orchestration States',
          status: 'warning',
          message: 'No orchestration ticks in last 10 minutes - Loop may not be running or no signals to process',
          details: { total: 0 }
        };
      }

      const lastState = data?.[0];
      const timeSinceLastTick = lastState 
        ? Math.floor((Date.now() - new Date(lastState.timestamp).getTime()) / 1000)
        : null;

      return {
        component: 'Orchestration States',
        status: timeSinceLastTick && timeSinceLastTick < 120 ? 'healthy' : 'warning',
        message: `${count} ticks in last 10 min. Last tick ${timeSinceLastTick}s ago`,
        details: {
          total: count,
          lastTickSecondsAgo: timeSinceLastTick,
          lastTickConfidence: lastState?.confidence,
          lastTickStatus: lastState?.status
        }
      };
    } catch (error) {
      return {
        component: 'Orchestration States',
        status: 'error',
        message: `Exception: ${(error as Error).message}`
      };
    }
  }

  /**
   * Check executable actions
   */
  private static async checkExecutableActions(): Promise<DiagnosticResult> {
    try {
      const { data, error } = await supabase
        .from('executable_actions')
        .select('*')
        .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        return {
          component: 'Executable Actions',
          status: 'error',
          message: `Database error: ${error.message}`,
          details: error
        };
      }

      const count = data?.length || 0;
      const statusBreakdown = data?.reduce((acc, action) => {
        acc[action.status] = (acc[action.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        component: 'Executable Actions',
        status: count > 0 ? 'healthy' : 'warning',
        message: count > 0 
          ? `${count} actions in last 10 min`
          : 'No actions generated - orchestration may not be creating actionable items',
        details: {
          total: count,
          byStatus: statusBreakdown
        }
      };
    } catch (error) {
      return {
        component: 'Executable Actions',
        status: 'error',
        message: `Exception: ${(error as Error).message}`
      };
    }
  }

  /**
   * Check for recent system activity
   */
  private static async checkRecentActivity(): Promise<DiagnosticResult> {
    try {
      // Check console logs (if available)
      const hasOrchestrationLogs = typeof window !== 'undefined' && 
        (window as any).__orchestration_logs?.length > 0;

      return {
        component: 'Recent Activity',
        status: hasOrchestrationLogs ? 'healthy' : 'warning',
        message: hasOrchestrationLogs 
          ? 'Console logs detected - system is active'
          : 'No console logs tracked - check browser console manually',
        details: {
          suggestion: 'Look for logs starting with: 🔄, 📊, 🌉, 📡'
        }
      };
    } catch (error) {
      return {
        component: 'Recent Activity',
        status: 'warning',
        message: 'Unable to check console logs'
      };
    }
  }

  /**
   * Print diagnostic results to console
   */
  private static printResults(results: DiagnosticResult[]): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 ORCHESTRATION DIAGNOSTICS REPORT');
    console.log('='.repeat(60) + '\n');

    results.forEach(result => {
      const icon = result.status === 'healthy' ? '✅' : 
                   result.status === 'warning' ? '⚠️' : '❌';
      
      console.log(`${icon} ${result.component}`);
      console.log(`   ${result.message}`);
      
      if (result.details) {
        console.log('   Details:', result.details);
      }
      console.log('');
    });

    const healthyCount = results.filter(r => r.status === 'healthy').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    console.log('='.repeat(60));
    console.log(`Summary: ${healthyCount} healthy, ${warningCount} warnings, ${errorCount} errors`);
    console.log('='.repeat(60) + '\n');

    if (errorCount === 0 && warningCount === 0) {
      console.log('🎉 All systems operational!');
    } else if (errorCount > 0) {
      console.log('🚨 Critical issues detected - check errors above');
    } else {
      console.log('⚠️ System running with warnings - may need attention');
    }
  }

  /**
   * Quick health check (returns boolean)
   */
  static async quickHealthCheck(): Promise<boolean> {
    const results = await this.runFullDiagnostics();
    return results.every(r => r.status === 'healthy');
  }

  /**
   * Generate test signal for diagnostics
   */
  static async generateTestSignal(): Promise<void> {
    try {
      const testSignal = {
        signal_id: `test_diagnostic_${Date.now()}`,
        signal_type: 'scheduled_check',
        source_system: 'diagnostic_test',
        severity: 'low',
        signal_data: {
          test: true,
          purpose: 'System diagnostic test',
          timestamp: new Date().toISOString()
        },
        confidence_score: 1.0,
        tenant_id: 'default_tenant',
        metadata: {
          generated_by: 'orchestration_diagnostics',
          test_signal: true
        },
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('business_signals')
        .insert(testSignal);

      if (error) {
        console.error('❌ Failed to create test signal:', error);
      } else {
        console.log('✅ Test signal created successfully');
        console.log('   Signal ID:', testSignal.signal_id);
        console.log('   ⏱️ Wait 60 seconds for orchestration loop to process it');
      }
    } catch (error) {
      console.error('❌ Exception creating test signal:', error);
    }
  }
}

// Export convenience function for console use
export const runDiagnostics = () => OrchestrationDiagnostics.runFullDiagnostics();
export const generateTestSignal = () => OrchestrationDiagnostics.generateTestSignal();

// Make available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).orchestrationDiagnostics = {
    run: runDiagnostics,
    testSignal: generateTestSignal,
    quickCheck: () => OrchestrationDiagnostics.quickHealthCheck()
  };
  
  console.log('🔧 Diagnostics available: window.orchestrationDiagnostics.run()');
}
