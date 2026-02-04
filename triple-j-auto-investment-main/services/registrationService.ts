/**
 * Registration Status Ledger Service
 * Handles all CRUD operations for registration tracking
 *
 * Updated for 6-stage workflow (Phase 02-02):
 * sale_complete -> documents_collected -> submitted_to_dmv ->
 * dmv_processing -> sticker_ready -> sticker_delivered
 * (+ rejected branch from dmv_processing)
 */

import { supabase } from '../supabase/config';
import {
  Registration,
  RegistrationStageKey,
  RegistrationDocument,
  RegistrationAudit,
  REGISTRATION_STAGES,
  VALID_TRANSITIONS
} from '../types';

// ================================================================
// DATA TRANSFORMERS
// ================================================================

/**
 * Transform database row to Registration interface
 * Maps snake_case DB columns to camelCase TypeScript properties
 */
const transformRegistration = (data: any): Registration => ({
  id: data.id,
  orderId: data.order_id,
  vehicleId: data.vehicle_id,
  billOfSaleId: data.bill_of_sale_id,
  customerName: data.customer_name,
  customerEmail: data.customer_email,
  customerPhone: data.customer_phone,
  customerAddress: data.customer_address,
  vin: data.vin,
  vehicleYear: data.vehicle_year,
  vehicleMake: data.vehicle_make,
  vehicleModel: data.vehicle_model,
  plateNumber: data.plate_number,
  // Document checklist
  docTitleFront: data.doc_title_front ?? false,
  docTitleBack: data.doc_title_back ?? false,
  doc130u: data.doc_130u ?? false,
  docInsurance: data.doc_insurance ?? false,
  docInspection: data.doc_inspection ?? false,
  // Status
  currentStage: data.current_stage,
  // Milestone dates
  saleDate: data.sale_date,
  submissionDate: data.submission_date,
  approvalDate: data.approval_date,
  deliveryDate: data.delivery_date,
  // Notes
  notes: data.notes,
  rejectionNotes: data.rejection_notes,
  // Metadata
  isArchived: data.is_archived ?? false,
  purchaseDate: data.purchase_date,
  createdAt: data.created_at,
  updatedAt: data.updated_at
});

const transformDocument = (data: any): RegistrationDocument => ({
  id: data.id,
  registrationId: data.registration_id,
  stageKey: data.stage_key,
  documentType: data.document_type,
  documentName: data.document_name,
  fileUrl: data.file_url,
  verified: data.verified,
  verifiedBy: data.verified_by,
  verifiedAt: data.verified_at,
  rejectionReason: data.rejection_reason,
  uploadedBy: data.uploaded_by,
  createdAt: data.created_at
});

/**
 * Transform database row to RegistrationAudit interface
 */
const transformAudit = (data: any): RegistrationAudit => ({
  id: data.id,
  registrationId: data.registration_id,
  operation: data.operation,
  changedFields: data.changed_fields,
  fullOldRecord: data.full_old_record,
  fullNewRecord: data.full_new_record,
  changedBy: data.changed_by,
  changedAt: data.changed_at,
  changeReason: data.change_reason,
  createdAt: data.created_at
});

// ================================================================
// PUBLIC API: Customer-facing (uses order_id as auth)
// ================================================================

/**
 * Fetch a registration by order ID (public access for customer tracker)
 * Excludes archived registrations
 */
export async function getRegistrationByOrderId(orderId: string): Promise<Registration | null> {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('order_id', orderId.toUpperCase())
      .eq('is_archived', false)
      .single();

    if (error || !data) {
      console.error('Registration not found:', error);
      return null;
    }

    return transformRegistration(data);
  } catch (error) {
    console.error('Error fetching registration:', error);
    return null;
  }
}

/**
 * Get documents for a registration (public access)
 */
