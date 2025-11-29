import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Collapse,
  Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { supabase } from '../supabase';

interface SimulationActionCardProps {
  action: any;
  onStatusChange?: (actionId: string, newStatus: string) => void;
  showControls?: boolean;
}

const SimulationActionCard: React.FC<SimulationActionCardProps> = ({ 
  action, 
  onStatusChange,
  showControls = true 
}) => {
  const [expanded, setExpanded] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<any | null>(null);

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

  // Get icon based on status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircleIcon fontSize="small" />;
      case 'PENDING': return <WarningIcon fontSize="small" />;
      case 'REJECTED': return <ErrorIcon fontSize="small" />;
      default: return null;
    }
  };

  // Update action status
  const updateActionStatus = async (status: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('simulation_actions')
        .update({ 
          status, 
          approval_notes: notes,
          approved_by: 'current_user', // In a real app, use actual user ID
          updated_at: new Date().toISOString() 
        })
        .eq('action_id', action.action_id)
        .select();
        
      if (error) throw new Error(error.message);
      
      // If approved and action is marked for automated execution
      if (status === 'APPROVED' && !action.requires_approval) {
        // Execute action via API
        const response = await fetch(`/api/simulation/execute-action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            functionId: action.action_id,
            simulationId: action.simulation_id,
            parameters: {}
          })
        });
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to execute action');
        }
        
        setExecutionResult(result.executionResult);
      }
      
      // Close dialogs
      setApprovalDialogOpen(false);
      setRejectionDialogOpen(false);
      setNotes('');
      
      // Notify parent component
      if (onStatusChange) {
        onStatusChange(action.action_id, status);
      }
    } catch (err) {
      console.error('Error updating action status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AutoGraphIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">{action.action_name}</Typography>
            </Box>
            <Chip 
              icon={getStatusIcon(action.status)}
              label={action.status}
              color={action.status === 'COMPLETED' ? 'success' : 
                    action.status === 'APPROVED' ? 'primary' :
                    action.status === 'REJECTED' ? 'error' : 'warning'}
            />
          </Box>
          
          <Typography variant="body1" sx={{ mt: 1 }}>
            {action.action_description}
          </Typography>
          
          <Box sx={{ mt: 1, mb: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip 
              label={`Probability: ${formatConfidence(action.success_probability)}`}
              color="primary"
              size="small"
              variant="outlined"
            />
            <Chip 
              label={`Confidence: ${formatConfidence(action.confidence_score)}`}
              color="primary"
              size="small"
              variant="outlined"
            />
            <Chip 
              label={`Risk: ${action.risk_level}`}
              color={getRiskColor(action.risk_level) as any}
              size="small"
            />
            <Chip 
              label={action.requires_approval ? 'Requires Approval' : 'Automated'}
              variant="outlined"
              size="small"
            />
          </Box>
          
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', cursor: 'pointer' }} 
               onClick={() => setExpanded(!expanded)}>
            <Typography variant="body2" color="primary">
              {expanded ? 'Hide Details' : 'Show Details'}
            </Typography>
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </Box>
          
          <Collapse in={expanded}>
            <Box sx={{ mt: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2">Expected Outcome:</Typography>
              <Typography variant="body2">{action.expected_outcome}</Typography>
              
              {action.simulation_type && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>Simulation Type:</Typography>
                  <Typography variant="body2">{action.simulation_type}</Typography>
                </>
              )}
              
              {action.execution_metrics && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>Execution Metrics:</Typography>
                  <Typography variant="body2">
                    {Object.entries(action.execution_metrics).map(([key, value]) => (
                      <span key={key}>{key}: {value}; </span>
                    ))}
                  </Typography>
                </>
              )}
              
              {action.approval_notes && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>Notes:</Typography>
                  <Typography variant="body2">{action.approval_notes}</Typography>
                </>
              )}
              
              {executionResult && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>Execution Result:</Typography>
                  <Typography variant="body2">
                    {executionResult.result.insights.map((insight: string, idx: number) => (
                      <div key={idx}>{insight}</div>
                    ))}
                  </Typography>
                </>
              )}
            </Box>
          </Collapse>
          
          {error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          )}
          
          {loading && <LinearProgress sx={{ mt: 1 }} />}
          
          {showControls && action.status === 'PENDING' && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button 
                variant="outlined" 
                color="error" 
                size="small"
                sx={{ mr: 1 }}
                onClick={() => setRejectionDialogOpen(true)}
                disabled={loading}
              >
                Reject
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                size="small"
                onClick={() => setApprovalDialogOpen(true)}
                disabled={loading}
              >
                Approve
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
      
      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onClose={() => setApprovalDialogOpen(false)}>
        <DialogTitle>Approve Action</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to approve the action "{action.action_name}"?
          </Typography>
          <TextField
            label="Notes (Optional)"
            multiline
            rows={3}
            fullWidth
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => updateActionStatus('APPROVED')}
            disabled={loading}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onClose={() => setRejectionDialogOpen(false)}>
        <DialogTitle>Reject Action</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to reject the action "{action.action_name}"?
          </Typography>
          <TextField
            label="Reason for Rejection"
            multiline
            rows={3}
            fullWidth
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={() => updateActionStatus('REJECTED')}
            disabled={loading}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SimulationActionCard;
