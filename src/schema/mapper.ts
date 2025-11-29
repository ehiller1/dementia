/**
 * Stub for mapper
 * Backend services removed for frontend-only build
 */

export function mapWorkflowToCanonical(workflowData: any) {
  console.warn('[mapWorkflowToCanonical] Backend service disabled - frontend-only mode');
  return {
    roleDetection: "Executive",
    templateSnapline: "Business Analysis Template",
    executiveSummary: [],
    whatImSeeing: [],
    recommendation: [],
    nextActions: [],
    crossFunctionalImpact: {},
    agentMarketplaceResults: [],
    timeline: []
  };
}

