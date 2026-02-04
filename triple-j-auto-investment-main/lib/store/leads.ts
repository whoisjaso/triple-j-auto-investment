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

    setLeads(data || []);
    console.log(`✅ Loaded ${data?.length || 0} leads from Supabase`);
  } catch (error) {
    console.error('Unexpected error loading leads:', error);
  }
}

// --- ADD LEAD TO SUPABASE ---
export async function addLead(lead: Lead): Promise<void> {
  try {
    const { error } = await supabase
      .from('leads')
      .insert([{
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        interest: lead.interest,
        status: lead.status || 'New',
        date: lead.date || new Date().toISOString(),
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