export async function getRegistrationDocuments(registrationId: string): Promise<RegistrationDocument[]> {
  try {
    const { data, error } = await supabase
      .from('registration_documents')
      .select('*')
      .eq('registration_id', registrationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return [];
    }

    return (data || []).map(transformDocument);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
}

// ================================================================
// ADMIN API: Authenticated admin access
// ================================================================

/**
 * Fetch all registrations (admin only)
 * Filters out archived registrations by default
 */
export async function getAllRegistrations(includeArchived: boolean = false): Promise<Registration[]> {
  try {
    let query = supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching registrations:', error);
      return [];
    }

    return (data || []).map(transformRegistration);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return [];
  }
}

/**
 * Get a single registration by ID (admin)
 */
export async function getRegistrationById(id: string): Promise<Registration | null> {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Registration not found:', error);
      return null;
    }

    return transformRegistration(data);
  } catch (error) {
    console.error('Error fetching registration:', error);
    return null;
  }
}

/**
 * Create a new registration
 * Starts at 'sale_complete' stage with sale_date auto-populated
 */
export async function createRegistration(input: {
  vehicleId?: string;
  billOfSaleId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  vin: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  plateNumber?: string;
  purchaseDate?: string;
}): Promise<Registration | null> {
  try {
    // Generate order ID
    const { data: orderIdData, error: orderIdError } = await supabase
      .rpc('generate_order_id');

    if (orderIdError) {
      console.error('Error generating order ID:', orderIdError);
      return null;
    }

    const orderId = orderIdData || `TJ-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();

    // Create registration - starts at sale_complete
    const { data, error } = await supabase
      .from('registrations')
      .insert([{
        order_id: orderId,
        vehicle_id: input.vehicleId || null,
        bill_of_sale_id: input.billOfSaleId || null,
        customer_name: input.customerName,
        customer_email: input.customerEmail || null,
        customer_phone: input.customerPhone || null,
        customer_address: input.customerAddress || null,
        vin: input.vin.toUpperCase(),
        vehicle_year: input.vehicleYear,
        vehicle_make: input.vehicleMake,
        vehicle_model: input.vehicleModel,
        plate_number: input.plateNumber || null,
        purchase_date: input.purchaseDate || now,
        current_stage: 'sale_complete',
        sale_date: now,
        is_archived: false
      }])
      .select()
      .single();

    if (error || !data) {
      console.error('Error creating registration:', error);
      return null;
    }

    return transformRegistration(data);
  } catch (error) {
    console.error('Error creating registration:', error);
    return null;
  }
}

// ================================================================
// STATUS UPDATE FUNCTIONS (6-stage workflow)
// ================================================================

/**
 * Update registration status (advances to next stage)
 * Uses pending_change_reason for audit trail capture
 * Database trigger validates transitions and auto-populates milestone dates
 */
export async function updateRegistrationStatus(
  registrationId: string,
  newStage: RegistrationStageKey,
  options?: {
    changeReason?: string;
    rejectionNotes?: string;
  }
): Promise<boolean> {
  try {
    const updateData: Record<string, unknown> = {
      current_stage: newStage,
      updated_at: new Date().toISOString()
    };

    // Set pending_change_reason for audit trigger to capture
    if (options?.changeReason) {
      updateData.pending_change_reason = options.changeReason;
    }

    // Set rejection notes if rejecting
    if (newStage === 'rejected' && options?.rejectionNotes) {
      updateData.rejection_notes = options.rejectionNotes;
    }

    // Clear rejection notes when resubmitting from rejected state
    if (newStage === 'submitted_to_dmv') {
      updateData.rejection_notes = null;
    }

    const { error } = await supabase
      .from('registrations')
      .update(updateData)
      .eq('id', registrationId);

    if (error) {
      console.error('Error updating registration status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating registration status:', error);
    return false;
  }
}

/**
 * Check if a status transition is valid
 * Client-side validation (DB also enforces this)
 */
export function isValidTransition(
  currentStage: RegistrationStageKey,
  newStage: RegistrationStageKey
): boolean {
  const allowed = VALID_TRANSITIONS[currentStage] || [];
  return allowed.includes(newStage);
}

/**
 * Get the next valid stages for a registration
 */
export function getNextStages(currentStage: RegistrationStageKey): RegistrationStageKey[] {
  return VALID_TRANSITIONS[currentStage] || [];
}

/**
 * Update document checklist fields
 * Supports audit trail via pending_change_reason
 */
export async function updateDocumentChecklist(
  registrationId: string,
  checklist: {
    docTitleFront?: boolean;
    docTitleBack?: boolean;
    doc130u?: boolean;
    docInsurance?: boolean;
    docInspection?: boolean;
  },
  changeReason?: string
): Promise<boolean> {
  try {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (checklist.docTitleFront !== undefined) updateData.doc_title_front = checklist.docTitleFront;
    if (checklist.docTitleBack !== undefined) updateData.doc_title_back = checklist.docTitleBack;
    if (checklist.doc130u !== undefined) updateData.doc_130u = checklist.doc130u;
    if (checklist.docInsurance !== undefined) updateData.doc_insurance = checklist.docInsurance;
    if (checklist.docInspection !== undefined) updateData.doc_inspection = checklist.docInspection;

    if (changeReason) {
      updateData.pending_change_reason = changeReason;
    }

    const { error } = await supabase
      .from('registrations')
      .update(updateData)
      .eq('id', registrationId);

    return !error;
  } catch (error) {
    console.error('Error updating document checklist:', error);
    return false;
  }
}

/**
 * Update registration notes
 */
export async function updateRegistrationNotes(
  registrationId: string,
  notes: string,
  changeReason?: string
): Promise<boolean> {
  try {
    const updateData: Record<string, unknown> = {
      notes,
      updated_at: new Date().toISOString()
    };

    if (changeReason) {
      updateData.pending_change_reason = changeReason;
    }

    const { error } = await supabase
      .from('registrations')
      .update(updateData)
      .eq('id', registrationId);

    return !error;
  } catch (error) {
    console.error('Error updating notes:', error);
    return false;
  }
}

// ================================================================
// AUDIT TRAIL FUNCTIONS
// ================================================================

/**
 * Fetch audit trail for a registration
 * Returns entries sorted by most recent first
 */
export async function getRegistrationAudit(registrationId: string): Promise<RegistrationAudit[]> {
  try {
    const { data, error } = await supabase
      .from('registration_audit')
      .select('*')
      .eq('registration_id', registrationId)
      .order('changed_at', { ascending: false });

    if (error) {
      console.error('Error fetching audit trail:', error);
      return [];
    }

    return (data || []).map(transformAudit);
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    return [];
  }
}

// ================================================================
// ARCHIVE (SOFT DELETE) FUNCTIONS
// ================================================================

/**
 * Archive a registration (soft delete)
 * Registrations are never hard deleted per compliance requirements
 */
export async function archiveRegistration(
  id: string,
  changeReason?: string
): Promise<boolean> {
  try {
    const updateData: Record<string, unknown> = {
      is_archived: true,
      updated_at: new Date().toISOString()
    };

    if (changeReason) {
      updateData.pending_change_reason = changeReason;
    }

    const { error } = await supabase
      .from('registrations')
      .update(updateData)
      .eq('id', id);

    return !error;
  } catch (error) {
    console.error('Error archiving registration:', error);
    return false;
  }
}

/**
 * Restore an archived registration
 */
export async function restoreRegistration(
  id: string,
  changeReason?: string
): Promise<boolean> {
  try {
    const updateData: Record<string, unknown> = {
      is_archived: false,
      updated_at: new Date().toISOString()
    };

    if (changeReason) {
      updateData.pending_change_reason = changeReason;
    }

    const { error } = await supabase
      .from('registrations')
      .update(updateData)
      .eq('id', id);

    return !error;
  } catch (error) {
    console.error('Error restoring registration:', error);
    return false;
  }
}

/**
 * Upload a document for a registration
 */
export async function uploadDocument(input: {
  registrationId: string;
  stageKey: RegistrationStageKey;
  documentType: string;
  documentName?: string;
  fileUrl: string;
  uploadedBy?: 'customer' | 'admin';
}): Promise<RegistrationDocument | null> {
  try {
    const { data, error } = await supabase
      .from('registration_documents')
      .insert([{
        registration_id: input.registrationId,
        stage_key: input.stageKey,
        document_type: input.documentType,
        document_name: input.documentName,
        file_url: input.fileUrl,
        uploaded_by: input.uploadedBy || 'customer'
      }])
      .select()
      .single();

    if (error || !data) {
      console.error('Error uploading document:', error);
      return null;
    }

    return transformDocument(data);
  } catch (error) {
    console.error('Error uploading document:', error);
    return null;
  }
}

/**
 * Verify or reject a document
 */
export async function verifyDocument(
  documentId: string,
  verified: boolean,
  rejectionReason?: string
): Promise<boolean> {
  try {
    const updateData: any = {
      verified,
      verified_at: verified ? new Date().toISOString() : null
    };

    if (!verified && rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    const { error } = await supabase
      .from('registration_documents')
      .update(updateData)
      .eq('id', documentId);

    return !error;
  } catch (error) {
    console.error('Error verifying document:', error);
    return false;
  }
}

/**
 * Delete a registration (admin only - hard delete)
 * Note: Prefer archiveRegistration for soft delete (compliance)
 */
export async function deleteRegistration(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('id', id);

    return !error;
  } catch (error) {
    console.error('Error deleting registration:', error);
    return false;
  }
}

/**
 * Get registrations by stage filter
 */
export async function getRegistrationsByStage(
  stage: RegistrationStageKey
): Promise<Registration[]> {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('current_stage', stage)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching registrations by stage:', error);
      return [];
    }

    return (data || []).map(transformRegistration);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return [];
  }
}

/**
 * Get registrations that are rejected and need resubmission
 */
export async function getRejectedRegistrations(): Promise<Registration[]> {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('current_stage', 'rejected')
      .eq('is_archived', false)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching rejected registrations:', error);
      return [];
    }

    return (data || []).map(transformRegistration);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return [];
  }
}

/**
 * Get registrations awaiting DMV (submitted or processing)
 */
export async function getRegistrationsAwaitingDMV(): Promise<Registration[]> {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .in('current_stage', ['submitted_to_dmv', 'dmv_processing'])
      .eq('is_archived', false)
      .order('submission_date', { ascending: true });

    if (error) {
      console.error('Error fetching DMV registrations:', error);
      return [];
    }

    return (data || []).map(transformRegistration);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return [];
  }
}

/**
 * Get registrations ready for sticker delivery
 */
export async function getRegistrationsReadyForDelivery(): Promise<Registration[]> {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('current_stage', 'sticker_ready')
      .eq('is_archived', false)
      .order('approval_date', { ascending: true });

    if (error) {
      console.error('Error fetching ready registrations:', error);
      return [];
    }

    return (data || []).map(transformRegistration);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return [];
  }
}

/**
 * Log a notification (for audit trail)
 */
export async function logNotification(input: {
  registrationId: string;
  notificationType: 'stage_complete' | 'action_required' | 'blocked' | 'ready_pickup';
  channel: 'sms' | 'email';
  recipient: string;
  message: string;
  triggeredBy?: 'admin_action' | 'auto' | 'system';
  delivered?: boolean;
  deliveryError?: string;
}): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('registration_notifications')
      .insert([{
        registration_id: input.registrationId,
        notification_type: input.notificationType,
        channel: input.channel,
        recipient: input.recipient,
        message: input.message,
        triggered_by: input.triggeredBy || 'system',
        delivered: input.delivered,
        delivery_error: input.deliveryError
      }]);

    return !error;
  } catch (error) {
    console.error('Error logging notification:', error);
    return false;
  }
}
