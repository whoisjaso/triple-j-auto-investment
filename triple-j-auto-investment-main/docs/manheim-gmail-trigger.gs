/**
 * Manheim Purchase Email → Vehicle Intake Trigger
 *
 * SETUP:
 * 1. Go to https://script.google.com
 * 2. Create new project, paste this code
 * 3. Set SUPABASE_URL and SUPABASE_ANON_KEY in Script Properties
 *    (File > Project properties > Script properties)
 * 4. Run setupTrigger() once to create the Gmail watch
 * 5. Authorize when prompted
 *
 * HOW IT WORKS:
 * - Checks Gmail every 5 minutes for new Manheim emails
 * - Parses VIN and purchase price from the email body
 * - Calls the vehicle-intake Edge Function
 * - Labels processed emails so they're not processed twice
 */

// Configuration — set these in Script Properties
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    SUPABASE_URL: props.getProperty('SUPABASE_URL'),
    SUPABASE_ANON_KEY: props.getProperty('SUPABASE_ANON_KEY'),
  };
}

/**
 * Run this ONCE to set up the time-based trigger.
 */
function setupTrigger() {
  // Remove existing triggers to prevent duplicates
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));

  // Check every 5 minutes
  ScriptApp.newTrigger('processManheimEmails')
    .timeBased()
    .everyMinutes(5)
    .create();

  // Create the label for tracking processed emails
  GmailApp.createLabel('Manheim/Processed');

  Logger.log('Trigger set up. Checking Gmail every 5 minutes.');
}

/**
 * Main function — called by the trigger every 5 minutes.
 */
function processManheimEmails() {
  const config = getConfig();
  if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
    Logger.log('ERROR: SUPABASE_URL or SUPABASE_ANON_KEY not set in Script Properties');
    return;
  }

  // Search for unprocessed Manheim emails
  // Adjust the search query based on actual Manheim email sender/subject patterns
  const query = 'from:(manheim.com OR simulcast@manheim.com OR noreply@manheim.com) subject:(purchase OR confirmation OR "you won" OR "congratulations") -label:Manheim/Processed';
  const threads = GmailApp.search(query, 0, 10);

  if (threads.length === 0) return;

  const processedLabel = GmailApp.getUserLabelByName('Manheim/Processed')
    || GmailApp.createLabel('Manheim/Processed');

  for (const thread of threads) {
    const messages = thread.getMessages();
    for (const message of messages) {
      try {
        const body = message.getPlainBody() || message.getBody();
        const parsed = parseManheimEmail(body);

        if (parsed && parsed.vin) {
          const result = callVehicleIntake(config, parsed);
          Logger.log(`Processed VIN ${parsed.vin}: ${JSON.stringify(result)}`);
        } else {
          Logger.log(`Could not parse VIN from email: ${message.getSubject()}`);
        }
      } catch (e) {
        Logger.log(`Error processing email "${message.getSubject()}": ${e.message}`);
      }
    }
    // Mark thread as processed
    thread.addLabel(processedLabel);
  }
}

/**
 * Extract VIN and purchase price from Manheim email body.
 * Multiple regex patterns to handle different Manheim email formats.
 */
function parseManheimEmail(body) {
  // VIN patterns — 17 alphanumeric characters (no I, O, Q)
  const vinPatterns = [
    /VIN[:\s]*([A-HJ-NPR-Z0-9]{17})/i,
    /Vehicle\s*Identification[:\s]*([A-HJ-NPR-Z0-9]{17})/i,
    /\b([A-HJ-NPR-Z0-9]{17})\b/,
  ];

  let vin = null;
  for (const pattern of vinPatterns) {
    const match = body.match(pattern);
    if (match) {
      vin = match[1].toUpperCase();
      break;
    }
  }

  // Price patterns
  const pricePatterns = [
    /(?:purchase|sold|winning|bid|sale)\s*(?:price|amount)?[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
    /\$\s*([\d,]+(?:\.\d{2})?)\s*(?:purchase|sold|winning|bid)/i,
    /amount[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
  ];

  let purchasePrice = null;
  for (const pattern of pricePatterns) {
    const match = body.match(pattern);
    if (match) {
      purchasePrice = parseFloat(match[1].replace(/,/g, ''));
      if (purchasePrice > 100 && purchasePrice < 100000) break; // Sanity check
      purchasePrice = null; // Reset if out of range
    }
  }

  // Mileage patterns
  const mileagePatterns = [
    /(?:mileage|odometer|miles)[:\s]*([\d,]+)/i,
    /([\d,]+)\s*(?:miles|mi)\b/i,
  ];

  let mileage = null;
  for (const pattern of mileagePatterns) {
    const match = body.match(pattern);
    if (match) {
      mileage = parseInt(match[1].replace(/,/g, ''));
      if (mileage > 0 && mileage < 500000) break;
      mileage = null;
    }
  }

  return vin ? { vin, purchasePrice, mileage } : null;
}

/**
 * Call the vehicle-intake Supabase Edge Function.
 */
function callVehicleIntake(config, parsed) {
  const url = `${config.SUPABASE_URL}/functions/v1/vehicle-intake`;
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.SUPABASE_ANON_KEY}`,
    },
    payload: JSON.stringify({
      vin: parsed.vin,
      purchasePrice: parsed.purchasePrice,
      mileage: parsed.mileage,
      source: 'manheim_email',
    }),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();
  const body = JSON.parse(response.getContentText());

  if (code === 409) {
    return { status: 'duplicate', message: body.error };
  } else if (code >= 400) {
    throw new Error(`Edge Function error ${code}: ${body.error}`);
  }

  return { status: 'created', vehicleId: body.vehicleId, vehicle: body.vehicle };
}

/**
 * Manual test — call this from the Script Editor to test with a known VIN.
 */
function testIntake() {
  const config = getConfig();
  const result = callVehicleIntake(config, {
    vin: '1HGCV1F34KA028465',  // Example: 2019 Honda Accord
    purchasePrice: 3200,
    mileage: 85000,
  });
  Logger.log(JSON.stringify(result));
}
