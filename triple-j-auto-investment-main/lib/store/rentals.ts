import { getAllBookings } from '../../services/rentalService';
import { RentalSetters } from './types';

/**
 * Load all rental bookings from Supabase.
 * Follows the same setter injection pattern as loadVehicles in vehicles.ts.
 */
export async function loadBookings(setters: RentalSetters): Promise<void> {
  setters.setIsLoadingRentals(true);

  try {
    const bookings = await getAllBookings();
    setters.setBookings(bookings);

    if (bookings.length > 0) {
      console.log(`Loaded ${bookings.length} rental bookings into Store.`);
    }
  } catch (error) {
    console.error('Error loading rental bookings:', error);
  } finally {
    setters.setIsLoadingRentals(false);
  }
}
