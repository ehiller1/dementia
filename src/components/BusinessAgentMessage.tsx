/**
 * BusinessAgentMessage.tsx
 * 
 * Component for displaying business agent messages in the conversation UI.
 * Renders different message types with appropriate styling and content.
 */

import React from 'react';
import { Box, Typography, Paper, Chip, Divider, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { AgentMessage, Decision, SimulationResult } from '../hooks/useBusinessAgents.js';
import WarningIcon from '@mui/icons-material/Warning';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import RecommendIcon from '@mui/icons-material/Recommend';
import BarChartIcon from '@mui/icons-material/BarChart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';

// Styled components
const MessageContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(1),
  maxWidth: '90%',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
}));

const AgentChip = styled(Chip)(({ theme }) => ({
  marginRight: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const SimulationResultContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.spacing(1),
}));

const MetricItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(1),
}));

interface BusinessAgentMessageProps {
  message: AgentMessage;
  onSimulate?: (decisionId: string) => void;
  onApprove?: (decisionId: string) => void;
  onReject?: (decisionId: string) => void;
  decisions?: Decision[];
  simulations?: SimulationResult[];
}

/**
 * Get agent chip color based on agent type
 */
const getAgentColor = (agentType: string): string => {
  switch (agentType) {
    case 'marketing':
      return '#4caf50'; // green
    case 'inventory':
      return '#2196f3'; // blue
    case 'memory':
      return '#9c27b0'; // purple
    case 'coordination':
      return '#ff9800'; // orange
    default:
      return '#757575'; // grey
  }
};

/**
 * Get message icon based on message type
 */
const getMessageIcon = (messageType: string): React.ReactNode => {
  switch (messageType) {
    case 'alert':
      return <WarningIcon />;
    case 'insight':
      return <LightbulbIcon />;
    case 'recommendation':
      return <RecommendIcon />;
    case 'simulation':
      return <BarChartIcon />;
    case 'action':
      return <CheckCircleIcon />;
    default:
      return <InfoIcon />;
  }
};

/**
 * Format agent name based on agent type
 */
const formatAgentName = (agentType: string): string => {
  switch (agentType) {
    case 'marketing':
      return 'Marketing Specialist';
    case 'inventory':
      return 'Inventory Manager';
    case 'memory':
      return 'Institutional Memory';
    case 'coordination':
      return 'Coordination Agent';
    default:
      return 'System';
  }
};

/**
 * Business Agent Message Component
 */
export const BusinessAgentMessage: React.FC<BusinessAgentMessageProps> = ({
  message,
  onSimulate,
  onApprove,
  onReject,
  decisions,
  simulations
}) => {
  // Find related decision if this is a recommendation
  const relatedDecision = message.messageType === 'recommendation' && decisions
    ? decisions.find(d => d.data?.originalProduct === message.data?.originalProduct)
    : undefined;
  
  // Find related simulation if this is a simulation message
  const relatedSimulation = message.messageType === 'simulation' && simulations
    ? simulations.find(s => s.id === message.data?.id)
    : undefined;
  
  return (
    <MessageContainer
      sx={{
        borderLeft: `4px solid ${getAgentColor(message.agentType)}`,
        marginLeft: message.agentType === 'system' ? 'auto' : '0',
        marginRight: message.agentType === 'system' ? '0' : 'auto',
      }}
    >
      <Box display="flex" alignItems="center" mb={1}>
        <AgentChip
          icon={getMessageIcon(message.messageType)}
          label={formatAgentName(message.agentType)}
          sx={{ backgroundColor: getAgentColor(message.agentType), color: 'white' }}
        />
        <Typography variant="caption" color="textSecondary">
          {new Date(message.timestamp).toLocaleTimeString()}
        </Typography>
      </Box>
      
      <Typography variant="body1" gutterBottom>
        {message.content}
      </Typography>
      
      {/* Render recommendation actions if this is a recommendation message */}
      {message.messageType === 'recommendation' && relatedDecision && (
        <Box mt={2}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" gutterBottom>
            Recommendation Details:
          </Typography>
          <Box ml={1} mb={2}>
            <Typography variant="body2">
              • Original Product: {message.data?.originalProductName}
            </Typography>
            <Typography variant="body2">
              • Recommended Product: {message.data?.recommendedProductName}
            </Typography>
            <Typography variant="body2">
              • Reallocation: {message.data?.reallocationPercentage}% of budget
            </Typography>
            <Typography variant="body2">
              • Rationale: {message.data?.rationale}
            </Typography>
          </Box>
          
          {relatedDecision.status === 'pending' && onSimulate && (
            <Button 
              variant="outlined" 
              color="primary" 
              size="small" 
              onClick={() => onSimulate(relatedDecision.id)}
              sx={{ mr: 1 }}
            >
              Simulate
            </Button>
          )}
          
          {relatedDecision.status === 'simulated' && (
            <>
              {onApprove && (
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="small" 
                  onClick={() => onApprove(relatedDecision.id)}
                  sx={{ mr: 1 }}
                >
                  Approve
                </Button>
              )}
              
              {onReject && (
                <Button 
                  variant="outlined" 
                  color="error" 
                  size="small" 
                  onClick={() => onReject(relatedDecision.id)}
                >
                  Reject
                </Button>
              )}
            </>
          )}
        </Box>
      )}
      
      {/* Render simulation results if this is a simulation message */}
      {message.messageType === 'simulation' && message.data && (
        <SimulationResultContainer>
          <Typography variant="subtitle2" gutterBottom>
            Simulation Results:
          </Typography>
          
          <MetricItem>
            <Typography variant="body2">Sales Lift:</Typography>
            <Typography variant="body2" fontWeight="bold">
              {(message.data.results.salesLift * 100).toFixed(1)}%
            </Typography>
          </MetricItem>
          
          <MetricItem>
            <Typography variant="body2">Customer Satisfaction:</Typography>
            <Typography variant="body2" fontWeight="bold">
              {(message.data.results.customerSatisfaction * 100).toFixed(1)}%
            </Typography>
          </MetricItem>
          
          <MetricItem>
            <Typography variant="body2">Inventory Utilization:</Typography>
            <Typography variant="body2" fontWeight="bold">
              {(message.data.results.inventoryUtilization * 100).toFixed(1)}%
            </Typography>
          </MetricItem>
          
          <MetricItem>
            <Typography variant="body2">ROI:</Typography>
            <Typography variant="body2" fontWeight="bold">
              {message.data.results.roi.toFixed(1)}x
            </Typography>
          </MetricItem>
          
          <MetricItem>
            <Typography variant="body2">Risk Reduction:</Typography>
            <Typography variant="body2" fontWeight="bold">
              {(message.data.results.riskReduction * 100).toFixed(1)}%
            </Typography>
          </MetricItem>
          
          {message.data.insights && message.data.insights.length > 0 && (
            <>
              <Typography variant="subtitle2" mt={1} gutterBottom>
                Key Insights:
              </Typography>
              <Box ml={1}>
                {message.data.insights.map((insight: string, index: number) => (
                  <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                    • {insight}
                  </Typography>
                ))}
              </Box>
            </>
          )}
        </SimulationResultContainer>
      )}
    </MessageContainer>
  );
};

export default BusinessAgentMessage;
