import { describe, it, expect, beforeEach } from 'vitest';

describe('Energy Optimization Contract', () => {
  // Mock state
  let state = {
    admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    sender: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    energyConsumption: new Map(),
    blockHeight: 100
  };
  
  // Mock functions
  const recordConsumption = (buildingId: string, electricityKwh: number,
                             gasTherms: number, waterGallons: number, temperature: number) => {
    if (state.sender !== state.admin) {
      return { error: 403 };
    }
    
    const key = `${buildingId}-${state.blockHeight}`;
    state.energyConsumption.set(key, {
      electricityKwh,
      gasTherms,
      waterGallons,
      temperature,
      optimizationActive: false
    });
    
    return { success: true };
  };
  
  const toggleOptimization = (buildingId: string, timestamp: number, active: boolean) => {
    if (state.sender !== state.admin) {
      return { error: 403 };
    }
    
    const key = `${buildingId}-${timestamp}`;
    if (!state.energyConsumption.has(key)) {
      return { error: 404 };
    }
    
    const consumption = state.energyConsumption.get(key);
    consumption.optimizationActive = active;
    state.energyConsumption.set(key, consumption);
    
    return { success: true };
  };
  
  const getLatestConsumption = (buildingId: string) => {
    const key = `${buildingId}-${state.blockHeight}`;
    if (!state.energyConsumption.has(key)) {
      return { error: 404 };
    }
    
    return { success: state.energyConsumption.get(key) };
  };
  
  const isOptimizationActive = (buildingId: string, timestamp: number) => {
    const key = `${buildingId}-${timestamp}`;
    if (!state.energyConsumption.has(key)) {
      return { error: 404 };
    }
    
    return { success: state.energyConsumption.get(key).optimizationActive };
  };
  
  // Reset state before each test
  beforeEach(() => {
    state = {
      admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      sender: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      energyConsumption: new Map(),
      blockHeight: 100
    };
  });
  
  it('should record energy consumption', () => {
    const result = recordConsumption('building1', 1000, 50, 2000, 72);
    expect(result.success).toBe(true);
    expect(state.energyConsumption.has('building1-100')).toBe(true);
    expect(state.energyConsumption.get('building1-100').electricityKwh).toBe(1000);
  });
  
  it('should toggle optimization status', () => {
    recordConsumption('building1', 1000, 50, 2000, 72);
    const result = toggleOptimization('building1', 100, true);
    expect(result.success).toBe(true);
    expect(state.energyConsumption.get('building1-100').optimizationActive).toBe(true);
  });
  
  it('should get latest consumption', () => {
    recordConsumption('building1', 1000, 50, 2000, 72);
    const result = getLatestConsumption('building1');
    expect(result.success.electricityKwh).toBe(1000);
    expect(result.success.gasTherms).toBe(50);
    expect(result.success.waterGallons).toBe(2000);
  });
  
  it('should check if optimization is active', () => {
    recordConsumption('building1', 1000, 50, 2000, 72);
    toggleOptimization('building1', 100, true);
    const result = isOptimizationActive('building1', 100);
    expect(result.success).toBe(true);
  });
  
  it('should fail when non-admin tries to record consumption', () => {
    state.sender = 'ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const result = recordConsumption('building1', 1000, 50, 2000, 72);
    expect(result.error).toBe(403);
  });
});
