/**
 * Stub for TaskAutomationService
 * Backend services removed for frontend-only build
 */

export class TaskAutomationService {
  suggestTasks() {
    console.warn('[TaskAutomationService] Backend service disabled - frontend-only mode');
    return Promise.resolve([]);
  }

  createTask() {
    console.warn('[TaskAutomationService] Backend service disabled - frontend-only mode');
    return Promise.resolve(null);
  }

  updateTask() {
    console.warn('[TaskAutomationService] Backend service disabled - frontend-only mode');
    return Promise.resolve(null);
  }

  deleteTask() {
    console.warn('[TaskAutomationService] Backend service disabled - frontend-only mode');
    return Promise.resolve(null);
  }
}

export function createTaskAutomationService() {
  console.warn('[TaskAutomationService] Backend service disabled - frontend-only mode');
  return new TaskAutomationService();
}

