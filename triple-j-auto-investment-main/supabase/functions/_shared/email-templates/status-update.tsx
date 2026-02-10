// Rich HTML email template for registration status update notifications
// Uses template literals for HTML (no JSX runtime needed in Deno)

interface StatusUpdateEmailParams {
  customerName: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  currentStage: string;
  stageLabel: string;
  stageDescription: string;
  stageOrder: number;
  trackingUrl: string;
  unsubscribeUrl: string;
}

const STAGES = [
  { key: 'sale_complete', label: 'Sale Complete', order: 1 },
  { key: 'documents_collected', label: 'Documents Collected', order: 2 },
  { key: 'submitted_to_dmv', label: 'Submitted to DMV', order: 3 },
  { key: 'dmv_processing', label: 'DMV Processing', order: 4 },
  { key: 'sticker_ready', label: 'Sticker Ready', order: 5 },
  { key: 'sticker_delivered', label: 'Sticker Delivered', order: 6 },
];

function renderProgressBar(currentOrder: number): string {
  const cells = STAGES.map((stage) => {
    const isCompleted = stage.order < currentOrder;
    const isCurrent = stage.order === currentOrder;

    let bgColor = '#2a2a2a'; // future - dark gray
    let borderColor = '#444';
    let textColor = '#666';

    if (isCompleted) {
      bgColor = '#C9A84C'; // gold - completed
      borderColor = '#C9A84C';
      textColor = '#C9A84C';
    } else if (isCurrent) {
      bgColor = '#1a1a1a'; // outlined current
      borderColor = '#C9A84C';
      textColor = '#C9A84C';
    }

    return `
      <td style="width:16.66%;padding:0 2px;vertical-align:top;">
        <div style="
          height:8px;
          background:${bgColor};
          border:2px solid ${borderColor};
          border-radius:4px;
        "></div>
        <div style="
          font-size:10px;
          color:${textColor};
          text-align:center;
          margin-top:4px;
          line-height:1.2;
        ">${stage.label}</div>
      </td>
    `;
  });

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <tr>${cells.join('')}</tr>
    </table>
  `;
}

export function renderStatusUpdateEmail(params: StatusUpdateEmailParams): string {
  const {
    customerName,
    vehicleYear,
    vehicleMake,
    vehicleModel,
    stageLabel,
    stageDescription,
    stageOrder,
    trackingUrl,
    unsubscribeUrl,
  } = params;

  const progressBar = renderProgressBar(stageOrder);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registration Update</title>
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
              ">Registration Status Update</div>
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

              <div style="
                font-size:15px;
                color:#ccc;
                margin-bottom:24px;
                line-height:1.5;
              ">Your registration for the
                <strong style="color:#fff;">${vehicleYear} ${vehicleMake} ${vehicleModel}</strong>
                has been updated.
              </div>

              <!-- Current Stage Banner -->
              <div style="
                background-color:#222;
                border:1px solid #C9A84C;
                border-radius:6px;
                padding:16px 20px;
                margin-bottom:24px;
                text-align:center;
              ">
                <div style="
                  font-size:12px;
                  color:#888;
                  text-transform:uppercase;
                  letter-spacing:1px;
                  margin-bottom:6px;
                ">Current Stage</div>
                <div style="
                  font-size:20px;
                  font-weight:bold;
                  color:#C9A84C;
                ">${stageLabel}</div>
                <div style="
                  font-size:13px;
                  color:#aaa;
                  margin-top:8px;
                  line-height:1.4;
                ">${stageDescription}</div>
              </div>

              <!-- Progress Bar -->
              ${progressBar}

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
