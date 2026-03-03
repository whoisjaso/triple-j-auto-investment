/**
 * Triple J Auto Investment — Gmail Automation Trigger
 *
 * Watches triplejautoinvestment@gmail.com for:
 *   1. Manheim "Sale Documents" → extracts VIN(s) → creates Draft vehicles via Edge Function
 *   2. Central Dispatch "DELIVERED" → extracts towing cost → updates vehicle costTowing
 *
 * SETUP:
 * 1. Go to https://script.google.com (logged in as triplejautoinvestment@gmail.com)
 * 2. Create new project, paste this entire file
 * 3. Go to Project Settings > Script Properties, add:
 *    - SUPABASE_URL = https://scgmpliwlfabnpygvbsy.supabase.co
 *    - SUPABASE_ANON_KEY = (your anon key from .env.local)
 * 4. Run setupTrigger() once (authorize when prompted)
 * 5. Done — it checks every 5 minutes automatically
 */

// ================================================================
// CONFIGURATION
// ================================================================

function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    SUPABASE_URL: props.getProperty('SUPABASE_URL'),
    SUPABASE_ANON_KEY: props.getProperty('SUPABASE_ANON_KEY'),
  };
}

// ================================================================
// TRIGGER SETUP (run once)
// ================================================================

function setupTrigger() {
  // Remove existing triggers to prevent duplicates
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));

  // Check every 5 minutes
  ScriptApp.newTrigger('processAllEmails')
    .timeBased()
    .everyMinutes(5)
    .create();

  // Create labels for tracking
  GmailApp.createLabel('AutoProcessed/Manheim');
  GmailApp.createLabel('AutoProcessed/CentralDispatch');

  Logger.log('Trigger set up. Checking Gmail every 5 minutes for Manheim + Central Dispatch emails.');
}

// ================================================================
// MAIN — called every 5 minutes by trigger
// ================================================================

function processAllEmails() {
  const config = getConfig();
  if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
    Logger.log('ERROR: SUPABASE_URL or SUPABASE_ANON_KEY not set in Script Properties');
    return;
  }

  processManheimEmails(config);
  processCentralDispatchEmails(config);
}

// ================================================================
// MANHEIM — Sale Documents → Vehicle Intake
// ================================================================

function processManheimEmails(config) {
  // Real Manheim email pattern: from noreply@manheim.com, subject contains "Sale Documents"
  const query = 'from:noreply@manheim.com subject:"Sale Documents from Manheim" -label:AutoProcessed/Manheim';
  const threads = GmailApp.search(query, 0, 10);

  if (threads.length === 0) return;

  const processedLabel = GmailApp.getUserLabelByName('AutoProcessed/Manheim')
    || GmailApp.createLabel('AutoProcessed/Manheim');

  for (const thread of threads) {
    const messages = thread.getMessages();
    for (const message of messages) {
      try {
        const body = message.getPlainBody() || message.getBody();
        const parsed = parseManheimEmail(body);

        if (parsed.vins.length > 0) {
          for (const vin of parsed.vins) {
            const result = callVehicleIntake(config, {
              vin: vin,
              purchasePrice: parsed.paymentAmount,
              mileage: null,
            });
            Logger.log('Manheim intake VIN ' + vin + ': ' + JSON.stringify(result));
          }
        } else {
          Logger.log('No VIN found in Manheim email: ' + message.getSubject());
        }
      } catch (e) {
        Logger.log('Error processing Manheim email "' + message.getSubject() + '": ' + e.message);
      }
    }
    thread.addLabel(processedLabel);
  }
}

/**
 * Parse Manheim email body.
 *
 * Format 1 (single VIN):
 *   "sale documents you requested for 5LMCJ2C96JUL33161"
 *
 * Format 2 (payment receipt with multiple VINs):
 *   "Receipt Number ... Amount ... $929.00
 *    VINs Included: WMWSU3C58CT254299 5GADV33L26D195094 5N1AL0MM7DC307061"
 */
