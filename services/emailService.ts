import emailjs from '@emailjs/browser';

// Initialize EmailJS with public key
const initEmailJS = () => {
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  if (publicKey && publicKey !== 'YOUR_PUBLIC_KEY') {
    emailjs.init(publicKey);
    return true;
  }
  return false;
};

export const sendLeadNotification = async (lead: {
  name: string;
  email: string;
  phone: string;
  interest: string;
}): Promise<boolean> => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

  // Check if EmailJS is configured
  if (!serviceId || serviceId === 'YOUR_SERVICE_ID' ||
      !templateId || templateId === 'YOUR_TEMPLATE_ID') {
    console.warn('EmailJS not configured. Lead saved locally but email not sent.');
    return false;
  }

  // Initialize if not already done
  if (!initEmailJS()) {
    console.warn('EmailJS initialization failed.');
    return false;
  }

  try {
    // Send to both email addresses
    const primaryEmail = 'triplejautoinvestment@gmail.com';
    const secondaryEmail = 'jobawems@gmail.com';

    const templateParams = {
      to_email: primaryEmail,
      cc_email: secondaryEmail,
      customer_name: lead.name,
      customer_email: lead.email,
      customer_phone: lead.phone,
      vehicle_interest: lead.interest,
      timestamp: new Date().toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        dateStyle: 'full',
        timeStyle: 'short'
      })
    };

    await emailjs.send(serviceId, templateId, templateParams);
    console.log(`Lead notification sent to ${primaryEmail} and ${secondaryEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send lead notification email:', error);
    return false;
  }
};

/**
 * Send registration status update notification to customer
 */
export const sendRegistrationNotification = async (notification: {
  customerName: string;
  customerEmail: string;
  orderId: string;
  vehicleInfo: string;
  stageName: string;
  stageMessage: string;
  trackerUrl: string;
  notificationType: 'stage_complete' | 'action_required' | 'blocked' | 'ready_pickup';
}): Promise<boolean> => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_REGISTRATION_TEMPLATE_ID || import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

  // Check if EmailJS is configured
  if (!serviceId || serviceId === 'YOUR_SERVICE_ID' ||
      !templateId || templateId === 'YOUR_TEMPLATE_ID') {
    console.warn('EmailJS not configured for registration notifications.');
    return false;
  }

  // Initialize if not already done
  if (!initEmailJS()) {
    console.warn('EmailJS initialization failed.');
    return false;
  }

  // Determine subject and styling based on notification type
  const subjectMap = {
    'stage_complete': `Registration Update - ${notification.stageName}`,
    'action_required': `Action Required - ${notification.stageName}`,
    'blocked': `Attention Needed - ${notification.stageName}`,
    'ready_pickup': `Your Plates Are Ready for Pickup!`
  };

  try {
    const templateParams = {
      to_email: notification.customerEmail,
      customer_name: notification.customerName,
      order_id: notification.orderId,
      vehicle_info: notification.vehicleInfo,
      stage_name: notification.stageName,
      stage_message: notification.stageMessage,
      tracker_url: notification.trackerUrl,
      subject: subjectMap[notification.notificationType],
      notification_type: notification.notificationType,
      timestamp: new Date().toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        dateStyle: 'full',
        timeStyle: 'short'
      })
    };

    await emailjs.send(serviceId, templateId, templateParams);
    console.log(`Registration notification sent to ${notification.customerEmail} for ${notification.orderId}`);
    return true;
  } catch (error) {
    console.error('Failed to send registration notification:', error);
    return false;
  }
};

// Template for EmailJS email body (paste this into EmailJS dashboard):
export const EMAIL_TEMPLATE_GUIDE = `
=== EmailJS Template Configuration ===

1. Go to https://www.emailjs.com/ and create a free account
2. Create a new Email Service (Gmail, Outlook, etc.)
3. Create a new Email Template with this content:

TO: {{to_email}}
CC: {{cc_email}}

SUBJECT: 🚨 NEW LEAD - Triple J Auto Investment

BODY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 NEW CUSTOMER INQUIRY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 CUSTOMER DETAILS:
   Name: {{customer_name}}
   Email: {{customer_email}}
   Phone: {{customer_phone}}

🚗 VEHICLE INTEREST:
   {{vehicle_interest}}

⏰ TIMESTAMP:
   {{timestamp}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This lead was captured via TripleJAutoInvestment.com

Action Required: Contact within 60 minutes for maximum conversion.

IMPORTANT:
- Emails will be sent to: triplejautoinvestment@gmail.com
- CC'd to: jobawems@gmail.com

4. Copy your Service ID, Template ID, and Public Key to .env.local

=== Registration Status Email Template ===

Create a second template for registration notifications:

TO: {{to_email}}

SUBJECT: {{subject}} - Triple J Auto Investment

BODY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGISTRATION STATUS UPDATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hello {{customer_name}},

{{stage_message}}

ORDER DETAILS:
   Order ID: {{order_id}}
   Vehicle: {{vehicle_info}}
   Current Stage: {{stage_name}}

TRACK YOUR REGISTRATION:
   {{tracker_url}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Triple J Auto Investment
Texas Dealer License: P171632
8774 Almeda Genoa Road, Houston, TX 77075

Questions? Call (713) 555-0192 or reply to this email.
`;
