import React from 'react';
import { supabase } from '../../supabase/config';
import { Lead } from '../../types';
import { sendLeadNotification } from '../../services/emailService';

// --- LOAD LEADS FROM SUPABASE ---
export async function loadLeads(
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>
): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Failed to load leads:', error);
      return;
    }

    const transformed = (data || []).map((row: any) => ({
      ...row,
      // Phase 15: Engagement Spectrum (snake_case -> camelCase)
      vehicleId: row.vehicle_id || undefined,
      actionType: row.action_type || undefined,
      commitmentLevel: row.commitment_level != null ? row.commitment_level : undefined,
      message: row.message || undefined,
      // Phase 16: Attribution (snake_case -> camelCase)
      sessionId: row.session_id || undefined,
      pagePath: row.page_path || undefined,
      referrer: row.referrer || undefined,
      utmSource: row.utm_source || undefined,
      utmMedium: row.utm_medium || undefined,
      utmCampaign: row.utm_campaign || undefined,
      deviceType: row.device_type || undefined,
    }));
    setLeads(transformed);
    console.log(`✅ Loaded ${data?.length || 0} leads from Supabase`);
  } catch (error) {
    console.error('Unexpected error loading leads:', error);
  }
}

// --- ADD LEAD TO SUPABASE ---
export async function addLead(lead: Lead): Promise<void> {
  try {
    // Phase 16: Auto-fill attribution if not provided by caller
    if (!lead.sessionId) {
      const { captureAttribution } = await import('../../services/attributionService');
      const attr = captureAttribution();
      lead = {
        ...lead,
        sessionId: attr.session_id,
        pagePath: attr.page_path,
        referrer: attr.referrer,
        utmSource: attr.utm_source,
        utmMedium: attr.utm_medium,
        utmCampaign: attr.utm_campaign,
        deviceType: attr.device_type,
      };
    }

    const { error } = await supabase
      .from('leads')
      .insert([{
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        interest: lead.interest,
        status: lead.status || 'New',
        date: lead.date || new Date().toISOString(),
        // Phase 15: Engagement Spectrum
        vehicle_id: lead.vehicleId || null,
        action_type: lead.actionType || null,
        commitment_level: lead.commitmentLevel ?? null,
        message: lead.message || null,
        // Phase 16: Attribution
        session_id: lead.sessionId || null,
        page_path: lead.pagePath || null,
        referrer: lead.referrer || null,
        utm_source: lead.utmSource || null,
        utm_medium: lead.utmMedium || null,
        utm_campaign: lead.utmCampaign || null,
        device_type: lead.deviceType || null,
      }]);

    if (error) {
      console.error('Failed to add lead:', error);
      alert('Failed to save lead. Please check console for details.');
      return;
    }

    console.log('✅ Lead added successfully');

    // Send email notification asynchronously (non-blocking)
    try {
      await sendLeadNotification({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        interest: lead.interest
      });
    } catch (emailError) {
      console.error('Email notification failed, but lead was saved:', emailError);
    }

    // Note: Retell AI outbound call is triggered from Inventory.tsx with full vehicle context
    // This addLead function only saves the lead to database
  } catch (error) {
    console.error('Unexpected error adding lead:', error);
    alert('Failed to add lead. Please try again.');
  }
}
