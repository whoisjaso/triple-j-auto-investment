// Plate Alert Email & SMS Templates
// Template literal HTML (not React Email JSX) per Phase 4 decision.
// Sends a batched summary of all active plate alert conditions.

export interface PlateAlertItem {
  plateNumber: string;
  alertType: 'overdue_rental' | 'expiring_buyer_tag' | 'unaccounted';
  severity: 'warning' | 'urgent';
  customerName?: string;
  customerPhone?: string;
  vehicleInfo?: string;
  daysOverdue?: number;
  daysUntilExpiry?: number;
}

// ---------------------------------------------------------------------------
// Alert type display helpers
// ---------------------------------------------------------------------------

const ALERT_TYPE_LABELS: Record<string, string> = {
  overdue_rental: 'Overdue Rental',
  expiring_buyer_tag: 'Expiring Buyer\'s Tag',
  unaccounted: 'Unaccounted Plate',
};

const ALERT_TYPE_ICONS: Record<string, string> = {
  overdue_rental: '&#9888;',      // warning sign
  expiring_buyer_tag: '&#9200;',  // clock
  unaccounted: '&#10067;',        // question mark
};

function severityColor(severity: 'warning' | 'urgent'): { bg: string; border: string; text: string } {
  if (severity === 'urgent') {
    return { bg: '#3b1111', border: '#ef4444', text: '#fca5a5' };
  }
  return { bg: '#3b2e11', border: '#f59e0b', text: '#fcd34d' };
}

function severityBadge(severity: 'warning' | 'urgent'): string {
  const colors = severityColor(severity);
  return `<span style="
    display:inline-block;
    padding:2px 8px;
    border-radius:4px;
    font-size:10px;
    font-weight:bold;
    text-transform:uppercase;
    letter-spacing:0.5px;
    background:${colors.bg};
    color:${colors.text};
    border:1px solid ${colors.border};
  ">${severity}</span>`;
}

// ---------------------------------------------------------------------------
// Email template
// ---------------------------------------------------------------------------

