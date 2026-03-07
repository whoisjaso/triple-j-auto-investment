import type { Dispatch, SetStateAction } from 'react';
import { Vehicle, VehicleStatus, RentalBooking } from '../../types';

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

// State shape for rental data
export interface RentalState {
  bookings: RentalBooking[];
  isLoadingRentals: boolean;
}

// Setters passed to rental operations
export interface RentalSetters {
  setBookings: Dispatch<SetStateAction<RentalBooking[]>>;
  setIsLoadingRentals: Dispatch<SetStateAction<boolean>>;
}

// Re-export for convenience
export type { Vehicle, RentalBooking };
export { VehicleStatus };
