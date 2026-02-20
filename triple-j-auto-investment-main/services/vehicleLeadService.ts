import { Lead, LeadActionType, CommitmentLevel } from '../types';
import { captureAttribution } from './attributionService';

/**
 * Map action types to their commitment levels.
 * Level 0 actions (save, calculator) don't create leads.
 */
const ACTION_COMMITMENT: Record<LeadActionType, CommitmentLevel> = {
  contact: 1,
  finance: 2,
  vehicle_inquiry: 1,
  price_alert: 1,
  similar_vehicles: 1,
  vehicle_report: 1,
  schedule_visit: 2,
  ask_question: 2,
  reserve: 3,
};

interface CreateVehicleLeadParams {
  actionType: LeadActionType;
  phone: string;
  vehicleId?: string;
  vehicleVin?: string;
  name?: string;
  email?: string;
  message?: string;
}

/**
 * Build a Lead object for a vehicle-specific engagement action.
 * Returns a Lead ready to pass to Store's addLead().
 *
 * Usage in components:
 *   const lead = createVehicleLead({ actionType: 'price_alert', phone: '8321234567', vehicleId: v.id, vehicleVin: v.vin });
 *   await addLead(lead);
 */
export function createVehicleLead(params: CreateVehicleLeadParams): Lead {
  const { actionType, phone, vehicleId, vehicleVin, name, email, message } = params;
  const attr = captureAttribution();

  return {
    id: Math.random().toString(36).substr(2, 9),
    name: name || '',
    email: email || '',
    phone,
    interest: vehicleVin || `${actionType} inquiry`,
    date: new Date().toISOString(),
    status: 'New',
    vehicleId,
    actionType,
    commitmentLevel: ACTION_COMMITMENT[actionType],
    message,
    // Phase 16: Attribution
    sessionId: attr.session_id,
    pagePath: attr.page_path,
    referrer: attr.referrer,
    utmSource: attr.utm_source,
    utmMedium: attr.utm_medium,
    utmCampaign: attr.utm_campaign,
    deviceType: attr.device_type,
  };
}

/**
 * Format a phone number for display: (832) 400-9760
 */
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

/**
 * Basic phone validation: must be 10+ digits after stripping formatting.
 */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 11;
}
