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
    const templateParams = {
      to_email: import.meta.env.VITE_ADMIN_EMAIL || 'jobawems@gmail.com',
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
    console.log('Lead notification email sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send lead notification email:', error);
    return false;
  }
};

// Template for EmailJS email body (paste this into EmailJS dashboard):
export const EMAIL_TEMPLATE_GUIDE = `
=== EmailJS Template Configuration ===

1. Go to https://www.emailjs.com/ and create a free account
2. Create a new Email Service (Gmail, Outlook, etc.)
3. Create a new Email Template with this content:

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

4. Copy your Service ID, Template ID, and Public Key to .env.local
`;