function parseManheimEmail(body) {
  var vins = [];
  var paymentAmount = null;

  // Pattern 1: "sale documents you requested for {VIN}"
  var singleVinMatch = body.match(/documents you requested for\s+([A-HJ-NPR-Z0-9]{17})/i);
  if (singleVinMatch) {
    vins.push(singleVinMatch[1].toUpperCase());
  }

  // Pattern 2: "VINs Included: VIN1 VIN2 VIN3"
  var multiVinMatch = body.match(/VINs?\s*Included[:\s]*((?:[A-HJ-NPR-Z0-9]{17}\s*)+)/i);
  if (multiVinMatch) {
    var vinBlock = multiVinMatch[1];
    var allVins = vinBlock.match(/[A-HJ-NPR-Z0-9]{17}/g);
    if (allVins) {
      for (var i = 0; i < allVins.length; i++) {
        var v = allVins[i].toUpperCase();
        if (vins.indexOf(v) === -1) vins.push(v);
      }
    }
  }

  // Fallback: find any 17-char VIN in the body (if nothing else matched)
  if (vins.length === 0) {
    var fallbackMatch = body.match(/\b([A-HJ-NPR-Z0-9]{17})\b/g);
    if (fallbackMatch) {
      for (var j = 0; j < fallbackMatch.length; j++) {
        var fv = fallbackMatch[j].toUpperCase();
        if (vins.indexOf(fv) === -1) vins.push(fv);
      }
    }
  }

  // Payment amount: "$929.00" pattern
  var amountMatch = body.match(/\$\s*([\d,]+(?:\.\d{2})?)/);
  if (amountMatch) {
    paymentAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
    // If multiple VINs in one payment, we can't split the amount per vehicle
    // So we only use it if there's exactly 1 VIN
    if (vins.length > 1) {
      paymentAmount = null; // Can't determine per-vehicle price
    }
  }

  return { vins: vins, paymentAmount: paymentAmount };
}

// ================================================================
// CENTRAL DISPATCH — DELIVERED → Update Towing Cost
// ================================================================

function processCentralDispatchEmails(config) {
  // Only process DELIVERED emails (vehicle has arrived)
  var query = 'from:do-not-reply@centraldispatch.com subject:"has been DELIVERED" -label:AutoProcessed/CentralDispatch';
  var threads = GmailApp.search(query, 0, 10);

  if (threads.length === 0) return;

  var processedLabel = GmailApp.getUserLabelByName('AutoProcessed/CentralDispatch')
    || GmailApp.createLabel('AutoProcessed/CentralDispatch');

  for (var t = 0; t < threads.length; t++) {
    var messages = threads[t].getMessages();
    for (var m = 0; m < messages.length; m++) {
      try {
        var body = messages[m].getPlainBody() || messages[m].getBody();
        var parsed = parseCentralDispatchEmail(body);

        if (parsed.vins.length > 0 && parsed.towingPrice) {
          // Split towing cost across vehicles
          var costPerVehicle = Math.round(parsed.towingPrice / parsed.vins.length * 100) / 100;

          for (var i = 0; i < parsed.vins.length; i++) {
            var result = updateVehicleTowingCost(config, parsed.vins[i], costPerVehicle);
            Logger.log('Central Dispatch towing update VIN ' + parsed.vins[i] + ' ($' + costPerVehicle + '): ' + JSON.stringify(result));
          }
        } else if (parsed.ymms.length > 0 && parsed.towingPrice) {
          // No VIN but have YMM — try matching by year/make/model
          var costPerVehicle2 = Math.round(parsed.towingPrice / parsed.ymms.length * 100) / 100;

          for (var j = 0; j < parsed.ymms.length; j++) {
            var result2 = updateVehicleTowingByYMM(config, parsed.ymms[j], costPerVehicle2);
            Logger.log('Central Dispatch towing update YMM ' + JSON.stringify(parsed.ymms[j]) + ' ($' + costPerVehicle2 + '): ' + JSON.stringify(result2));
          }
        } else {
          Logger.log('Could not parse Central Dispatch email: ' + messages[m].getSubject());
        }
      } catch (e) {
        Logger.log('Error processing Central Dispatch email: ' + e.message);
      }
    }
    threads[t].addLabel(processedLabel);
  }
}

