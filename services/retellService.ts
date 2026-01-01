/**
 * Retell AI Voice Agent Integration Service
 * Handles outbound call triggers for vehicle inquiries
 *
 * Divine - Outbound Appointment Setter
 * Calls customers who submit inquiry forms with full vehicle context
 *
 * Dynamic Variables Passed to Divine:
 * - {{customer_name}} - Personalized greeting
 * - {{vehicle_full}} - "2019 Audi A6" format
 * - {{vehicle_price}}, {{vehicle_condition}}, {{vehicle_status}}
 */

interface VehicleInquiryPayload {
  customer_name: string;
  phone_number: string;
  email?: string;
  vehicle_year: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_full: string;
  vehicle_price: string;
  vehicle_condition: string;
  vehicle_status: string;
  vehicle_id: string;
  inquiry_source: string;
  inquiry_timestamp: string;
}

interface RetellCallResponse {
  success: boolean;
  callId?: string;
  error?: string;
}

// Retell AI Credentials from environment variables
const RETELL_API_KEY = import.meta.env.VITE_RETELL_API_KEY || '';
const RETELL_OUTBOUND_AGENT_ID = import.meta.env.VITE_RETELL_OUTBOUND_AGENT_ID || '';
const RETELL_OUTBOUND_NUMBER = import.meta.env.VITE_RETELL_OUTBOUND_NUMBER || '';

/**
 * Triggers an outbound call via Retell AI
 * Divine will call the customer about their vehicle inquiry with full context
 */
export async function triggerOutboundCall(payload: VehicleInquiryPayload): Promise<RetellCallResponse> {
  // Validate credentials are configured
  if (!RETELL_API_KEY || !RETELL_OUTBOUND_AGENT_ID || !RETELL_OUTBOUND_NUMBER) {
    console.error('Retell AI credentials not configured. Check VITE_RETELL_* environment variables.');
    return {
      success: false,
      error: 'Call service not configured. Please call us directly at (832) 400-9760'
    };
  }

  try {
    const response = await fetch('https://api.retellai.com/v2/create-phone-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RETELL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agent_id: RETELL_OUTBOUND_AGENT_ID,
        to_number: payload.phone_number,
        from_number: RETELL_OUTBOUND_NUMBER,
        retell_llm_dynamic_variables: {
          customer_name: payload.customer_name,
          phone_number: payload.phone_number,
          email: payload.email || '',
          vehicle_year: payload.vehicle_year,
          vehicle_make: payload.vehicle_make,
          vehicle_model: payload.vehicle_model,
          vehicle_full: payload.vehicle_full,
          vehicle_price: payload.vehicle_price,
          vehicle_condition: payload.vehicle_condition,
          vehicle_status: payload.vehicle_status,
          inquiry_source: payload.inquiry_source
        },
        metadata: {
          vehicle_id: payload.vehicle_id,
          inquiry_timestamp: payload.inquiry_timestamp,
          source: 'website_inventory'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Retell API error:', errorText);
      throw new Error(`Retell API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Retell call initiated:', data);

    return {
      success: true,
      callId: data.call_id
    };
  } catch (error) {
    console.error('Retell call trigger failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get call status from Retell AI
 */
export async function getCallStatus(callId: string): Promise<any> {
  try {
    const response = await fetch(`https://api.retellai.com/v2/get-call/${callId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RETELL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get call status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get call status:', error);
    return null;
  }
}

/**
 * List recent calls from Retell AI
 */
export async function listRecentCalls(limit: number = 10): Promise<any[]> {
  try {
    const response = await fetch(`https://api.retellai.com/v2/list-calls?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RETELL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to list calls: ${response.status}`);
    }

    const data = await response.json();
    return data.calls || [];
  } catch (error) {
    console.error('Failed to list calls:', error);
    return [];
  }
}
