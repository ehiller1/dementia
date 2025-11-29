/**
 * Agent Validator
 * 
 * Provides validation and testing mechanisms for dynamically created agents.
 * Ensures that generated agent code meets quality and security standards
 * before being deployed to production.
 */

import { CodeSandbox, SandboxExecutionResult } from './codeSandbox.ts';
import { nanoid } from 'nanoid';

// Types for agent validation
export interface AgentValidationOptions {
  testCases?: AgentTestCase[];
  securityChecks?: boolean;
  performanceThresholds?: {
    maxExecutionTimeMs?: number;
    maxMemoryUsageMb?: number;
  };
  validationTimeout?: number;
}

export interface AgentTestCase {
  name: string;
  input: Record<string, any>;
  expectedOutputType?: string;
  expectedOutputPattern?: RegExp | string;
  validator?: (result: any) => { valid: boolean; reason?: string };
}

export interface AgentValidationResult {
  valid: boolean;
  testResults: TestResult[];
  securityIssues: SecurityIssue[];
  performanceMetrics: {
    averageExecutionTimeMs: number;
    maxExecutionTimeMs: number;
    averageMemoryUsageMb?: number;
  };
}

export interface TestResult {
  testCase: AgentTestCase;
  passed: boolean;
  executionResult: SandboxExecutionResult;
  failureReason?: string;
}

export interface SecurityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;
  recommendation?: string;
}

/**
 * Agent Validator class for testing and validating dynamically created agents
 */
export class AgentValidator {
  private sandbox: CodeSandbox;
  
  constructor() {
    this.sandbox = new CodeSandbox();
  }
  
  /**
   * Validate agent code against test cases and security checks
   */
  async validateAgent(
    agentCode: string,
    options: AgentValidationOptions = {}
  ): Promise<AgentValidationResult> {
    const testResults: TestResult[] = [];
    const securityIssues: SecurityIssue[] = [];
    const executionTimes: number[] = [];
    const memoryUsages: number[] = [];
    
    // Default test case if none provided
    const testCases = options.testCases || [
      {
        name: 'Basic functionality test',
        input: { query: 'Test query' },
        expectedOutputType: 'object'
      }
    ];
    
    // Run security checks if enabled
    if (options.securityChecks !== false) {
      const securityCheckResults = await this.runSecurityChecks(agentCode);
      securityIssues.push(...securityCheckResults);
    }
    
    // Run test cases
    for (const testCase of testCases) {
      const testResult = await this.runTestCase(agentCode, testCase);
      testResults.push(testResult);
      
      if (testResult.executionResult.executionTime) {
        executionTimes.push(testResult.executionResult.executionTime);
      }
      
      if (testResult.executionResult.memoryUsed) {
        memoryUsages.push(testResult.executionResult.memoryUsed);
      }
    }
    
    // Calculate performance metrics
    const averageExecutionTimeMs = executionTimes.length > 0
      ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length
      : 0;
    
    const maxExecutionTimeMs = executionTimes.length > 0
      ? Math.max(...executionTimes)
      : 0;
    
    const averageMemoryUsageMb = memoryUsages.length > 0
      ? memoryUsages.reduce((sum, mem) => sum + mem, 0) / memoryUsages.length
      : undefined;
    
    // Check if agent passed all tests and has no critical security issues
    const valid = testResults.every(result => result.passed) &&
      !securityIssues.some(issue => issue.severity === 'critical');
    
    return {
      valid,
      testResults,
      securityIssues,
      performanceMetrics: {
        averageExecutionTimeMs,
        maxExecutionTimeMs,
        averageMemoryUsageMb
      }
    };
  }
  
