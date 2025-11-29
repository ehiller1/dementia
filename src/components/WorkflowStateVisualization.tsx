import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Divider, CircularProgress, Chip, Grid } from '@mui/material';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot } from '@mui/lab';
import { WorkflowService } from '../services/workflowService';
import { MemoryIntegrationService } from '../services/memory-integration/MemoryIntegrationService';

interface WorkflowStateVisualizationProps {
  tenantId: string;
  workflowId?: string;
  height?: string | number;
  width?: string | number;
}

interface WorkflowState {
  state: string;
  previousState: string;
  timestamp: string;
  transitionReason: string;
}

interface MemoryItem {
  id: string;
  type: string;
  content: string;
  timestamp: string;
  metadata?: any;
}

/**
 * WorkflowStateVisualization Component
 * 
 * This component visualizes the current workflow state and relevant long-term memory items
 * in a sidebar container for the chat interface.
 */
const WorkflowStateVisualization: React.FC<WorkflowStateVisualizationProps> = ({
  tenantId,
  workflowId,
  height = '100%',
  width = '100%'
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
  const [stateHistory, setStateHistory] = useState<WorkflowState[]>([]);
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([]);
  
  // Services
  const memoryService = new MemoryIntegrationService();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch workflow instance and history via WorkflowService
        if (workflowId) {
          const instance = await WorkflowService.getInstance(workflowId, tenantId);
          if (instance) {
            setWorkflowState({
              state: instance.status,
              previousState: instance.history?.length > 0 ? instance.history[instance.history.length - 1].stepId : '',
              timestamp: instance.updatedAt,
              transitionReason: instance.history?.length > 0 ? (instance.history[instance.history.length - 1].reason || '') : ''
            });
            const mappedHistory = (instance.history || []).map((h) => ({
              state: h.stepId,
              previousState: '',
              timestamp: h.timestamp,
              transitionReason: h.reason || ''
            }));
            setStateHistory(mappedHistory);
          }
        } else {
          // If no specific workflow ID, use the most recent instance for the tenant
          const instances = await WorkflowService.listInstances(tenantId);
          const instance = instances[0];
          if (instance) {
            setWorkflowState({
              state: instance.status,
              previousState: instance.history?.length > 0 ? instance.history[instance.history.length - 1].stepId : '',
              timestamp: instance.updatedAt,
              transitionReason: instance.history?.length > 0 ? (instance.history[instance.history.length - 1].reason || '') : ''
            });
            const mappedHistory = (instance.history || []).map((h) => ({
              state: h.stepId,
              previousState: '',
              timestamp: h.timestamp,
              transitionReason: h.reason || ''
            }));
            setStateHistory(mappedHistory);
          } else {
            setWorkflowState(null);
            setStateHistory([]);
          }
        }

        // Fetch relevant memory items using semantic search as a simple signal
        try {
          const results = await memoryService.searchLongTermMemory('workflow', { tenantId });
          const mappedMemory = (results || []).slice(0, 5).map((r) => ({
            id: r.id,
            type: r.type,
            content: r.content,
            timestamp: (r as any)?.metadata?.created_at || new Date().toISOString(),
            metadata: r.metadata
          }));
          setMemoryItems(mappedMemory);
        } catch (memErr) {
          console.warn('Memory search failed:', memErr);
          setMemoryItems([]);
        }
      } catch (err) {
        console.error('Error fetching workflow state:', err);
        setError('Failed to load workflow state and memory data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Set up polling for updates
    const intervalId = setInterval(fetchData, 5000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [tenantId, workflowId]);
  
  // Get color for workflow state
  const getStateColor = (state: string): string => {
    switch (state?.toLowerCase()) {
      case 'completed':
        return '#4caf50'; // Green
      case 'in_progress':
      case 'running':
        return '#2196f3'; // Blue
      case 'pending':
      case 'waiting':
        return '#ff9800'; // Orange
      case 'failed':
      case 'error':
        return '#f44336'; // Red
      default:
        return '#9e9e9e'; // Grey
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height,
          width
        }}
      >
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ ml: 1 }}>
          Loading workflow state...
        </Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height,
          width,
          color: 'error.main'
        }}
      >
        <Typography variant="body2">{error}</Typography>
      </Box>
    );
  }
  
  return (
    <Box
      sx={{
        height,
        width,
        overflow: 'auto',
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 1
      }}
    >
      {/* Current Workflow State */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Workflow State
        </Typography>
        
        {workflowState ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: getStateColor(workflowState.state),
                  mr: 1
                }}
              />
              <Typography variant="body1" fontWeight="bold">
                {workflowState.state}
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              Last updated: {formatTimestamp(workflowState.timestamp)}
            </Typography>
            
            {workflowState.transitionReason && (
              <Typography variant="body2" color="text.secondary">
                Reason: {workflowState.transitionReason}
              </Typography>
            )}
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No active workflow
          </Typography>
        )}
      </Paper>
      
      {/* Workflow State History */}
      {stateHistory.length > 0 && (
        <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            State History
          </Typography>
          
          <Timeline position="right" sx={{ p: 0, m: 0 }}>
            {stateHistory.slice(0, 5).map((state, index) => (
              <TimelineItem key={index}>
                <TimelineSeparator>
                  <TimelineDot sx={{ bgcolor: getStateColor(state.state) }} />
                  {index < stateHistory.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="body2" fontWeight="medium">
                    {state.state}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatTimestamp(state.timestamp)}
                  </Typography>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </Paper>
      )}
      
      {/* Memory Items */}
      <Paper elevation={1} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Long-Term Memory
        </Typography>
        
        {memoryItems.length > 0 ? (
          <Grid container spacing={1}>
            {memoryItems.map((item) => (
              <Grid item xs={12} key={item.id}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1,
                    mb: 1,
                    bgcolor: 'background.default',
                    borderLeft: `4px solid ${getMemoryTypeColor(item.type)}`
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Chip
                      label={item.type}
                      size="small"
                      sx={{
                        bgcolor: getMemoryTypeColor(item.type),
                        color: 'white',
                        fontSize: '0.7rem'
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {formatTimestamp(item.timestamp)}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {truncateText(item.content, 100)}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No memory items available
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

// Helper function to get color for memory type
const getMemoryTypeColor = (type: string): string => {
  switch (type?.toLowerCase()) {
    case 'insight':
      return '#673ab7'; // Deep Purple
    case 'decision':
      return '#2196f3'; // Blue
    case 'action':
      return '#4caf50'; // Green
    case 'template':
      return '#ff9800'; // Orange
    case 'knowledge':
      return '#009688'; // Teal
    default:
      return '#9e9e9e'; // Grey
  }
};

// Helper function to truncate text
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
};

export default WorkflowStateVisualization;