/**
 * Parse Central Dispatch email body.
 *
 * Example body:
 *   "Load ID Call 281-912-4266
 *    Pick Up Location Euless, TX 76040
 *    Delivery Location Houston, TX 77075
 *    Price $350.00
 *    Number of Vehicles 2
 *    •YMM 2013 BMW 5 Series Sedan VIN WBAFU7C55DDU71300
 *    •YMM 2020 Ford Fusion VIN 3FA6P0HD5LR202453"
 */
function parseCentralDispatchEmail(body) {
  var vins = [];
  var ymms = [];
  var towingPrice = null;

  // Extract VINs: "VIN WBAFU7C55DDU71300"
  var vinMatches = body.match(/VIN\s+([A-HJ-NPR-Z0-9]{17})/gi);
  if (vinMatches) {
    for (var i = 0; i < vinMatches.length; i++) {
      var vinMatch = vinMatches[i].match(/([A-HJ-NPR-Z0-9]{17})/i);
      if (vinMatch) vins.push(vinMatch[1].toUpperCase());
    }
  }

  // Extract YMMs: "•YMM 2013 BMW 5 Series Sedan" or "•YMM 2020 Ford Fusion"
  var ymmPattern = /YMM\s+(\d{4})\s+(\w+)\s+([^\n•VIN]+)/gi;
  var ymmMatch;
  while ((ymmMatch = ymmPattern.exec(body)) !== null) {
    ymms.push({
      year: parseInt(ymmMatch[1]),
      make: ymmMatch[2].trim(),
      model: ymmMatch[3].trim(),
    });
  }

  // Extract towing price: "Price $350.00"
  var priceMatch = body.match(/Price\s*\$\s*([\d,]+(?:\.\d{2})?)/i);
  if (priceMatch) {
    towingPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
  }

  // Extract carrier name from subject/body
  var carrierMatch = body.match(/(?:DELIVERED|PICKED UP|ACCEPTED)\s+by\s+(.+?)(?:\.|$)/i);
  var carrier = carrierMatch ? carrierMatch[1].trim() : null;

  return {
    vins: vins,
    ymms: ymms,
    towingPrice: towingPrice,
    carrier: carrier,
  };
}

// ================================================================
// SUPABASE API CALLS
// ================================================================

/**
 * Call vehicle-intake Edge Function to create a Draft vehicle.
 */
function callVehicleIntake(config, parsed) {
  var url = config.SUPABASE_URL + '/functions/v1/vehicle-intake';
  var options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + config.SUPABASE_ANON_KEY,
    },
    payload: JSON.stringify({
      vin: parsed.vin,
      purchasePrice: parsed.purchasePrice,
      mileage: parsed.mileage,
      source: 'manheim_email',
    }),
    muteHttpExceptions: true,
  };

  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();
  var body = JSON.parse(response.getContentText());

  if (code === 409) {
    return { status: 'duplicate', message: body.error };
  } else if (code >= 400) {
    return { status: 'error', code: code, message: body.error };
  }

  return { status: 'created', vehicleId: body.vehicleId };
}

/**
 * Update a vehicle's towing cost by VIN.
 * Uses Supabase REST API directly (PATCH on vehicles table).
 */
