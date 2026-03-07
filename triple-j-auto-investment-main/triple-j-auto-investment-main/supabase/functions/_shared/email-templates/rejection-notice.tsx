// Rich HTML email template for registration rejection notifications
// Uses template literals for HTML (no JSX runtime needed in Deno)

interface RejectionEmailParams {
  customerName: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  rejectionNotes?: string;
  trackingUrl: string;
  unsubscribeUrl: string;
}

export function renderRejectionEmail(params: RejectionEmailParams): string {
  const {
    customerName,
    vehicleYear,
    vehicleMake,
    vehicleModel,
    rejectionNotes,
    trackingUrl,
    unsubscribeUrl,
  } = params;

  const rejectionNotesHtml = rejectionNotes
    ? `
      <div style="
        background-color:#2a1a1a;
        border:1px solid #8B3A3A;
        border-radius:6px;
        padding:16px 20px;
        margin:20px 0;
      ">
        <div style="
          font-size:12px;
          color:#cc6666;
          text-transform:uppercase;
          letter-spacing:1px;
          margin-bottom:8px;
        ">DMV Notes</div>
        <div style="
          font-size:14px;
          color:#e0c0c0;
          line-height:1.5;
        ">${rejectionNotes}</div>
      </div>
    `
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Attention Required - Registration</title>
</head>
<body style="margin:0;padding:0;background-color:#111;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#111;">
    <tr>
      <td align="center" style="padding:20px 10px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="
          background-color:#1a1a1a;
          border:1px solid #333;
          border-radius:8px;
          overflow:hidden;
        ">
          <!-- Header -->
          <tr>
            <td style="
              background-color:#1a1a1a;
              border-bottom:2px solid #C9A84C;
              padding:24px 30px;
              text-align:center;
            ">
              <div style="
                font-size:22px;
                font-weight:bold;
                color:#C9A84C;
                letter-spacing:2px;
                text-transform:uppercase;
              ">Triple J Auto Investment</div>
              <div style="
                font-size:12px;
                color:#888;
                margin-top:4px;
                letter-spacing:1px;
              ">Registration Notice</div>
            </td>
          </tr>

          <!-- Attention Required Banner -->
          <tr>
            <td style="
              background-color:#3a1a1a;
              border-bottom:1px solid #8B3A3A;
              padding:16px 30px;
              text-align:center;
            ">
              <div style="
                font-size:18px;
                font-weight:bold;
                color:#ff6b6b;
                letter-spacing:1px;
              ">Attention Required</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px;">
              <!-- Greeting -->
              <div style="
                font-size:16px;
                color:#e0e0e0;
                margin-bottom:20px;
              ">Hi ${customerName},</div>

              <!-- Vehicle Info -->
              <div style="
                font-size:15px;
                color:#ccc;
                margin-bottom:20px;
                line-height:1.5;
              ">Your registration for the
                <strong style="color:#fff;">${vehicleYear} ${vehicleMake} ${vehicleModel}</strong>
                was returned by the DMV for corrections.
                <strong style="color:#e0e0e0;">Our team at Triple J is addressing this.</strong>
              </div>

              ${rejectionNotesHtml}

              <!-- What Happens Next -->
              <div style="
                background-color:#222;
                border:1px solid #444;
                border-radius:6px;
                padding:20px;
                margin:24px 0;
              ">
                <div style="
                  font-size:14px;
                  font-weight:bold;
                  color:#C9A84C;
                  margin-bottom:10px;
                ">What happens next?</div>
                <div style="
                  font-size:14px;
                  color:#ccc;
                  line-height:1.6;
                ">
                  Our team will correct the submission and resubmit to the DMV.
                  You'll receive another update when we do.
                  No action is needed from you at this time.
                </div>
              </div>

              <!-- Contact -->
              <div style="
                background-color:#222;
                border:1px solid #444;
                border-radius:6px;
                padding:16px 20px;
                margin-bottom:24px;
                text-align:center;
              ">
                <div style="
                  font-size:14px;
                  color:#ccc;
                ">Questions? Call us at
                  <strong style="color:#C9A84C;">(832) 400-9760</strong>
                </div>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center;margin:30px 0;">
                <a href="${trackingUrl}" style="
                  display:inline-block;
                  background-color:#C9A84C;
                  color:#1a1a1a;
                  font-size:15px;
                  font-weight:bold;
                  padding:14px 32px;
                  border-radius:6px;
                  text-decoration:none;
                  letter-spacing:0.5px;
                ">View Full Status</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="
              background-color:#151515;
              border-top:1px solid #333;
              padding:24px 30px;
            ">
              <div style="
                font-size:13px;
                color:#888;
                text-align:center;
                line-height:1.6;
              ">
                <strong style="color:#C9A84C;">Triple J Auto Investment</strong><br>
                Texas Dealer License: P171632<br>
                8774 Almeda Genoa Road, Houston, TX 77075<br>
                (832) 400-9760
              </div>

              <div style="
                font-size:11px;
                color:#666;
                text-align:center;
                margin-top:16px;
                line-height:1.5;
              ">
                <a href="${unsubscribeUrl}" style="color:#888;text-decoration:underline;">Unsubscribe</a>
                from registration notifications.<br>
                You'll still receive verification codes when logging in.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