function renderAlertRow(alert: PlateAlertItem): string {
  const colors = severityColor(alert.severity);
  const typeLabel = ALERT_TYPE_LABELS[alert.alertType] || alert.alertType;

  let detail = '';
  if (alert.alertType === 'overdue_rental' && alert.daysOverdue !== undefined) {
    detail = `<strong style="color:${colors.text};">${alert.daysOverdue} day${alert.daysOverdue !== 1 ? 's' : ''} overdue</strong>`;
  } else if (alert.alertType === 'expiring_buyer_tag' && alert.daysUntilExpiry !== undefined) {
    if (alert.daysUntilExpiry <= 0) {
      detail = `<strong style="color:#ef4444;">EXPIRED</strong>`;
    } else {
      detail = `<strong style="color:${colors.text};">${alert.daysUntilExpiry} day${alert.daysUntilExpiry !== 1 ? 's' : ''} remaining</strong>`;
    }
  } else if (alert.alertType === 'unaccounted') {
    detail = `<span style="color:#aaa;">No active booking or registration linked</span>`;
  }

  const customerInfo = alert.customerName
    ? `<div style="font-size:13px;color:#ccc;margin-top:4px;">
        ${alert.customerName}${alert.customerPhone ? ` &middot; ${alert.customerPhone}` : ''}
       </div>`
    : '';

  const vehicleInfo = alert.vehicleInfo
    ? `<div style="font-size:12px;color:#999;margin-top:2px;">${alert.vehicleInfo}</div>`
    : '';

  return `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #333;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align:top;width:100%;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="
                  font-size:16px;
                  font-weight:bold;
                  color:#fff;
                  letter-spacing:1px;
                ">${alert.plateNumber}</span>
                ${severityBadge(alert.severity)}
              </div>
              <div style="font-size:12px;color:#888;margin-top:2px;">${typeLabel}</div>
              ${detail ? `<div style="margin-top:4px;">${detail}</div>` : ''}
              ${customerInfo}
              ${vehicleInfo}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function groupAlerts(alerts: PlateAlertItem[]): {
  overdue: PlateAlertItem[];
  expiring: PlateAlertItem[];
  unaccounted: PlateAlertItem[];
} {
  return {
    overdue: alerts.filter(a => a.alertType === 'overdue_rental'),
    expiring: alerts.filter(a => a.alertType === 'expiring_buyer_tag'),
    unaccounted: alerts.filter(a => a.alertType === 'unaccounted'),
  };
}

function renderSection(title: string, icon: string, items: PlateAlertItem[]): string {
  if (items.length === 0) return '';

  return `
    <div style="margin-bottom:24px;">
      <div style="
        font-size:14px;
        font-weight:bold;
        color:#C9A84C;
        text-transform:uppercase;
        letter-spacing:1px;
        margin-bottom:12px;
        padding-bottom:6px;
        border-bottom:1px solid #333;
      ">${icon} ${title} (${items.length})</div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${items.map(renderAlertRow).join('')}
      </table>
    </div>
  `;
}

export function buildPlateAlertEmail(alerts: PlateAlertItem[]): string {
  const { overdue, expiring, unaccounted } = groupAlerts(alerts);

  const urgentCount = alerts.filter(a => a.severity === 'urgent').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;

  const countBadge = `
    <div style="text-align:center;margin-bottom:20px;">
      <span style="
        display:inline-block;
        padding:6px 16px;
        border-radius:20px;
        font-size:14px;
        font-weight:bold;
        background:${urgentCount > 0 ? '#3b1111' : '#3b2e11'};
        color:${urgentCount > 0 ? '#fca5a5' : '#fcd34d'};
        border:1px solid ${urgentCount > 0 ? '#ef4444' : '#f59e0b'};
      ">${alerts.length} Active Alert${alerts.length !== 1 ? 's' : ''}${urgentCount > 0 ? ` (${urgentCount} urgent)` : ''}</span>
    </div>
  `;

  const sections = [
    renderSection('Overdue Rentals', ALERT_TYPE_ICONS.overdue_rental, overdue),
    renderSection('Expiring Buyer\'s Tags', ALERT_TYPE_ICONS.expiring_buyer_tag, expiring),
    renderSection('Unaccounted Plates', ALERT_TYPE_ICONS.unaccounted, unaccounted),
  ].join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plate Alert Summary</title>
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
              ">Plate Alert Summary</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px;">
              ${countBadge}
              ${sections}

              <!-- CTA Button -->
              <div style="text-align:center;margin:30px 0 10px;">
                <a href="https://triplejautoinvestment.com/#/admin/plates" style="
                  display:inline-block;
                  background-color:#C9A84C;
                  color:#1a1a1a;
                  font-size:15px;
                  font-weight:bold;
                  padding:14px 32px;
                  border-radius:6px;
                  text-decoration:none;
                  letter-spacing:0.5px;
                ">View Plates Dashboard</a>
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
                This is an automated plate tracking alert.<br>
                Manage alert settings in the Plates Dashboard.
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

// ---------------------------------------------------------------------------
// SMS template (concise, under 160 chars when possible)
// ---------------------------------------------------------------------------

export function buildPlateAlertSms(alerts: PlateAlertItem[]): string {
  const { overdue, expiring, unaccounted } = groupAlerts(alerts);

  const parts: string[] = [];
  if (overdue.length > 0) {
    parts.push(`${overdue.length} overdue rental${overdue.length !== 1 ? 's' : ''}`);
  }
  if (expiring.length > 0) {
    parts.push(`${expiring.length} expiring tag${expiring.length !== 1 ? 's' : ''}`);
  }
  if (unaccounted.length > 0) {
    parts.push(`${unaccounted.length} unaccounted`);
  }

  const summary = parts.join(', ');
  return `Triple J Plate Alert: ${summary}. Check dashboard.`;
}
