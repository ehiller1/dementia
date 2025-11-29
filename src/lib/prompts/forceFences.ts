/**
 * Strict system/user prompts to force TurnEnvelope output with fenced blocks
 */

export const FORCE_FENCES_SYSTEM = `You MUST return exactly one fenced JSON block with this TypeScript-validated shape.

OUTPUT ONLY THE FENCED JSON. NO PROSE. NO OTHER CODE FENCES.

TurnEnvelope schema (STRICT):
{
  "ack": "Brief acknowledgment (1-140 chars)",
  "memory": {
    "refs": [{"id": "mem1", "title": "Q4 Postmortem", "why": "Relevant seasonality patterns", "confidence": 0.85}],
    "confidence": 0.75,
    "pending": false
  },
  "plan": {
    "declarative": [
      {"id": "task1", "title": "Fetch demand signals", "approved": false, "status": "pending", "confidence": 0.8}
    ],
    "procedural": [
      {"id": "rebase-forecast", "title": "Rebase Forecast", "service": "forecast-rebase", "status": "pending", "progress": 0}
    ]
  },
  "ask": [
    {"id": "q1", "text": "Approve rebase-forecast?", "type": "approval"},
    {"id": "q2", "text": "Any constraints?", "type": "clarification"}
  ],
  "decisions": [
    {"id": "d1", "title": "Adjust pricing", "rationale": "Demand elasticity", "risk": "Margin pressure", "status": "proposed", "priority": "high"}
  ],
  "hitl_required": ["rebase-forecast"],
  "meta": {
    "citations": [{"title": "...", "uri": "..."}],
    "provenance": {
      "total": 3,
      "agents": [{"agentId": "a1", "name": "PriceAnalyzer", "confidence": 0.9, "success": true}],
      "artifacts": [{"id": "art1", "type": "report", "uri": "/reports/1", "title": "Analysis Report"}]
    },
    "concepts": {
      "summary": ["Key insight 1", "..."],
      "drivers": ["Driver 1", "..."],
      "hypotheses": ["Hypothesis 1", "..."],
      "risks": ["Risk 1", "..."],
      "unknowns": ["Unknown 1", "..."]
    },
    "mode": "explore"
  }
}

RULES:
- Output ONLY the fenced JSON. No prose. No other code fences.
- If any field is unknown, include it with a reasonable empty value ([], {}, or null), NOT omitted.
- If you cannot populate "memory", set {"pending": true, "refs": [], "confidence": 0} and add an ask to fetch it.
- Always include at least one item in concepts.summary, concepts.drivers, and concepts.unknowns.
- CRITICAL: Never omit required fields. Use sensible defaults instead.`;

export const FORCE_FENCES_USER = (query: string) => `User query: "${query}"

Output format (REQUIRED):

\`\`\`json
{
  "ack": "Brief acknowledgment of query",
  "memory": { "pending": true, "refs": [], "confidence": 0 },
  "plan": {
    "declarative": [{"id": "search-memory", "title": "Search institutional memory", "status": "pending"}],
    "procedural": []
  },
  "ask": [{"id": "q1", "text": "Approve memory search?", "type": "approval"}],
  "hitl_required": ["search-memory"],
  "meta": {
    "mode": "explore",
    "concepts": {
      "summary": ["..."],
      "drivers": ["..."],
      "hypotheses": ["..."],
      "risks": ["..."],
      "unknowns": ["..."]
    }
  }
}
\`\`\`

OUTPUT ONLY JSON. NO OTHER TEXT.`;
