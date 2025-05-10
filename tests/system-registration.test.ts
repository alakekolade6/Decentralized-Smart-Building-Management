import { describe, it, expect, beforeEach } from 'vitest';

describe('System Registration Contract', () => {
  // Mock state
  let state = {
    admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    sender: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    buildingSystems: new Map(),
    blockHeight: 100
  };
  
  // Mock functions
  const registerSystem = (buildingId: string, systemId: string, systemType: string,
                          manufacturer: string, model: string, installationDate: number) => {
    if (state.sender !== state.admin) {
      return { error: 403 };
    }
    
    const key = `${buildingId}-${systemId}`;
    if (state.buildingSystems.has(key)) {
      return { error: 'System already exists' };
    }
    
    state.buildingSystems.set(key, {
      systemType,
      manufacturer,
      model,
      installationDate,
      lastMaintenance: installationDate
    });
    
    return { success: true };
  };
  
  const updateMaintenance = (buildingId: string, systemId: string) => {
    if (state.sender !== state.admin) {
      return { error: 403 };
    }
    
    const key = `${buildingId}-${systemId}`;
    if (!state.buildingSystems.has(key)) {
      return { error: 404 };
    }
    
    const system = state.buildingSystems.get(key);
    system.lastMaintenance = state.blockHeight;
    state.buildingSystems.set(key, system);
    
    return { success: true };
  };
  
  const getSystemDetails = (buildingId: string, systemId: string) => {
    const key = `${buildingId}-${systemId}`;
    if (!state.buildingSystems.has(key)) {
      return { error: 404 };
    }
    
    return { success: state.buildingSystems.get(key) };
  };
  
  const getMaintenanceStatus = (buildingId: string, systemId: string) => {
    const key = `${buildingId}-${systemId}`;
    if (!state.buildingSystems.has(key)) {
      return { error: 404 };
    }
    
    const system = state.buildingSystems.get(key);
    return { success: state.blockHeight - system.lastMaintenance };
  };
  
  // Reset state before each test
  beforeEach(() => {
    state = {
      admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      sender: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      buildingSystems: new Map(),
      blockHeight: 100
    };
  });
  
  it('should register a new system', () => {
    const result = registerSystem('building1', 'system1', 'HVAC', 'Carrier', 'Model X', 50);
    expect(result.success).toBe(true);
    expect(state.buildingSystems.has('building1-system1')).toBe(true);
    expect(state.buildingSystems.get('building1-system1').systemType).toBe('HVAC');
  });
  
  it('should update maintenance record', () => {
    registerSystem('building1', 'system1', 'HVAC', 'Carrier', 'Model X', 50);
    const result = updateMaintenance('building1', 'system1');
    expect(result.success).toBe(true);
    expect(state.buildingSystems.get('building1-system1').lastMaintenance).toBe(100);
  });
  
  it('should get system details', () => {
    registerSystem('building1', 'system1', 'HVAC', 'Carrier', 'Model X', 50);
    const result = getSystemDetails('building1', 'system1');
    expect(result.success.manufacturer).toBe('Carrier');
    expect(result.success.model).toBe('Model X');
  });
  
  it('should get maintenance status', () => {
    registerSystem('building1', 'system1', 'HVAC', 'Carrier', 'Model X', 50);
    const result = getMaintenanceStatus('building1', 'system1');
    expect(result.success).toBe(50); // 100 (current block) - 50 (installation date)
  });
  
  it('should fail when non-admin tries to register a system', () => {
    state.sender = 'ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const result = registerSystem('building1', 'system1', 'HVAC', 'Carrier', 'Model X', 50);
    expect(result.error).toBe(403);
  });
});