function updateVehicleTowingCost(config, vin, cost) {
  // Find vehicle by VIN
  var findUrl = config.SUPABASE_URL + '/rest/v1/vehicles?vin=eq.' + vin + '&select=id,cost_towing';
  var findOptions = {
    method: 'GET',
    headers: {
      'apikey': config.SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + config.SUPABASE_ANON_KEY,
    },
    muteHttpExceptions: true,
  };

  var findResponse = UrlFetchApp.fetch(findUrl, findOptions);
  var vehicles = JSON.parse(findResponse.getContentText());

  if (!vehicles || vehicles.length === 0) {
    return { status: 'not_found', vin: vin };
  }

  var vehicleId = vehicles[0].id;
  var existingTowing = vehicles[0].cost_towing || 0;

  // Update towing cost
  var updateUrl = config.SUPABASE_URL + '/rest/v1/vehicles?id=eq.' + vehicleId;
  var updateOptions = {
    method: 'PATCH',
    headers: {
      'apikey': config.SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + config.SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    payload: JSON.stringify({
      cost_towing: existingTowing + cost,
    }),
    muteHttpExceptions: true,
  };

  var updateResponse = UrlFetchApp.fetch(updateUrl, updateOptions);
  return {
    status: updateResponse.getResponseCode() < 300 ? 'updated' : 'error',
    vehicleId: vehicleId,
    newTowingCost: existingTowing + cost,
  };
}

/**
 * Update towing cost by Year/Make/Model match (fallback when no VIN in email).
 */
function updateVehicleTowingByYMM(config, ymm, cost) {
  // Search by year + make (model might have extra words like "Sedan")
  var findUrl = config.SUPABASE_URL + '/rest/v1/vehicles?year=eq.' + ymm.year
    + '&make=ilike.' + encodeURIComponent(ymm.make)
    + '&status=eq.Draft&select=id,vin,cost_towing&limit=1';

  var findOptions = {
    method: 'GET',
    headers: {
      'apikey': config.SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + config.SUPABASE_ANON_KEY,
    },
    muteHttpExceptions: true,
  };

  var findResponse = UrlFetchApp.fetch(findUrl, findOptions);
  var vehicles = JSON.parse(findResponse.getContentText());

  if (!vehicles || vehicles.length === 0) {
    return { status: 'not_found', ymm: ymm };
  }

  var vehicleId = vehicles[0].id;
  var existingTowing = vehicles[0].cost_towing || 0;

  var updateUrl = config.SUPABASE_URL + '/rest/v1/vehicles?id=eq.' + vehicleId;
  var updateOptions = {
    method: 'PATCH',
    headers: {
      'apikey': config.SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + config.SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    payload: JSON.stringify({
      cost_towing: existingTowing + cost,
    }),
    muteHttpExceptions: true,
  };

  var updateResponse = UrlFetchApp.fetch(updateUrl, updateOptions);
  return {
    status: updateResponse.getResponseCode() < 300 ? 'updated' : 'error',
    vehicleId: vehicleId,
    newTowingCost: existingTowing + cost,
  };
}

// ================================================================
// MANUAL TESTS (run from Script Editor)
// ================================================================

function testManheimParse() {
  // Test with real email format
  var body1 = 'Post-Payment Documents from Manheim Dear Valued Customer, Please find attached the sale documents you requested for 5LMCJ2C96JUL33161 . As always, we are honored.';
  var result1 = parseManheimEmail(body1);
  Logger.log('Single VIN: ' + JSON.stringify(result1));

  var body2 = 'Dear Valued Customer, Please find attached the documents you requested after your recent payment(s): Receipt Number Payment Method Amount ACH7052016 BANK OF AMERICA, N.A.||XXXXXXXX1713 $929.00 VINs Included: WMWSU3C58CT254299 5GADV33L26D195094 5N1AL0MM7DC307061';
  var result2 = parseManheimEmail(body2);
  Logger.log('Multi VIN: ' + JSON.stringify(result2));
}

function testCentralDispatchParse() {
  var body = 'Hello Triple J Auto Investment LLC, Load Details Load ID Call 281-912-4266 Pick Up Location Euless, TX 76040 Delivery Location Houston, TX 77075 Price $350.00 Number of Vehicles 2 •YMM 2013 BMW 5 Series Sedan VIN WBAFU7C55DDU71300 •YMM 2020 Ford Fusion VIN 3FA6P0HD5LR202453';
  var result = parseCentralDispatchEmail(body);
  Logger.log('Central Dispatch: ' + JSON.stringify(result));
}

function testVehicleIntake() {
  var config = getConfig();
  var result = callVehicleIntake(config, {
    vin: '1HGCV1F34KA028465',
    purchasePrice: 3200,
    mileage: null,
  });
  Logger.log('Test intake: ' + JSON.stringify(result));
}
