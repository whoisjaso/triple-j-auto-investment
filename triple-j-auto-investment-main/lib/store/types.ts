import type { Dispatch, SetStateAction } from 'react';
import { Vehicle, VehicleStatus } from '../../types';

// State shape for vehicle data
export interface VehicleState {
  vehicles: Vehicle[];
  isLoading: boolean;
  connectionError: string | null;
}

// Setters passed to vehicle operations
export interface VehicleSetters {
  setVehicles: Dispatch<SetStateAction<Vehicle[]>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setConnectionError: Dispatch<SetStateAction<string | null>>;
}

// Re-export for convenience
export { Vehicle, VehicleStatus };
