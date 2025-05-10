import { describe, it, expect, beforeEach } from 'vitest';

describe('Maintenance Scheduling Contract', () => {
  // Mock state
  let state = {
    admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    sender: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    maintenanceTasks: new Map(),
    blockHeight: 100
  };
  
  // Mock functions
  const scheduleTask = (buildingId: string, taskId: string, systemId: string,
                        description: string, scheduledDate: number, assignedTo: string) => {
    if (state.sender !== state.admin) {
      return { error: 403 };
    }
    
    const key = `${buildingId}-${taskId}`;
    if (state.maintenanceTasks.has(key)) {
      return { error: 'Task already exists' };
    }
    
    state.maintenanceTasks.set(key, {
      systemId,
      description,
      scheduledDate,
      completed: false,
      completionDate: 0,
      assignedTo
    });
    
    return { success: true };
  };
  
  const completeTask = (buildingId: string, taskId: string) => {
    const key = `${buildingId}-${taskId}`;
    if (!state.maintenanceTasks.has(key)) {
      return { error: 404 };
    }
    
    const task = state.maintenanceTasks.get(key);
    
    if (state.sender !== state.admin && state.sender !== task.assignedTo) {
      return { error: 403 };
    }
    
    task.completed = true;
    task.completionDate = state.blockHeight;
    state.maintenanceTasks.set(key, task);
    
    return { success: true };
  };
  
  const reassignTask = (buildingId: string, taskId: string, newAssignee: string) => {
    if (state.sender !== state.admin) {
      return { error: 403 };
    }
    
    const key = `${buildingId}-${taskId}`;
    if (!state.maintenanceTasks.has(key)) {
      return { error: 404 };
    }
    
    const task = state.maintenanceTasks.get(key);
    task.assignedTo = newAssignee;
    state.maintenanceTasks.set(key, task);
    
    return { success: true };
  };
  
  const getTaskDetails = (buildingId: string, taskId: string) => {
    const key = `${buildingId}-${taskId}`;
    if (!state.maintenanceTasks.has(key)) {
      return { error: 404 };
    }
    
    return { success: state.maintenanceTasks.get(key) };
  };
  
  const isTaskOverdue = (buildingId: string, taskId: string) => {
    const key = `${buildingId}-${taskId}`;
    if (!state.maintenanceTasks.has(key)) {
      return { error: 404 };
    }
    
    const task = state.maintenanceTasks.get(key);
    return {
      success: !task.completed && state.blockHeight > task.scheduledDate
    };
  };
  
  // Reset state before each test
  beforeEach(() => {
    state = {
      admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      sender: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      maintenanceTasks: new Map(),
      blockHeight: 100
    };
  });
  
  it('should schedule a maintenance task', () => {
    const result = scheduleTask(
        'building1',
        'task1',
        'system1',
        'Replace air filters',
        120,
        'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
    );
    expect(result.success).toBe(true);
    expect(state.maintenanceTasks.has('building1-task1')).toBe(true);
    expect(state.maintenanceTasks.get('building1-task1').description).toBe('Replace air filters');
  });
  
  it('should complete a task', () => {
    scheduleTask(
        'building1',
        'task1',
        'system1',
        'Replace air filters',
        120,
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
    );
    const result = completeTask('building1', 'task1');
    expect(result.success).toBe(true);
    expect(state.maintenanceTasks.get('building1-task1').completed).toBe(true);
    expect(state.maintenanceTasks.get('building1-task1').completionDate).toBe(100);
  });
  
  it('should allow assignee to complete a task', () => {
    const assignee = 'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    scheduleTask(
        'building1',
        'task1',
        'system1',
        'Replace air filters',
        120,
        assignee
    );
    state.sender = assignee;
    const result = completeTask('building1', 'task1');
    expect(result.success).toBe(true);
  });
  
  it('should reassign a task', () => {
    scheduleTask(
        'building1',
        'task1',
        'system1',
        'Replace air filters',
        120,
        'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
    );
    const newAssignee = 'ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const result = reassignTask('building1', 'task1', newAssignee);
    expect(result.success).toBe(true);
    expect(state.maintenanceTasks.get('building1-task1').assignedTo).toBe(newAssignee);
  });
  
  it('should check if a task is overdue', () => {
    scheduleTask(
        'building1',
        'task1',
        'system1',
        'Replace air filters',
        90, // Scheduled date is before current block height (100)
        'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
    );
    const result = isTaskOverdue('building1', 'task1');
    expect(result.success).toBe(true);
  });
  
  it('should not mark completed tasks as overdue', () => {
    scheduleTask(
        'building1',
        'task1',
        'system1',
        'Replace air filters',
        90,
        'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
    );
    completeTask('building1', 'task1');
    const result = isTaskOverdue('building1', 'task1');
    expect(result.success).toBe(false);
  });
});
