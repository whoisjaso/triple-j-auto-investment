// Retell AI Outbound Call Service
// Triggers AI voice agent calls when leads submit inquiry forms

const RETELL_API_KEY = import.meta.env.VITE_RETELL_API_KEY || 'key_86a41f8fad555c03e879a71d0398';
const RETELL_AGENT_ID = import.meta.env.VITE_RETELL_AGENT_ID || 'agent_529f92f821400a850b63de5d71';
const RETELL_FROM_NUMBER = import.meta.env.VITE_RETELL_FROM_NUMBER || '+18324009760';

interface RetellCallParams {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vehicleInterest?: string;
}

interface RetellCallResponse {
  success: boolean;
  callId?: string;
  error?: string;
}

/**
 * Triggers an outbound AI voice call to a customer using Retell AI
 * This is called after a lead submits an inquiry form
 */
export const triggerRetellOutboundCall = async (params: RetellCallParams): Promise<RetellCallResponse> => {
  const { customerName, customerPhone, customerEmail, vehicleInterest } = params;

  // Validate phone number format
  const cleanPhone = customerPhone.replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    console.warn('Retell AI: Invalid phone number format');
    return { success: false, error: 'Invalid phone number format' };
  }

  // Format phone number with country code
  const formattedPhone = cleanPhone.length === 10 ? `+1${cleanPhone}` : `+${cleanPhone}`;

  try {
    console.log('Retell AI: Initiating outbound call to', formattedPhone);

    const response = await fetch('https://api.retellai.com/v2/create-phone-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RETELL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from_number: RETELL_FROM_NUMBER,
        to_number: formattedPhone,
        agent_id: RETELL_AGENT_ID,
        retell_llm_dynamic_variables: {
          customer_name: customerName,
          customer_email: customerEmail,
          vehicle_interest: vehicleInterest || 'General Inquiry',
          dealership_name: 'Triple J Auto Investment',
          timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })
        },
        metadata: {
          source: 'website_inquiry',
          customer_email: customerEmail,
          inquiry_type: vehicleInterest?.includes('Financing') ? 'financing' : 'general'
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Retell AI: API error', response.status, errorData);
      return {
        success: false,
        error: errorData.message || `API error: ${response.status}`
      };
    }

    const data = await response.json();
    console.log('Retell AI: Call initiated successfully', data.call_id);

    return {
      success: true,
      callId: data.call_id
    };

  } catch (error) {
    console.error('Retell AI: Failed to initiate call', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Check if Retell AI is configured
 */
export const isRetellConfigured = (): boolean => {
  return Boolean(RETELL_API_KEY && RETELL_AGENT_ID && RETELL_FROM_NUMBER);
};

export default {
  triggerRetellOutboundCall,
  isRetellConfigured
};
