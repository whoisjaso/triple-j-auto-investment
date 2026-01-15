/**
 * Registration Status Ledger Service
 * Handles all CRUD operations for registration tracking
 */

import { supabase } from '../supabase/config';
import {
  Registration,
  RegistrationStage,
  RegistrationStageKey,
  RegistrationStageStatus,
  RegistrationDocument,
  REGISTRATION_STAGES
} from '../types';
import { sendRegistrationNotification } from './emailService';

// ================================================================
// DATA TRANSFORMERS
// ================================================================

const transformRegistration = (data: any): Registration => ({
  id: data.id,
  orderId: data.order_id,
  vehicleId: data.vehicle_id,
  customerName: data.customer_name,
  customerEmail: data.customer_email,
  customerPhone: data.customer_phone,
  vin: data.vin,
  vehicleYear: data.vehicle_year,
  vehicleMake: data.vehicle_make,
  vehicleModel: data.vehicle_model,
  currentStage: data.current_stage,
  currentStatus: data.current_status,
  purchaseDate: data.purchase_date,
  createdAt: data.created_at,
  updatedAt: data.updated_at
});

const transformStage = (data: any): RegistrationStage => ({
  id: data.id,
  registrationId: data.registration_id,
  stageKey: data.stage_key,
  stageLabel: data.stage_label,
  stageOrder: data.stage_order,
  status: data.status,
  ownership: data.ownership,
  startedAt: data.started_at,
  completedAt: data.completed_at,
  blockedReason: data.blocked_reason,
  actionRequired: data.action_required,
  actionUrl: data.action_url,
  internalNotes: data.internal_notes,
  updatedBy: data.updated_by,
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

// ================================================================
// PUBLIC API: Customer-facing (uses order_id as auth)
// ================================================================

/**
 * Fetch a registration by order ID (public access for customer tracker)
 */
export async function getRegistrationByOrderId(orderId: string): Promise<Registration | null> {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('order_id', orderId.toUpperCase())
      .single();

    if (error || !data) {
      console.error('Registration not found:', error);
      return null;
    }

    const registration = transformRegistration(data);

    // Fetch stages
    const { data: stagesData, error: stagesError } = await supabase
      .from('registration_stages')
      .select('*')
      .eq('registration_id', data.id)
      .order('stage_order', { ascending: true });

    if (!stagesError && stagesData) {
      registration.stages = stagesData.map(transformStage);
    }

    return registration;
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
 */
export async function getAllRegistrations(): Promise<Registration[]> {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching registrations:', error);
      return [];
    }

    const registrations = (data || []).map(transformRegistration);

    // Fetch all stages in one query for efficiency
    const registrationIds = registrations.map(r => r.id);
    if (registrationIds.length > 0) {
      const { data: allStages } = await supabase
        .from('registration_stages')
        .select('*')
        .in('registration_id', registrationIds)
        .order('stage_order', { ascending: true });

      if (allStages) {
        const stagesByRegId = allStages.reduce((acc: Record<string, RegistrationStage[]>, stage) => {
          const regId = stage.registration_id;
          if (!acc[regId]) acc[regId] = [];
          acc[regId].push(transformStage(stage));
          return acc;
        }, {});

        registrations.forEach(reg => {
          reg.stages = stagesByRegId[reg.id] || [];
        });
      }
    }

    return registrations;
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

    const registration = transformRegistration(data);

    // Fetch stages
    const { data: stagesData } = await supabase
      .from('registration_stages')
      .select('*')
      .eq('registration_id', data.id)
      .order('stage_order', { ascending: true });

    if (stagesData) {
      registration.stages = stagesData.map(transformStage);
    }

    return registration;
  } catch (error) {
    console.error('Error fetching registration:', error);
    return null;
  }
}

/**
 * Create a new registration
 */
export async function createRegistration(input: {
  vehicleId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  vin: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
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

    // Create registration
    const { data, error } = await supabase
      .from('registrations')
      .insert([{
        order_id: orderId,
        vehicle_id: input.vehicleId || null,
        customer_name: input.customerName,
        customer_email: input.customerEmail || null,
        customer_phone: input.customerPhone || null,
        vin: input.vin.toUpperCase(),
        vehicle_year: input.vehicleYear,
        vehicle_make: input.vehicleMake,
        vehicle_model: input.vehicleModel,
        purchase_date: input.purchaseDate || new Date().toISOString(),
        current_stage: 'payment',
        current_status: 'complete'
      }])
      .select()
      .single();

    if (error || !data) {
      console.error('Error creating registration:', error);
      return null;
    }

    // Initialize all stages
    const { error: stagesError } = await supabase.rpc('initialize_registration_stages', {
      reg_id: data.id
    });

    if (stagesError) {
      console.error('Error initializing stages:', stagesError);
      // Continue anyway - stages can be created manually
    }

    return transformRegistration(data);
  } catch (error) {
    console.error('Error creating registration:', error);
    return null;
  }
}

/**
 * Send notification for a stage update
 */
async function sendStageNotification(
  registration: Registration,
  stageKey: RegistrationStageKey,
  status: RegistrationStageStatus,
  blockedReason?: string
): Promise<void> {
  // Only send if customer has email
  if (!registration.customerEmail) return;

  const stageConfig = REGISTRATION_STAGES.find(s => s.key === stageKey);
  if (!stageConfig) return;

  // Determine notification type and message
  let notificationType: 'stage_complete' | 'action_required' | 'blocked' | 'ready_pickup';
  let message: string;

  if (status === 'blocked') {
    notificationType = 'blocked';
    message = `We need your attention on your registration. ${blockedReason || 'Please contact us for more information.'}`;
  } else if (status === 'complete' && stageKey === 'ready') {
    notificationType = 'ready_pickup';
    message = 'Great news! Your registration is complete and your plates are ready for pickup. Please contact us to schedule a pickup time.';
  } else if (status === 'complete') {
    notificationType = 'stage_complete';
    message = `${stageConfig.label} has been completed. Your registration is moving forward.`;
  } else if (status === 'pending' && stageConfig.ownership === 'customer') {
    notificationType = 'action_required';
    message = `${stageConfig.description} ${stageConfig.actionRequiredText ? `Please ${stageConfig.actionRequiredText.toLowerCase()}.` : ''}`;
  } else {
    // Don't send notification for waiting status or dealer-owned pending stages
    return;
  }

  const trackerUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://triplejautoinvestment.com'}/#/track/${registration.orderId}`;

  try {
    await sendRegistrationNotification({
      customerName: registration.customerName,
      customerEmail: registration.customerEmail,
      orderId: registration.orderId,
      vehicleInfo: `${registration.vehicleYear} ${registration.vehicleMake} ${registration.vehicleModel}`,
      stageName: stageConfig.label,
      stageMessage: message,
      trackerUrl,
      notificationType
    });

    // Log the notification in database
    await logNotification({
      registrationId: registration.id,
      notificationType,
      channel: 'email',
      recipient: registration.customerEmail,
      message,
      triggeredBy: 'auto',
      delivered: true
    });
  } catch (error) {
    console.error('Failed to send stage notification:', error);
  }
}

/**
 * Update a registration stage status
 */
export async function updateStageStatus(
  registrationId: string,
  stageKey: RegistrationStageKey,
  status: RegistrationStageStatus,
  options?: {
    blockedReason?: string;
    internalNotes?: string;
    sendNotification?: boolean;
  }
): Promise<boolean> {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'pending' || status === 'complete') {
      if (!updateData.started_at) {
        updateData.started_at = new Date().toISOString();
      }
    }

    if (status === 'complete') {
      updateData.completed_at = new Date().toISOString();
    }

    if (status === 'blocked' && options?.blockedReason) {
      updateData.blocked_reason = options.blockedReason;
    } else if (status !== 'blocked') {
      updateData.blocked_reason = null;
    }

    if (options?.internalNotes !== undefined) {
      updateData.internal_notes = options.internalNotes;
    }

    const { error } = await supabase
      .from('registration_stages')
      .update(updateData)
      .eq('registration_id', registrationId)
      .eq('stage_key', stageKey);

    if (error) {
      console.error('Error updating stage:', error);
      return false;
    }

    // Update current stage on registration if this stage is now complete
    if (status === 'complete') {
      const stageConfig = REGISTRATION_STAGES.find(s => s.key === stageKey);
      const nextStageConfig = REGISTRATION_STAGES.find(s => s.key === stageKey);
      const currentIndex = REGISTRATION_STAGES.findIndex(s => s.key === stageKey);
      const nextStage = REGISTRATION_STAGES[currentIndex + 1];

      if (nextStage) {
        // Update registration's current stage to next stage
        await supabase
          .from('registrations')
          .update({
            current_stage: nextStage.key,
            current_status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', registrationId);

        // Set next stage to pending
        await supabase
          .from('registration_stages')
          .update({
            status: 'pending',
            started_at: new Date().toISOString()
          })
          .eq('registration_id', registrationId)
          .eq('stage_key', nextStage.key);
      } else {
        // Final stage complete - mark registration as complete
        await supabase
          .from('registrations')
          .update({
            current_stage: stageKey,
            current_status: 'complete',
            updated_at: new Date().toISOString()
          })
          .eq('id', registrationId);
      }
    }

    // Send notification if requested (default: true for important status changes)
    const shouldNotify = options?.sendNotification !== false;
    if (shouldNotify && (status === 'complete' || status === 'blocked' || (status === 'pending'))) {
      // Fetch the registration to get customer details
      const registration = await getRegistrationById(registrationId);
      if (registration) {
        // Fire and forget - don't block on notification
        sendStageNotification(registration, stageKey, status, options?.blockedReason).catch(err => {
          console.error('Notification failed but stage updated:', err);
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating stage:', error);
    return false;
  }
}

/**
 * Mark a stage as blocked
 */
export async function blockStage(
  registrationId: string,
  stageKey: RegistrationStageKey,
  reason: string
): Promise<boolean> {
  return updateStageStatus(registrationId, stageKey, 'blocked', { blockedReason: reason });
}

/**
 * Add internal notes to a stage
 */
export async function addStageNotes(
  registrationId: string,
  stageKey: RegistrationStageKey,
  notes: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('registration_stages')
      .update({
        internal_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('registration_id', registrationId)
      .eq('stage_key', stageKey);

    return !error;
  } catch (error) {
    console.error('Error adding notes:', error);
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
 * Delete a registration (admin only)
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
 * Get registrations by status filter
 */
export async function getRegistrationsByStatus(
  status: RegistrationStageStatus
): Promise<Registration[]> {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('current_status', status)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching registrations by status:', error);
      return [];
    }

    return (data || []).map(transformRegistration);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return [];
  }
}

/**
 * Get registrations requiring customer action
 */
export async function getRegistrationsRequiringAction(): Promise<Registration[]> {
  try {
    // Find registrations where current stage is customer-owned and status is pending
    const customerStages = REGISTRATION_STAGES
      .filter(s => s.ownership === 'customer')
      .map(s => s.key);

    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .in('current_stage', customerStages)
      .eq('current_status', 'pending')
      .order('updated_at', { ascending: true });

    if (error) {
      console.error('Error fetching action-required registrations:', error);
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