  /**
   * Run a single test case against the agent code
   */
  private async runTestCase(
    agentCode: string,
    testCase: AgentTestCase
  ): Promise<TestResult> {
    // Wrap the agent code in a function that accepts the test input
    const wrappedCode = `
      async function runAgentTest(input) {
        // Agent code
        ${agentCode}
        
        // Assume the agent code defines a 'processRequest' function
        // If not, this will fail appropriately
        return typeof processRequest === 'function' 
          ? await processRequest(input)
          : { error: 'Agent code does not define a processRequest function' };
      }
      
      // Execute the test
      return await runAgentTest(${JSON.stringify(testCase.input)});
    `;
    
    // Execute the wrapped code in the sandbox
    const executionResult = await this.sandbox.executeCode(wrappedCode, {
      timeoutMs: 10000, // 10 seconds
      context: { testCase: testCase.name }
    });
    
    // Determine if the test passed
    let passed = executionResult.success;
    let failureReason: string | undefined;
    
    if (passed && executionResult.result) {
      // Check expected output type
      if (testCase.expectedOutputType) {
        const actualType = typeof executionResult.result;
        if (actualType !== testCase.expectedOutputType) {
          passed = false;
          failureReason = `Expected output type ${testCase.expectedOutputType}, but got ${actualType}`;
        }
      }
      
      // Check expected output pattern
      if (passed && testCase.expectedOutputPattern) {
        const resultStr = JSON.stringify(executionResult.result);
        const pattern = testCase.expectedOutputPattern instanceof RegExp
          ? testCase.expectedOutputPattern
          : new RegExp(testCase.expectedOutputPattern);
          
        if (!pattern.test(resultStr)) {
          passed = false;
          failureReason = `Output does not match expected pattern: ${pattern}`;
        }
      }
      
      // Use custom validator if provided
      if (passed && testCase.validator) {
        const validationResult = testCase.validator(executionResult.result);
        if (!validationResult.valid) {
          passed = false;
          failureReason = validationResult.reason || 'Failed custom validation';
        }
      }
    } else if (!executionResult.success) {
      failureReason = executionResult.error || 'Unknown execution error';
    }
    
    return {
      testCase,
      passed,
      executionResult,
      failureReason
    };
  }
  
  /**
   * Run security checks on the agent code
   */
  private async runSecurityChecks(agentCode: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    
    // Check for potentially dangerous patterns
    const dangerousPatterns = [
      {
        pattern: /eval\s*\(/g,
        severity: 'critical' as const,
        description: 'Use of eval() is prohibited',
        recommendation: 'Avoid using eval() as it can execute arbitrary code'
      },
      {
        pattern: /new\s+Function\s*\(/g,
        severity: 'critical' as const,
        description: 'Dynamic function creation is prohibited',
        recommendation: 'Avoid creating functions dynamically'
      },
      {
        pattern: /document\./g,
        severity: 'high' as const,
        description: 'Direct DOM manipulation detected',
        recommendation: 'Agents should not directly manipulate the DOM'
      },
      {
        pattern: /localStorage|sessionStorage/g,
        severity: 'medium' as const,
        description: 'Browser storage access detected',
        recommendation: 'Use provided state management instead of browser storage'
      },
      {
        pattern: /setTimeout|setInterval/g,
        severity: 'medium' as const,
        description: 'Timer functions detected',
        recommendation: 'Avoid using timers in agent code'
      },
      {
        pattern: /while\s*\(\s*true\s*\)/g,
        severity: 'high' as const,
        description: 'Infinite loop detected',
        recommendation: 'Avoid infinite loops that could freeze execution'
      }
    ];
    
    // Check for each dangerous pattern
    for (const { pattern, severity, description, recommendation } of dangerousPatterns) {
      const matches = agentCode.match(pattern);
      if (matches) {
        issues.push({
          severity,
          description,
          recommendation,
          location: `Multiple locations (${matches.length} occurrences)`
        });
      }
    }
    
    // Check for excessive code length
    if (agentCode.length > 10000) {
      issues.push({
        severity: 'medium',
        description: 'Agent code is excessively long',
        recommendation: 'Consider refactoring the agent code to be more concise'
      });
    }
    
    // Check for network requests
    if (/fetch\s*\(|XMLHttpRequest|axios/g.test(agentCode)) {
      issues.push({
        severity: 'medium',
        description: 'Network requests detected',
        recommendation: 'Use provided API access methods instead of direct network requests'
      });
    }
    
    return issues;
  }
  
  /**
   * Clean up resources
   */
  cleanup(): void {
    this.sandbox.terminateAll();
  }
}

// Export singleton instance
export const agentValidator = new AgentValidator();
