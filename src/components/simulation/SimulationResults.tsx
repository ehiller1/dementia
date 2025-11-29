import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Grid, Button, Chip, Box, LinearProgress, Divider, Alert } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { supabase } from '../supabase';

interface SimulationResultsProps {
  simulationId: string;
  onActionSelect?: (actionId: string) => void;
}

const SimulationResults: React.FC<SimulationResultsProps> = ({ simulationId, onActionSelect }) => {
  const [simulation, setSimulation] = useState<any>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!simulationId) return;
    
    // Fetch simulation data
    const fetchSimulationData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch simulation results
        const { data: simulationData, error: simError } = await supabase
          .from('simulation_results')
          .select('*')
          .eq('id', simulationId)
          .single();
          
        if (simError) throw new Error(simError.message);
        
        // Fetch recommended actions
        const { data: actionData, error: actionError } = await supabase
          .from('simulation_actions')
          .select('*')
          .eq('simulation_id', simulationId)
          .order('confidence_score', { ascending: false });
          
        if (actionError) throw new Error(actionError.message);
        
        setSimulation(simulationData);
        setActions(actionData);
      } catch (err) {
        console.error('Error fetching simulation data:', err);
        setError('Failed to load simulation data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSimulationData();
  }, [simulationId]);
  
  // Format confidence as percentage
  const formatConfidence = (confidence: number) => `${Math.round(confidence * 100)}%`;
  
  // Get color based on risk level
  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'info';
    }
  };
  
  // Get icon based on trend
  const getTrendIcon = (trend: string) => {
    switch (trend?.toLowerCase()) {
      case 'up':
      case 'positive': 
        return <TrendingUpIcon color="success" />;
      case 'down':
      case 'negative':
        return <TrendingDownIcon color="error" />;
      default:
        return null;
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4, p: 2 }}>
        <Typography variant="h6">Loading Simulation Results...</Typography>
        <LinearProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        {error}
      </Alert>
    );
  }
  
  if (!simulation) {
    return (
      <Alert severity="info" sx={{ mt: 4 }}>
        No simulation data found for ID: {simulationId}
      </Alert>
    );
  }
  
  // Extract simulation data
  const simulationData = simulation.raw_result;
  const aggregateMetrics = simulation.aggregate_metrics;
  const simulationType = simulation.simulation_type;
  
  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      {/* Simulation Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
            <AssessmentIcon sx={{ mr: 1 }} />
            {simulationType} Simulation Results
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            ID: {simulationId} • Created: {new Date(simulation.created_at).toLocaleString()}
          </Typography>
        </Box>
        <Chip 
          label={`${aggregateMetrics?.recommendedActions?.length || 0} Recommended Actions`}
          color="primary"
          variant="outlined"
        />
      </Box>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Expected Value */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">Expected Value</Typography>
              <Typography variant="h5">
                ${aggregateMetrics?.expectedValue?.toLocaleString() || 'N/A'}
                {aggregateMetrics?.valueTrend && getTrendIcon(aggregateMetrics.valueTrend)}
              </Typography>
              <Typography variant="body2">
                Confidence: {formatConfidence(aggregateMetrics?.confidenceInterval?.confidence || 0.5)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Risk Assessment */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">Risk Assessment</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip 
                  label={aggregateMetrics?.riskLevel || 'Medium'}
                  color={getRiskColor(aggregateMetrics?.riskLevel) as any}
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Typography variant="h5">
                  {aggregateMetrics?.riskScore?.toFixed(2) || 'N/A'}
                </Typography>
              </Box>
              <Typography variant="body2">
                Mitigation options: {aggregateMetrics?.riskMitigationOptions?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Simulation Accuracy */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">Simulation Accuracy</Typography>
              <Typography variant="h5">
                {formatConfidence(aggregateMetrics?.accuracyScore || 0.5)}
              </Typography>
              <Typography variant="body2">
                Based on {aggregateMetrics?.sampleSize || 'N/A'} iterations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Recommended Actions */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Recommended Actions
      </Typography>
      
      <Grid container spacing={2}>
        {actions.length > 0 ? (
          actions.map((action) => (
            <Grid item xs={12} key={action.action_id}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="h6">{action.action_name}</Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {action.action_description}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip 
                          label={`Success: ${formatConfidence(action.success_probability)}`}
                          color="primary"
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <Chip 
                          label={`Risk: ${action.risk_level}`}
                          color={getRiskColor(action.risk_level) as any}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <Chip 
                          label={action.requires_approval ? 'Requires Approval' : 'Automated'}
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                        Expected outcome: {action.expected_outcome}
                      </Typography>
                    </Box>
                    <Box>
                      <Chip 
                        icon={action.status === 'COMPLETED' ? <CheckCircleIcon /> : 
                              action.status === 'PENDING' ? <WarningIcon /> : null}
                        label={action.status}
                        color={action.status === 'COMPLETED' ? 'success' : 
                              action.status === 'APPROVED' ? 'primary' :
                              action.status === 'REJECTED' ? 'error' : 'warning'}
                      />
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    {action.status === 'PENDING' && action.requires_approval && (
                      <>
                        <Button 
                          variant="outlined" 
                          color="error" 
                          size="small"
                          sx={{ mr: 1 }}
                          onClick={() => {
                            // Update action status
                            supabase
                              .from('simulation_actions')
                              .update({ status: 'REJECTED', updated_at: new Date().toISOString() })
                              .eq('action_id', action.action_id)
                              .then(() => {
                                // Refresh actions
                                const updatedActions = actions.map(a => 
                                  a.action_id === action.action_id ? {...a, status: 'REJECTED'} : a
                                );
                                setActions(updatedActions);
                              });
                          }}
                        >
                          Reject
                        </Button>
                        <Button 
                          variant="contained" 
                          color="primary"
                          size="small"
                          onClick={() => {
                            // Update action status
                            supabase
                              .from('simulation_actions')
                              .update({ status: 'APPROVED', updated_at: new Date().toISOString() })
                              .eq('action_id', action.action_id)
                              .then(() => {
                                // Refresh actions
                                const updatedActions = actions.map(a => 
                                  a.action_id === action.action_id ? {...a, status: 'APPROVED'} : a
                                );
                                setActions(updatedActions);
                              });
                          }}
                        >
                          Approve
                        </Button>
                      </>
                    )}
                    
                    {onActionSelect && (
                      <Button 
                        variant="outlined" 
                        color="primary"
                        size="small"
                        onClick={() => onActionSelect(action.action_id)}
                        sx={{ ml: action.status === 'PENDING' && action.requires_approval ? 1 : 0 }}
                      >
                        View Details
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Alert severity="info">No recommended actions found for this simulation.</Alert>
          </Grid>
        )}
      </Grid>
      
      {/* Simulation Insights */}
      {simulationData && (
        <>
          <Divider sx={{ my: 4 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>
            Key Insights
          </Typography>
          
          <Grid container spacing={3}>
            {simulationData.key_insights?.marketing?.primary_finding && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" color="primary">Marketing Insight</Typography>
                    <Typography variant="body1">
                      {simulationData.key_insights.marketing.primary_finding}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
            
            {simulationData.key_insights?.inventory?.primary_finding && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" color="primary">Inventory Insight</Typography>
                    <Typography variant="body1">
                      {simulationData.key_insights.inventory.primary_finding}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
            
            {simulationData.key_insights?.strategic_recommendation?.action && (
              <Grid item xs={12}>
                <Card sx={{ bgcolor: '#f5f5f5' }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="primary">Strategic Recommendation</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {simulationData.key_insights.strategic_recommendation.action}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {simulationData.key_insights.strategic_recommendation.expected_outcome}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </>
      )}
    </Box>
  );
};

export default SimulationResults;
