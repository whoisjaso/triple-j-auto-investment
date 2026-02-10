/**
 * Notification Service
 * Provides notification history retrieval and preference management
 * for the admin UI and customer portal.
 *
 * Phase 04-03: Customer Portal - Notifications & Login
 */

import { supabase } from '../supabase/config';
import { RegistrationNotification, NotificationPreference } from '../types';

// ================================================================
// DATA TRANSFORMERS
// ================================================================

/**
 * Transform database row to RegistrationNotification interface
 * Maps snake_case DB columns to camelCase TypeScript properties
 */
const transformNotification = (data: any): RegistrationNotification => ({
  id: data.id,
  registrationId: data.registration_id,
  notificationType: data.notification_type,
  channel: data.channel,
  recipient: data.recipient,
  message: data.message,
  sentAt: data.sent_at,
  delivered: data.delivered,
  deliveryError: data.delivery_error,
  triggeredBy: data.triggered_by,
  oldStage: data.old_stage,
  newStage: data.new_stage,
  subject: data.subject,
  templateUsed: data.template_used,
  providerMessageId: data.provider_message_id,
  createdAt: data.created_at
});

// ================================================================
// PUBLIC API
// ================================================================

/**
 * Fetch notification history for a registration
 * Returns entries sorted by most recent first
 */
export async function getNotificationHistory(
  registrationId: string
): Promise<RegistrationNotification[]> {
  try {
    const { data, error } = await supabase
      .from('registration_notifications')
      .select('*')
      .eq('registration_id', registrationId)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('Error fetching notification history:', error);
      return [];
    }

    return (data || []).map(transformNotification);
  } catch (error) {
    console.error('Error fetching notification history:', error);
    return [];
  }
}

/**
 * Update notification preference for a registration
 * Controls how the customer receives notifications (sms/email/both/none)
 */
export async function updateNotificationPreference(
  registrationId: string,
  pref: NotificationPreference
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('registrations')
      .update({
        notification_pref: pref,
        updated_at: new Date().toISOString()
      })
      .eq('id', registrationId);

    if (error) {
      console.error('Error updating notification preference:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating notification preference:', error);
    return false;
  }
}

/**
 * Get notification preference for a registration
 * Returns the preference or null if not found
 */
export async function getNotificationPreference(
  registrationId: string
): Promise<NotificationPreference | null> {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('notification_pref')
      .eq('id', registrationId)
      .single();

    if (error || !data) {
      console.error('Error fetching notification preference:', error);
      return null;
    }

    return (data.notification_pref as NotificationPreference) ?? 'both';
  } catch (error) {
    console.error('Error fetching notification preference:', error);
    return null;
  }
}
