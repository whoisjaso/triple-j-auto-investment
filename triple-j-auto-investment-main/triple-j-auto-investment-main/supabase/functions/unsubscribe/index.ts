// Unsubscribe Edge Function - Supabase Edge Function
// Handles one-click email unsubscribe for registration notifications.
// URL: GET /functions/v1/unsubscribe?reg={registrationId}&token={accessToken}

import { createClient } from 'npm:@supabase/supabase-js@2';

// ---------------------------------------------------------------------------
// HTML response helpers
// ---------------------------------------------------------------------------

function htmlResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function renderPage(title: string, content: string, trackingUrl?: string): string {
  const trackingLink = trackingUrl
    ? `<a href="${trackingUrl}" style="
        display:inline-block;
        margin-top:24px;
        color:#C9A84C;
        text-decoration:underline;
        font-size:14px;
      ">Return to tracking page</a>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Triple J Auto Investment</title>
</head>
<body style="
  margin:0;
  padding:0;
  background-color:#111;
  font-family:Georgia,'Times New Roman',serif;
  min-height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
">
  <div style="
    max-width:480px;
    margin:40px 20px;
    background-color:#1a1a1a;
    border:1px solid #333;
    border-radius:8px;
    overflow:hidden;
    text-align:center;
  ">
    <!-- Header -->
    <div style="
      border-bottom:2px solid #C9A84C;
      padding:20px 24px;
    ">
      <div style="
        font-size:18px;
        font-weight:bold;
        color:#C9A84C;
        letter-spacing:2px;
        text-transform:uppercase;
      ">Triple J Auto Investment</div>
    </div>

    <!-- Content -->
    <div style="padding:32px 24px;">
      ${content}
      ${trackingLink}
    </div>

    <!-- Footer -->
    <div style="
      border-top:1px solid #333;
      padding:16px 24px;
      background-color:#151515;
    ">
      <div style="
        font-size:12px;
        color:#666;
        line-height:1.5;
      ">
        (832) 400-9760<br>
        8774 Almeda Genoa Road, Houston, TX 77075
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const registrationId = url.searchParams.get('reg');
    const accessToken = url.searchParams.get('token');

    // Validate params
    if (!registrationId || !accessToken) {
      return htmlResponse(
        renderPage(
          'Invalid Link',
          `<div style="font-size:16px;color:#ff6b6b;margin-bottom:12px;">Invalid or expired link.</div>
           <div style="font-size:14px;color:#888;line-height:1.5;">
             The unsubscribe link is missing required parameters.<br>
             If you need help, call <strong style="color:#C9A84C;">(832) 400-9760</strong>.
           </div>`,
        ),
        400,
      );
    }

    // Create Supabase client with service role (admin access for update)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[unsubscribe] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return htmlResponse(
        renderPage(
          'Error',
          `<div style="font-size:16px;color:#ff6b6b;margin-bottom:12px;">Something went wrong.</div>
           <div style="font-size:14px;color:#888;line-height:1.5;">
             Please try again or call <strong style="color:#C9A84C;">(832) 400-9760</strong>.
           </div>`,
        ),
        500,
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify registration exists and token matches
    const { data: registration, error: fetchError } = await supabase
      .from('registrations')
      .select('id, order_id, access_token')
      .eq('id', registrationId)
      .eq('access_token', accessToken)
      .single();

    if (fetchError || !registration) {
      console.warn(`[unsubscribe] Invalid token for reg ${registrationId}: ${fetchError?.message || 'not found'}`);
      return htmlResponse(
        renderPage(
          'Invalid Link',
          `<div style="font-size:16px;color:#ff6b6b;margin-bottom:12px;">Invalid or expired link.</div>
           <div style="font-size:14px;color:#888;line-height:1.5;">
             This unsubscribe link is no longer valid.<br>
             If you need help, call <strong style="color:#C9A84C;">(832) 400-9760</strong>.
           </div>`,
        ),
        400,
      );
    }

    // Update notification preference to 'none'
    const { error: updateError } = await supabase
      .from('registrations')
      .update({ notification_pref: 'none' })
      .eq('id', registrationId);

    if (updateError) {
      console.error(`[unsubscribe] Failed to update pref for ${registrationId}: ${updateError.message}`);
      return htmlResponse(
        renderPage(
          'Error',
          `<div style="font-size:16px;color:#ff6b6b;margin-bottom:12px;">Something went wrong.</div>
           <div style="font-size:14px;color:#888;line-height:1.5;">
             Please try again or call <strong style="color:#C9A84C;">(832) 400-9760</strong>.
           </div>`,
        ),
        500,
      );
    }

    // Build tracking URL for the "back" link
    const baseUrl =
      Deno.env.get('PUBLIC_SITE_URL') ||
      supabaseUrl.replace('.supabase.co', '.vercel.app') ||
      'https://triplejautoinvestment.com';
    const trackingUrl = `${baseUrl}/track/${registration.order_id}-${registration.access_token}`;

    console.log(`[unsubscribe] Registration ${registrationId} unsubscribed successfully`);

    return htmlResponse(
      renderPage(
        'Unsubscribed',
        `<div style="font-size:18px;color:#C9A84C;margin-bottom:16px;">Unsubscribed</div>
         <div style="font-size:15px;color:#e0e0e0;margin-bottom:16px;line-height:1.5;">
           You have been unsubscribed from Triple J Auto Investment registration notifications.
         </div>
         <div style="font-size:14px;color:#aaa;line-height:1.5;">
           You will no longer receive SMS or email updates for this registration.
           If you change your mind, you can update your preferences from your tracking page.
         </div>
         <div style="
           font-size:12px;
           color:#888;
           margin-top:20px;
           padding-top:16px;
           border-top:1px solid #333;
           line-height:1.5;
         ">You'll still receive verification codes when logging in.</div>`,
        trackingUrl,
      ),
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[unsubscribe] Fatal error: ${errMsg}`);
    return htmlResponse(
      renderPage(
        'Error',
        `<div style="font-size:16px;color:#ff6b6b;margin-bottom:12px;">Something went wrong.</div>
         <div style="font-size:14px;color:#888;line-height:1.5;">
           Please try again or call <strong style="color:#C9A84C;">(832) 400-9760</strong>.
         </div>`,
      ),
      500,
    );
  }
});
