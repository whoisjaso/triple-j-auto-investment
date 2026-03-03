// services/templateService.ts
import { supabase } from '../supabase/config';
import { MessageTemplate, TemplateCategory, SentMessage } from '../types';

// ============================================================
// TRANSFORMERS
// ============================================================
function transformTemplate(row: any): MessageTemplate {
  return {
    id: row.id,
    category: row.category,
    channel: row.channel,
    templateKey: row.template_key,
    language: row.language,
    subject: row.subject,
    body: row.body,
    variables: row.variables || [],
    isApproved: row.is_approved,
    autoSend: row.auto_send,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function transformSentMessage(row: any): SentMessage {
  return {
    id: row.id,
    templateId: row.template_id,
    templateKey: row.template_key,
    channel: row.channel,
    recipient: row.recipient,
    subject: row.subject,
    body: row.body,
    entityType: row.entity_type,
    entityId: row.entity_id,
    status: row.status,
    providerMessageId: row.provider_message_id,
    error: row.error,
    sentAt: row.sent_at,
    createdAt: row.created_at,
  };
}

// ============================================================
// TEMPLATE CRUD
// ============================================================
export async function getAllTemplates(): Promise<MessageTemplate[]> {
  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .order('category')
    .order('sort_order');
  if (error) { console.error('Failed to fetch templates:', error); return []; }
  return (data || []).map(transformTemplate);
}

export async function getTemplatesByCategory(category: TemplateCategory): Promise<MessageTemplate[]> {
  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .eq('category', category)
    .order('sort_order');
  if (error) { console.error('Failed to fetch templates:', error); return []; }
  return (data || []).map(transformTemplate);
}

export async function getTemplateByKey(templateKey: string, language: string = 'en'): Promise<MessageTemplate | null> {
  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .eq('template_key', templateKey)
    .eq('language', language)
    .single();
  if (error) return null;
  return transformTemplate(data);
}

export async function updateTemplate(
  id: string,
  updates: { body?: string; subject?: string; isApproved?: boolean; autoSend?: boolean }
): Promise<boolean> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.body !== undefined) dbUpdates.body = updates.body;
  if (updates.subject !== undefined) dbUpdates.subject = updates.subject;
  if (updates.isApproved !== undefined) dbUpdates.is_approved = updates.isApproved;
  if (updates.autoSend !== undefined) dbUpdates.auto_send = updates.autoSend;

  const { error } = await supabase
    .from('message_templates')
    .update(dbUpdates)
    .eq('id', id);
  if (error) { console.error('Failed to update template:', error); return false; }
  return true;
}

// ============================================================
// TEMPLATE RENDERING
// ============================================================
export function renderTemplate(body: string, variables: Record<string, string>): string {
  let rendered = body;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return rendered;
}

// ============================================================
// SENT MESSAGES
// ============================================================
export async function getSentMessages(
  entityType?: string,
  entityId?: string,
  limit: number = 50
): Promise<SentMessage[]> {
  let query = supabase
    .from('sent_messages')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(limit);

  if (entityType) query = query.eq('entity_type', entityType);
  if (entityId) query = query.eq('entity_id', entityId);

  const { data, error } = await query;
  if (error) { console.error('Failed to fetch sent messages:', error); return []; }
  return (data || []).map(transformSentMessage);
}

export async function getRecentCommunications(limit: number = 20): Promise<SentMessage[]> {
  const { data, error } = await supabase
    .from('sent_messages')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('Failed to fetch communications:', error); return []; }
  return (data || []).map(transformSentMessage);
}
