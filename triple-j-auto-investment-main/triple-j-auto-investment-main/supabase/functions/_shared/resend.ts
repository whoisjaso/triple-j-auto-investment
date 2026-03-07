// Resend email helper for Supabase Edge Functions
// Uses Resend REST API directly via fetch() - no SDK needed

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

const DEFAULT_FROM = 'Triple J Auto Investment <notifications@triplejautoinvestment.com>';

/**
 * Send an email via the Resend REST API.
 *
 * Required Deno env var:
 *   RESEND_API_KEY
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = Deno.env.get('RESEND_API_KEY');

  if (!apiKey) {
    console.error('[resend] Missing env var: RESEND_API_KEY');
    return { success: false, error: 'Missing env var: RESEND_API_KEY' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: params.from || DEFAULT_FROM,
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`[resend] Email sent to ${params.to}, ID: ${data.id}`);
      return { success: true, id: data.id };
    } else {
      const errorMsg = data.message || data.error?.message || 'Unknown Resend error';
      console.error(`[resend] Email failed to ${params.to}: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[resend] Network error sending email to ${params.to}: ${errorMsg}`);
    return { success: false, error: `Network error: ${errorMsg}` };
  }
}
