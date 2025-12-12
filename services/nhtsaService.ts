
import { VinResult } from '../types';

export const decodeVin = async (vin: string): Promise<VinResult | null> => {
  try {
    const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`);
    const data = await response.json();
    
    if (data.Results && data.Results.length > 0) {
      const raw = data.Results[0];
      
      // Map raw NHTSA data to our Intelligence Interface
      // We extract deep data to surpass standard consumer tools
      return {
        Make: raw.Make,
        Model: raw.Model,
        ModelYear: raw.ModelYear,
        VehicleType: raw.VehicleType,
        BodyClass: raw.BodyClass,
        DriveType: raw.DriveType,
        EngineCylinders: raw.EngineCylinders,
        EngineHP: raw.EngineHP,
        FuelType: raw.FuelTypePrimary,
        PlantCountry: raw.PlantCountry,
        Manufacturer: raw.Manufacturer,
        Trim: raw.Trim,
        Series: raw.Series,
        TransmissionStyle: raw.TransmissionStyle,
        Doors: raw.Doors,
        ErrorCode: raw.ErrorCode,
        ErrorText: raw.ErrorText
      } as VinResult;
    }
    return null;
  } catch (error) {
    console.error("NHTSA API Error:", error);
    return null;
  }
};
