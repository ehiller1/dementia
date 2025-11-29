/**
 * Agent Negotiation Utilities
 * 
 * This module contains utility functions for agent negotiation and bidding processes.
 * Extracted from server-real.mjs for better code organization and reusability.
 */

/**
 * Process multi-round agent negotiation with convergence detection
 * 
 * @param {Array} selectedAgents - Array of agents with id and initialBid
 * @param {Object} negotiationCriteria - Negotiation parameters
 * @param {number} negotiationCriteria.maxRounds - Maximum negotiation rounds (default: 3)
 * @param {number} negotiationCriteria.convergenceThreshold - Bid spread threshold for convergence (default: 0.05)
 * @returns {Object} Negotiation result with winner selection and bid history
 */
export function processNegotiation(selectedAgents, negotiationCriteria) {
  const maxRounds = negotiationCriteria?.maxRounds || 3;
  const convergenceThreshold = negotiationCriteria?.convergenceThreshold || 0.05;
  
  // Simulate negotiation rounds
  const negotiationRounds = [];
  let currentBids = selectedAgents.map(agent => ({
    ...agent,
    currentBid: agent.initialBid,
    adjustments: []
  }));

  for (let round = 1; round <= maxRounds; round++) {
    console.log(`🔄 Negotiation Round ${round}`);
    
    const roundResults = currentBids.map(agent => {
      // Simulate bid adjustment based on competition
      const adjustment = (Math.random() - 0.5) * 0.1; // Random adjustment ±5%
      const newBid = Math.max(0.1, Math.min(1.0, agent.currentBid + adjustment));
      
      agent.currentBid = newBid;
      
      return {
        agentId: agent.id,
        round: round,
        bid: newBid,
        adjustment: newBid - agent.initialBid
      };
    });

    const bidSpread = Math.max(...roundResults.map(r => r.bid)) - Math.min(...roundResults.map(r => r.bid));
    negotiationRounds.push({
      round: round,
      results: roundResults,
      bidSpread: bidSpread
    });

    // Check for convergence
    if (bidSpread <= convergenceThreshold) {
      console.log(`✅ Convergence achieved in round ${round} (spread: ${bidSpread.toFixed(4)})`);
      break;
    }
  }

  // Determine final selection
  const finalBids = currentBids.sort((a, b) => b.currentBid - a.currentBid);
  const winner = finalBids[0];
  
  console.log(`🏆 Negotiation completed - Winner: ${winner.id} (${winner.currentBid.toFixed(3)})`);

  return {
    success: true,
    negotiationId: `neg_${Date.now()}`,
    rounds: negotiationRounds.length,
    convergenceAchieved: negotiationRounds.length > 0 ? 
      negotiationRounds[negotiationRounds.length - 1].bidSpread <= convergenceThreshold : false,
    selectedAgent: {
      id: winner.id,
      finalBid: Number(winner.currentBid.toFixed(4)),
      initialBid: Number(winner.initialBid.toFixed(4)),
      bidImprovement: Number((winner.currentBid - winner.initialBid).toFixed(4)),
      selectionReason: 'Highest final bid after negotiation rounds'
    },
    allFinalBids: finalBids.map(agent => ({
      id: agent.id,
      initialBid: Number(agent.initialBid.toFixed(4)),
      finalBid: Number(agent.currentBid.toFixed(4)),
      totalAdjustment: Number((agent.currentBid - agent.initialBid).toFixed(4))
    })),
    criteria: {
      maxRounds: maxRounds,
      convergenceThreshold: convergenceThreshold,
      actualRounds: negotiationRounds.length
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Calculate bid adjustment based on competitive pressure
 * 
 * @param {number} currentBid - Current agent bid
 * @param {number} averageBid - Average bid across all agents
 * @param {number} maxAdjustment - Maximum adjustment percentage (default: 0.1)
 * @returns {number} Adjusted bid value
 */
export function calculateBidAdjustment(currentBid, averageBid, maxAdjustment = 0.1) {
  const competitivePressure = averageBid > currentBid ? 1 : -1;
  const adjustment = (Math.random() - 0.5) * maxAdjustment * competitivePressure;
  return Math.max(0.1, Math.min(1.0, currentBid + adjustment));
}

/**
 * Check if negotiation has converged based on bid spread
 * 
 * @param {Array} bids - Array of current bids
 * @param {number} threshold - Convergence threshold
 * @returns {boolean} True if converged
 */
export function checkConvergence(bids, threshold) {
  if (bids.length < 2) return true;
  const bidSpread = Math.max(...bids) - Math.min(...bids);
  return bidSpread <= threshold;
}
