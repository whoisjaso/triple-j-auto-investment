// Twilio SMS helper for Supabase Edge Functions
// Uses Twilio REST API directly via fetch() - no SDK needed

interface SendSmsResult {
  success: boolean;
  sid?: string;
  error?: string;
}

/**
 * Send an SMS message via the Twilio REST API.
 *
 * Required Deno env vars:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_PHONE_NUMBER  (E.164 format, e.g. +18325551234)
 */
export async function sendSms(to: string, body: string): Promise<SendSmsResult> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!accountSid || !authToken || !fromNumber) {
    const missing = [
      !accountSid && 'TWILIO_ACCOUNT_SID',
      !authToken && 'TWILIO_AUTH_TOKEN',
      !fromNumber && 'TWILIO_PHONE_NUMBER',
    ].filter(Boolean).join(', ');
    console.error(`[twilio] Missing env vars: ${missing}`);
    return { success: false, error: `Missing env vars: ${missing}` };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: fromNumber,
        Body: body,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`[twilio] SMS sent to ${to}, SID: ${data.sid}`);
      return { success: true, sid: data.sid };
    } else {
      const errorMsg = data.message || data.error_message || 'Unknown Twilio error';
      console.error(`[twilio] SMS failed to ${to}: ${errorMsg} (status ${data.status})`);
      return { success: false, error: errorMsg };
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[twilio] Network error sending SMS to ${to}: ${errorMsg}`);
    return { success: false, error: `Network error: ${errorMsg}` };
  }
}
