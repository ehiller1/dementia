# Monte Carlo Simulation Integration

This module integrates Monte Carlo simulation processing and action execution into the Quest Agent Forge architecture.

## Architecture Overview

The Monte Carlo simulation integration follows the core business flow:

1. **Intent Router** → 2. **Template Engine** → 3. **Agent Delegation**

With the Template Engine serving as the **central orchestrator** for the entire workflow:

```
User Input → Intent Router → Template Engine (retrieves memory context) → 
Dynamic Template Generation → Agent Delegation → Memory Updates → 
Template State Persistence → Next Interaction Cycle
```

## Key Components

### 1. SimulationAdapter
- Parses raw Monte Carlo simulation JSON data
- Extracts scenarios, recommended actions, and aggregate metrics
- Integrates with memory and embedding services
- Stores simulation results in database with vector embeddings

### 2. SimulationActionProcessor
- Extracts and classifies recommended actions from simulation results
- Generates action plans as templates with executable functions
- Integrates with agent discovery for selecting appropriate execution agents
- Supports human approval workflows and automated execution

### 3. SimulationAgentDiscoveryService
- Extends base agent discovery with simulation-specific capability matching
- Scores agents based on capability match, historical performance, and semantic similarity
- Selects appropriate agents to execute simulation-derived actions
- Provides fallback logic for when specialized agents are not available

### 4. SimulationTemplateEngine
- Central orchestration component (extends DynamicTemplateEngine)
- Processes simulation data and updates templates with results
- Generates action plans with executable functions
- Delegates action execution to appropriate agents
- Stores template state and execution results in memory

### 5. SimulationIntentHandler
- Handles simulation-related intents (process_simulation, execute_simulation_action)
- Routes requests to appropriate template engine methods
- Manages conversation context and intent routing
- Integrates with memory for context retrieval and storage

### 6. SimulationAPIService
- Provides REST API endpoints for simulation processing and action execution
- Supports template generation and result retrieval
- Updates action status and manages approval workflows
- Integrates with frontend components

### 7. SimulationAgent
- **Generic simulation agent** that executes simulation-derived actions
- Supports different action types (marketing, inventory, general)
- Stores execution results in memory (working, short-term, long-term)
- Updates action status in database and provides execution insights
- Serves as an architectural example for future specialized agents

## Memory Integration

Memory integration is **bidirectional**:
- Template Engine retrieves context from memory to inform template generation
- Execution results are stored in working, short-term, and long-term memory
- Action status updates are persisted in the database
- Template state is maintained in working memory for workflow continuity

## Agent Discovery and Execution

The agent discovery process follows a capability-based matching approach:
- **Capability Match**: Percentage overlap between required and available capabilities
- **Context Score**: Function type, complexity, and specialization alignment
- **Performance History**: Historical execution success rates and quality metrics
- **Confidence Threshold**: Minimum match required for agent selection

## Running the Demo

To demonstrate the end-to-end integration:

```bash
# Run the simulation demo script
npm run simulation-demo
```

This will:
1. Process sample Monte Carlo simulation data
2. Extract and classify recommended actions
3. Generate action plans as templates
4. Discover and execute actions using the SimulationAgent
5. Store results in memory and update database

## Integration Points

### Template Engine Integration
- Templates define functions requiring agent execution
- Agent discovery triggered automatically during template execution
- Function delegation routes to appropriate specialized agents
- Results aggregated for comprehensive business intelligence

### Conversation System Integration
- User input → Intent classification → Template selection → Agent discovery
- Real-time agent coordination feedback through conversation interface
- Memory integration enriches agent selection with historical context
- Workflow continuity maintained across conversation turns

## Production-Ready Features

### Capability Taxonomy
- **Marketing**: `campaign_analysis`, `market_research`, `demand_forecasting`
- **Operations**: `inventory_optimization`, `supply_chain_management`, `stock_analysis`
- **Analytics**: `data_analysis`, `trend_identification`, `report_generation`
- **Coordination**: `workflow_orchestration`, `stakeholder_alignment`

### Architecture Benefits
- **Reduced Configuration**: Zero manual agent assignment
- **Improved Accuracy**: Best-match agents produce higher quality results
- **Enhanced Coordination**: Multi-agent workflows deliver comprehensive insights
- **Scalable Architecture**: New agents integrate seamlessly
