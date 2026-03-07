
import { VinResult } from '../types';

export const decodeVin = async (vin: string): Promise<VinResult | null> => {
  try {
    // 10-second timeout to prevent indefinite hangs
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data?.Results?.length) {
      return null;
    }

    const raw = data.Results[0];

    return {
      Make: raw.Make || '',
      Model: raw.Model || '',
      ModelYear: raw.ModelYear || '',
      VehicleType: raw.VehicleType || '',
      BodyClass: raw.BodyClass || '',
      DriveType: raw.DriveType || '',
      EngineCylinders: raw.EngineCylinders || '',
      EngineHP: raw.EngineHP || '',
      FuelType: raw.FuelTypePrimary || '',
      PlantCountry: raw.PlantCountry || '',
      Manufacturer: raw.Manufacturer || '',
      Trim: raw.Trim || '',
      Series: raw.Series || '',
      TransmissionStyle: raw.TransmissionStyle || '',
      Doors: raw.Doors || '',
      ErrorCode: raw.ErrorCode || '',
      ErrorText: raw.ErrorText || ''
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      // Timeout — don't log noise
    }
    return null;
  }
};
