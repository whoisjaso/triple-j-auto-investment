// services/followUpService.ts
// Manages the auto-nurture pipeline state from the frontend perspective
import { supabase } from '../supabase/config';
import { FollowUpQueueItem } from '../types';

// ============================================================
// TRANSFORMER
// ============================================================
function transformQueueItem(row: any): FollowUpQueueItem {
  return {
    id: row.id,
    leadId: row.lead_id,
    stepKey: row.step_key,
    templateKey: row.template_key,
    channel: row.channel,
    sendAfter: row.send_after,
    sent: row.sent,
    sentAt: row.sent_at,
    cancelled: row.cancelled,
    cancelledReason: row.cancelled_reason,
    error: row.error,
    createdAt: row.created_at,
  };
}

// ============================================================
// FOLLOW-UP QUEUE QUERIES
// ============================================================
export async function getFollowUpsForLead(leadId: string): Promise<FollowUpQueueItem[]> {
  const { data, error } = await supabase
    .from('follow_up_queue')
    .select('*')
    .eq('lead_id', leadId)
    .order('send_after');
  if (error) { console.error('Failed to fetch follow-ups:', error); return []; }
  return (data || []).map(transformQueueItem);
}

export async function getPendingFollowUps(limit: number = 50): Promise<FollowUpQueueItem[]> {
  const { data, error } = await supabase
    .from('follow_up_queue')
    .select('*')
    .eq('sent', false)
    .eq('cancelled', false)
    .order('send_after')
    .limit(limit);
  if (error) { console.error('Failed to fetch pending follow-ups:', error); return []; }
  return (data || []).map(transformQueueItem);
}

// ============================================================
// FOLLOW-UP ACTIONS
// ============================================================
export async function cancelFollowUps(leadId: string, reason: string): Promise<boolean> {
  const { error } = await supabase
    .from('follow_up_queue')
    .update({ cancelled: true, cancelled_reason: reason })
    .eq('lead_id', leadId)
    .eq('sent', false)
    .eq('cancelled', false);
  if (error) { console.error('Failed to cancel follow-ups:', error); return false; }
  return true;
}

export async function markLeadResponded(leadId: string): Promise<boolean> {
  const { error } = await supabase
    .from('leads')
    .update({ status: 'Engaged', responded_at: new Date().toISOString() })
    .eq('id', leadId);
  // Trigger will auto-cancel follow-ups
  if (error) { console.error('Failed to mark lead responded:', error); return false; }
  return true;
}

export async function scheduleVisit(
  leadId: string, visitAt: string, notes?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('leads')
    .update({
      status: 'Scheduled',
      scheduled_visit_at: visitAt,
      visit_notes: notes || null,
    })
    .eq('id', leadId);
  // Trigger will auto-cancel follow-ups
  if (error) { console.error('Failed to schedule visit:', error); return false; }
  return true;
}

// ============================================================
// PIPELINE STATS (for Command Center)
// ============================================================
export async function getPipelineStats(): Promise<{
  inNurture: number;
  engaged: number;
  scheduled: number;
  cold: number;
}> {
  const { data, error } = await supabase
    .from('leads')
    .select('status')
    .in('status', ['New', 'Contacted', 'Engaged', 'Scheduled', 'Cold']);

  if (error || !data) return { inNurture: 0, engaged: 0, scheduled: 0, cold: 0 };

  return {
    inNurture: data.filter(l => l.status === 'New' || l.status === 'Contacted').length,
    engaged: data.filter(l => l.status === 'Engaged').length,
    scheduled: data.filter(l => l.status === 'Scheduled').length,
    cold: data.filter(l => l.status === 'Cold').length,
  };
}
