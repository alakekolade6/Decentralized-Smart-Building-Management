import { describe, it, expect, beforeEach } from 'vitest';

describe('Occupancy Tracking Contract', () => {
  // Mock state
  let state = {
    admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    sender: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    buildingSpaces: new Map(),
    blockHeight: 100
  };
  
  // Mock functions
  const registerSpace = (buildingId: string, spaceId: string, spaceName: string, capacity: number) => {
    if (state.sender !== state.admin) {
      return { error: 403 };
    }
    
    const key = `${buildingId}-${spaceId}`;
    if (state.buildingSpaces.has(key)) {
      return { error: 'Space already exists' };
    }
    
    state.buildingSpaces.set(key, {
      spaceName,
      capacity,
      currentOccupancy: 0,
      lastUpdated: state.blockHeight
    });
    
    return { success: true };
  };
  
  const updateOccupancy = (buildingId: string, spaceId: string, occupancy: number) => {
    if (state.sender !== state.admin) {
      return { error: 403 };
    }
    
    const key = `${buildingId}-${spaceId}`;
    if (!state.buildingSpaces.has(key)) {
      return { error: 404 };
    }
    
    const space = state.buildingSpaces.get(key);
    
    if (occupancy > space.capacity) {
      return { error: 400 };
    }
    
    space.currentOccupancy = occupancy;
    space.lastUpdated = state.blockHeight;
    state.buildingSpaces.set(key, space);
    
    return { success: true };
  };
  
  const getSpaceDetails = (buildingId: string, spaceId: string) => {
    const key = `${buildingId}-${spaceId}`;
    if (!state.buildingSpaces.has(key)) {
      return { error: 404 };
    }
    
    return { success: state.buildingSpaces.get(key) };
  };
  
  const getOccupancyPercentage = (buildingId: string, spaceId: string) => {
    const key = `${buildingId}-${spaceId}`;
    if (!state.buildingSpaces.has(key)) {
      return { error: 404 };
    }
    
    const space = state.buildingSpaces.get(key);
    return { success: (space.currentOccupancy * 100) / space.capacity };
  };
  
  // Reset state before each test
  beforeEach(() => {
    state = {
      admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      sender: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      buildingSpaces: new Map(),
      blockHeight: 100
    };
  });
  
  it('should register a new space', () => {
    const result = registerSpace('building1', 'space1', 'Conference Room A', 20);
    expect(result.success).toBe(true);
    expect(state.buildingSpaces.has('building1-space1')).toBe(true);
    expect(state.buildingSpaces.get('building1-space1').spaceName).toBe('Conference Room A');
  });
  
  it('should update occupancy', () => {
    registerSpace('building1', 'space1', 'Conference Room A', 20);
    const result = updateOccupancy('building1', 'space1', 15);
    expect(result.success).toBe(true);
    expect(state.buildingSpaces.get('building1-space1').currentOccupancy).toBe(15);
  });
  
  it('should fail when occupancy exceeds capacity', () => {
    registerSpace('building1', 'space1', 'Conference Room A', 20);
    const result = updateOccupancy('building1', 'space1', 25);
    expect(result.error).toBe(400);
  });
  
  it('should get space details', () => {
    registerSpace('building1', 'space1', 'Conference Room A', 20);
    updateOccupancy('building1', 'space1', 15);
    const result = getSpaceDetails('building1', 'space1');
    expect(result.success.spaceName).toBe('Conference Room A');
    expect(result.success.currentOccupancy).toBe(15);
  });
  
  it('should calculate occupancy percentage', () => {
    registerSpace('building1', 'space1', 'Conference Room A', 20);
    updateOccupancy('building1', 'space1', 10);
    const result = getOccupancyPercentage('building1', 'space1');
    expect(result.success).toBe(50); // 10/20 * 100 = 50%
  });
});
