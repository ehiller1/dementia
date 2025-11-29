import express, { Request, Response } from 'express';
import { SimulationTemplateEngine } from './simulationTemplateEngine';
import { SimulationIntentHandler } from './simulationIntentHandler';
import { SimulationActionProcessor } from './simulationActionProcessor';
import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * API service for simulation functionality
 */
export class SimulationAPIService {
  private simulationTemplateEngine: SimulationTemplateEngine;
  private simulationIntentHandler: SimulationIntentHandler;
  private simulationActionProcessor: SimulationActionProcessor;
  private router: express.Router;

  constructor(
    simulationTemplateEngine: SimulationTemplateEngine,
    simulationIntentHandler: SimulationIntentHandler,
    simulationActionProcessor: SimulationActionProcessor
  ) {
    this.simulationTemplateEngine = simulationTemplateEngine;
    this.simulationIntentHandler = simulationIntentHandler;
    this.simulationActionProcessor = simulationActionProcessor;
    this.router = express.Router();
    this.setupRoutes();
  }

  /**
   * Get the Express router for API routes
   */
  public getRouter(): express.Router {
    return this.router;
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    /**
     * Process a new simulation
     * POST /api/simulation/process
     */
    this.router.post('/process', async (req: Request, res: Response) => {
      try {
        const { simulationData, templateId, confidenceThreshold } = req.body;
        
        if (!simulationData) {
          return res.status(400).json({ 
            success: false, 
            error: 'Simulation data is required' 
          });
        }
        
        const result = await this.simulationIntentHandler.handleIntent({
          type: 'process_simulation',
          data: {
            simulationData,
            templateId,
            confidenceThreshold
          }
        });
        
        return res.status(result.success ? 200 : 400).json(result);
      } catch (error) {
        console.error('Error processing simulation:', error);
        return res.status(500).json({ 
          success: false, 
          error: `Internal server error: ${error.message}` 
        });
      }
    });

    /**
     * Execute a simulation action
     * POST /api/simulation/execute-action
     */
    this.router.post('/execute-action', async (req: Request, res: Response) => {
      try {
        const { functionId, simulationId, parameters } = req.body;
        
        if (!functionId || !simulationId) {
          return res.status(400).json({ 
            success: false, 
            error: 'Function ID and simulation ID are required' 
          });
        }
        
        const result = await this.simulationIntentHandler.handleIntent({
          type: 'execute_simulation_action',
          data: {
            functionId,
            simulationId,
            parameters
          }
        });
        
        return res.status(result.success ? 200 : 400).json(result);
      } catch (error) {
        console.error('Error executing simulation action:', error);
        return res.status(500).json({ 
          success: false, 
          error: `Internal server error: ${error.message}` 
        });
      }
    });

    /**
     * Generate a template from simulation
     * POST /api/simulation/generate-template
     */
    this.router.post('/generate-template', async (req: Request, res: Response) => {
      try {
        const { simulationId, templateContext } = req.body;
        
        if (!simulationId) {
          return res.status(400).json({ 
            success: false, 
            error: 'Simulation ID is required' 
          });
        }
        
        const result = await this.simulationIntentHandler.handleIntent({
          type: 'generate_simulation_template',
          data: {
            simulationId,
            templateContext
          }
        });
        
        return res.status(result.success ? 200 : 400).json(result);
      } catch (error) {
        console.error('Error generating simulation template:', error);
        return res.status(500).json({ 
          success: false, 
          error: `Internal server error: ${error.message}` 
        });
      }
    });

    /**
     * Get simulation results
     * GET /api/simulation/results/:simulationId
     */
    this.router.get('/results/:simulationId', async (req: Request, res: Response) => {
      try {
        const { simulationId } = req.params;
        
        const result = await this.simulationIntentHandler.handleIntent({
          type: 'get_simulation_results',
          data: {
            simulationId
          }
        });
        
        return res.status(result.success ? 200 : 400).json(result);
      } catch (error) {
        console.error('Error getting simulation results:', error);
        return res.status(500).json({ 
          success: false, 
          error: `Internal server error: ${error.message}` 
        });
      }
    });

    /**
     * Get all simulation results or by type
     * GET /api/simulation/results?type=<simulationType>&limit=<number>
     */
    this.router.get('/results', async (req: Request, res: Response) => {
      try {
        const simulationType = req.query.type as string;
        const limit = parseInt(req.query.limit as string) || 10;
        
        const result = await this.simulationIntentHandler.handleIntent({
          type: 'get_simulation_results',
          data: {
            simulationType,
            limit
          }
        });
        
        return res.status(result.success ? 200 : 400).json(result);
      } catch (error) {
        console.error('Error getting simulation results:', error);
        return res.status(500).json({ 
          success: false, 
          error: `Internal server error: ${error.message}` 
        });
      }
    });

    /**
     * Get recommended actions from a simulation
     * GET /api/simulation/:simulationId/actions
     */
    this.router.get('/:simulationId/actions', async (req: Request, res: Response) => {
      try {
        const { simulationId } = req.params;
        
        // Retrieve actions from database
        const { data: actions, error } = await supabase
          .from('simulation_actions')
          .select('*')
          .eq('simulation_id', simulationId)
          .order('confidence_score', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        return res.status(200).json({
          success: true,
          actions,
          count: actions.length
        });
      } catch (error) {
        console.error('Error getting simulation actions:', error);
        return res.status(500).json({ 
          success: false, 
          error: `Internal server error: ${error.message}` 
        });
      }
    });

    /**
     * Update action status (approve/reject)
     * PATCH /api/simulation/actions/:actionId
     */
    this.router.patch('/actions/:actionId', async (req: Request, res: Response) => {
      try {
        const { actionId } = req.params;
        const { status, approver, notes } = req.body;
        
        if (!status || !['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'].includes(status)) {
          return res.status(400).json({ 
            success: false, 
            error: 'Valid status is required' 
          });
        }
        
        // Update action in database
        const { data: updatedAction, error } = await supabase
          .from('simulation_actions')
          .update({
            status,
            approved_by: approver,
            approval_notes: notes,
            updated_at: new Date().toISOString()
          })
          .eq('action_id', actionId)
          .select()
          .single();
          
        if (error) {
          throw error;
        }
        
        // If approved, execute the action
        if (status === 'APPROVED') {
          // Get the simulation ID from the updated action
          const simulationId = updatedAction.simulation_id;
          
          // Queue the action for execution (async)
          this.simulationActionProcessor.executeApprovedAction(
            actionId,
            simulationId
          ).catch(err => {
            console.error(`Error executing approved action ${actionId}:`, err);
          });
        }
        
        return res.status(200).json({
          success: true,
          action: updatedAction,
          message: `Action ${actionId} updated to ${status}`
        });
      } catch (error) {
        console.error('Error updating simulation action:', error);
        return res.status(500).json({ 
          success: false, 
          error: `Internal server error: ${error.message}` 
        });
      }
    });
  }
}
