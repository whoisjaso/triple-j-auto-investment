// Check Plate & Insurance Alerts - Supabase Edge Function
// Invoked every 30 minutes by pg_cron to detect:
//   - Plate issues: overdue rentals, expiring buyer's tags, unaccounted plates
//   - Insurance issues: missing insurance, expired policies, expiring policies (Phase 08)
// Sends a single batched SMS + email to the admin with all active alerts.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendSms } from '../_shared/twilio.ts';
import { sendEmail } from '../_shared/resend.ts';
import {
  buildPlateAlertEmail,
  buildPlateAlertSms,
  type PlateAlertItem,
  type InsuranceAlertItem,
} from '../_shared/email-templates/plate-alert.tsx';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DetectedAlert {
  plateId: string;
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
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (_req: Request) => {
  const stats = {
    detected: 0,
    notified: 0,
    resolved: 0,
    insuranceDetected: 0,
    insuranceNotified: 0,
    insuranceResolved: 0,
  };

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[plate-alerts] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return new Response(
        JSON.stringify({ error: 'Missing Supabase env vars' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const allDetected: DetectedAlert[] = [];

    // -------------------------------------------------------------------
    // 1. Detect overdue rentals
    // -------------------------------------------------------------------
    try {
      const { data: overdueAssignments, error: overdueError } = await supabase
        .from('plate_assignments')
        .select(`
          id,
          plate_id,
          customer_name,
          customer_phone,
          expected_return_date,
          assigned_at,
          plates!inner ( id, plate_number ),
          vehicles ( id, year, make, model )
        `)
        .is('returned_at', null)
        .eq('assignment_type', 'rental')
        .not('expected_return_date', 'is', null);

      if (overdueError) {
        console.error(`[plate-alerts] Overdue query error: ${overdueError.message}`);
      } else if (overdueAssignments) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const assignment of overdueAssignments) {
          const returnDate = new Date(assignment.expected_return_date);
          returnDate.setHours(0, 0, 0, 0);

          if (returnDate < today) {
            const diffMs = today.getTime() - returnDate.getTime();
            const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            const plate = assignment.plates as any;
            const vehicle = assignment.vehicles as any;

            allDetected.push({
              plateId: plate.id,
              plateNumber: plate.plate_number,
              alertType: 'overdue_rental',
              severity: daysOverdue >= 3 ? 'urgent' : 'warning',
              customerName: assignment.customer_name || undefined,
              customerPhone: assignment.customer_phone || undefined,
              vehicleInfo: vehicle
                ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                : undefined,
              daysOverdue,
            });
          }
        }
      }
    } catch (err) {
      console.error(`[plate-alerts] Overdue detection error: ${err}`);
    }

    // -------------------------------------------------------------------
    // 2. Detect expiring buyer's tags
    // -------------------------------------------------------------------
    try {
      const { data: buyerTags, error: tagError } = await supabase
        .from('plates')
        .select('id, plate_number, expiration_date, status')
        .eq('plate_type', 'buyer_tag')
        .neq('status', 'expired')
        .not('expiration_date', 'is', null);

      if (tagError) {
        console.error(`[plate-alerts] Buyer tag query error: ${tagError.message}`);
      } else if (buyerTags) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const tag of buyerTags) {
          const expiry = new Date(tag.expiration_date);
          expiry.setHours(0, 0, 0, 0);

          const diffMs = expiry.getTime() - today.getTime();
          const daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          if (daysUntilExpiry <= 14) {
            let severity: 'warning' | 'urgent' = 'warning';
            if (daysUntilExpiry <= 7) severity = 'urgent';

            // Try to find customer info from the active assignment
            let customerName: string | undefined;
            let customerPhone: string | undefined;
            let vehicleInfo: string | undefined;

            const { data: activeAssignment } = await supabase
              .from('plate_assignments')
              .select('customer_name, customer_phone, vehicles ( year, make, model )')
              .eq('plate_id', tag.id)
              .is('returned_at', null)
              .limit(1)
              .maybeSingle();

            if (activeAssignment) {
              customerName = activeAssignment.customer_name || undefined;
              customerPhone = activeAssignment.customer_phone || undefined;
              const vehicle = activeAssignment.vehicles as any;
              if (vehicle) {
                vehicleInfo = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
              }
            }

            allDetected.push({
              plateId: tag.id,
              plateNumber: tag.plate_number,
              alertType: 'expiring_buyer_tag',
              severity,
              customerName,
              customerPhone,
              vehicleInfo,
              daysUntilExpiry,
            });
          }
        }
      }
    } catch (err) {
      console.error(`[plate-alerts] Buyer tag detection error: ${err}`);
    }

    // -------------------------------------------------------------------
    // 3. Detect unaccounted plates
    // -------------------------------------------------------------------
    try {
      const { data: assignedPlates, error: assignedError } = await supabase
        .from('plates')
        .select('id, plate_number')
        .eq('status', 'assigned');

      if (assignedError) {
        console.error(`[plate-alerts] Unaccounted query error: ${assignedError.message}`);
      } else if (assignedPlates) {
        for (const plate of assignedPlates) {
          // Check if this plate has a valid active assignment
          const { data: activeAssignment } = await supabase
            .from('plate_assignments')
            .select(`
              id,
              booking_id,
              registration_id,
              assignment_type,
              customer_name,
              customer_phone,
              vehicles ( year, make, model )
            `)
            .eq('plate_id', plate.id)
            .is('returned_at', null)
            .limit(1)
            .maybeSingle();

          if (!activeAssignment) {
            // Plate status says assigned but no active assignment exists
            allDetected.push({
              plateId: plate.id,
              plateNumber: plate.plate_number,
              alertType: 'unaccounted',
              severity: 'urgent',
            });
            continue;
          }

          // Check if assignment references a cancelled/returned booking
          if (activeAssignment.booking_id) {
            const { data: booking } = await supabase
              .from('rental_bookings')
              .select('id, status')
              .eq('id', activeAssignment.booking_id)
              .maybeSingle();

            if (booking && (booking.status === 'returned' || booking.status === 'cancelled')) {
              const vehicle = activeAssignment.vehicles as any;
              allDetected.push({
                plateId: plate.id,
                plateNumber: plate.plate_number,
                alertType: 'unaccounted',
                severity: 'urgent',
                customerName: activeAssignment.customer_name || undefined,
                customerPhone: activeAssignment.customer_phone || undefined,
                vehicleInfo: vehicle
                  ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                  : undefined,
              });
              continue;
            }
          }

          // Assignment with no booking and no registration is unaccounted
          if (
            !activeAssignment.booking_id &&
            !activeAssignment.registration_id &&
            activeAssignment.assignment_type !== 'inventory'
          ) {
            allDetected.push({
              plateId: plate.id,
              plateNumber: plate.plate_number,
              alertType: 'unaccounted',
              severity: 'warning',
              customerName: activeAssignment.customer_name || undefined,
              customerPhone: activeAssignment.customer_phone || undefined,
            });
          }
        }
      }
    } catch (err) {
      console.error(`[plate-alerts] Unaccounted detection error: ${err}`);
    }

    stats.detected = allDetected.length;
    console.log(`[plate-alerts] Detected ${allDetected.length} alert condition(s)`);

    // -------------------------------------------------------------------
    // 4. Upsert into plate_alerts (deduplication)
    // -------------------------------------------------------------------
    for (const alert of allDetected) {
      try {
        const { error: upsertError } = await supabase
          .from('plate_alerts')
          .upsert(
            {
              plate_id: alert.plateId,
              alert_type: alert.alertType,
              severity: alert.severity,
              first_detected_at: new Date().toISOString(),
            },
            {
              onConflict: 'plate_id,alert_type',
              ignoreDuplicates: true,
            },
          );

        if (upsertError) {
          // If the partial unique index conflict is not handled by ignoreDuplicates,
          // it means an active alert already exists -- this is expected
          console.log(
            `[plate-alerts] Alert already tracked for plate ${alert.plateNumber} (${alert.alertType}): ${upsertError.message}`,
          );
        }
      } catch (err) {
        console.error(
          `[plate-alerts] Upsert error for plate ${alert.plateNumber}: ${err}`,
        );
      }
    }

    // -------------------------------------------------------------------
    // 5. Auto-resolve cleared conditions
    // -------------------------------------------------------------------
    try {
      const { data: activeAlerts, error: activeError } = await supabase
        .from('plate_alerts')
        .select('id, plate_id, alert_type')
        .is('resolved_at', null);

      if (activeError) {
        console.error(`[plate-alerts] Active alerts query error: ${activeError.message}`);
      } else if (activeAlerts) {
        // Build a set of currently detected conditions for fast lookup
        const detectedSet = new Set(
          allDetected.map((a) => `${a.plateId}:${a.alertType}`),
        );

        for (const existing of activeAlerts) {
          const key = `${existing.plate_id}:${existing.alert_type}`;
          if (!detectedSet.has(key)) {
            // Condition no longer exists -- resolve the alert
            const { error: resolveError } = await supabase
              .from('plate_alerts')
              .update({ resolved_at: new Date().toISOString() })
              .eq('id', existing.id);

            if (resolveError) {
              console.error(
                `[plate-alerts] Failed to resolve alert ${existing.id}: ${resolveError.message}`,
              );
            } else {
              stats.resolved++;
              console.log(
                `[plate-alerts] Auto-resolved alert ${existing.id} (${existing.alert_type})`,
              );
            }
          }
        }
      }
    } catch (err) {
      console.error(`[plate-alerts] Auto-resolve error: ${err}`);
    }

    // ===================================================================
    // INSURANCE ALERT DETECTION (Phase 08)
    // ===================================================================
    // Detects 3 insurance conditions on active/reserved bookings:
    //   1. missing_insurance - No insurance record at all
    //   2. expired - Insurance expiration_date is in the past
    //   3. expiring_soon - Insurance expiration_date within 7 days
    // Severity: expired=urgent, expiring_soon <=3 days=urgent, >3 days=warning, missing=warning
    // Uses insurance_alerts table with partial unique index for deduplication.
    // ===================================================================

    interface DetectedInsuranceAlert {
      bookingId: string;         // UUID (rental_bookings.id)
      bookingDisplayId: string;  // Human-readable TJ-R-YYYY-NNNN
      alertType: 'missing_insurance' | 'expired' | 'expiring_soon';
      severity: 'warning' | 'urgent';
      notes: string;
      customerName?: string;
    }

    const allInsuranceDetected: DetectedInsuranceAlert[] = [];

    try {
      // Fetch active/reserved bookings with their insurance records
      const { data: bookingsWithInsurance, error: insQueryError } = await supabase
        .from('rental_bookings')
        .select(`
          id, booking_id, status, start_date, end_date,
          rental_customers ( full_name, phone ),
          rental_insurance ( id, expiration_date, verification_status, insurance_company, policy_number )
        `)
        .in('status', ['active', 'reserved']);

      if (insQueryError) {
        console.error(`[plate-alerts] Insurance query error: ${insQueryError.message}`);
      } else if (bookingsWithInsurance) {
        const insToday = new Date();
        insToday.setHours(0, 0, 0, 0);
        const sevenDaysFromNow = new Date(insToday);
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        for (const booking of bookingsWithInsurance) {
          // Supabase returns nested 1:1 as single object or array depending on query
          const insurance = Array.isArray(booking.rental_insurance)
            ? booking.rental_insurance[0]
            : booking.rental_insurance;

          const customer = Array.isArray(booking.rental_customers)
            ? booking.rental_customers[0]
            : booking.rental_customers;

          const customerName = (customer as any)?.full_name || undefined;

          if (!insurance) {
            // No insurance record at all for an active/reserved booking
            allInsuranceDetected.push({
              bookingId: booking.id,
              bookingDisplayId: booking.booking_id,
              alertType: 'missing_insurance',
              severity: 'warning',
              notes: `Booking ${booking.booking_id} has no insurance on file`,
              customerName,
            });
            continue;
          }

          if ((insurance as any).verification_status === 'failed') {
            // Admin already rejected this insurance -- don't alert separately
            continue;
          }

          const expirationDate = (insurance as any).expiration_date;
          if (expirationDate) {
            const expiryDate = new Date(expirationDate);
            expiryDate.setHours(0, 0, 0, 0);

            if (expiryDate < insToday) {
              // Already expired during active rental
              allInsuranceDetected.push({
                bookingId: booking.id,
                bookingDisplayId: booking.booking_id,
                alertType: 'expired',
                severity: 'urgent',
                notes: `Insurance for booking ${booking.booking_id} expired on ${expirationDate}`,
                customerName,
              });
            } else if (expiryDate <= sevenDaysFromNow) {
              // Expiring within 7 days
              const daysUntilExpiry = Math.ceil(
                (expiryDate.getTime() - insToday.getTime()) / (1000 * 60 * 60 * 24),
              );
              allInsuranceDetected.push({
                bookingId: booking.id,
                bookingDisplayId: booking.booking_id,
                alertType: 'expiring_soon',
                severity: daysUntilExpiry <= 3 ? 'urgent' : 'warning',
                notes: `Insurance for booking ${booking.booking_id} expires in ${daysUntilExpiry} day(s)`,
                customerName,
              });
            }
          }
        }
      }
    } catch (err) {
      console.error(`[plate-alerts] Insurance detection error: ${err}`);
    }

    stats.insuranceDetected = allInsuranceDetected.length;
    console.log(`[plate-alerts] Detected ${allInsuranceDetected.length} insurance alert condition(s)`);

    // -------------------------------------------------------------------
    // Insurance: Upsert into insurance_alerts (deduplication)
    // -------------------------------------------------------------------
    // Partial unique index: uq_insurance_active_alert ON (booking_id, alert_type) WHERE resolved_at IS NULL
    // Same upsert + ignoreDuplicates pattern as plate_alerts above.

    for (const alert of allInsuranceDetected) {
      try {
        const { error: upsertError } = await supabase
          .from('insurance_alerts')
          .upsert(
            {
              booking_id: alert.bookingId,
              alert_type: alert.alertType,
              severity: alert.severity,
              notes: alert.notes,
              first_detected_at: new Date().toISOString(),
            },
            {
              onConflict: 'booking_id,alert_type',
              ignoreDuplicates: true,
            },
          );

        if (upsertError) {
          console.log(
            `[plate-alerts] Insurance alert already tracked for booking ${alert.bookingDisplayId} (${alert.alertType}): ${upsertError.message}`,
          );
        }
      } catch (err) {
        console.error(
          `[plate-alerts] Insurance upsert error for booking ${alert.bookingDisplayId}: ${err}`,
        );
      }
    }

    // -------------------------------------------------------------------
    // Insurance: Auto-resolve cleared conditions
    // -------------------------------------------------------------------

    try {
      const { data: activeInsuranceAlerts, error: activeInsError } = await supabase
        .from('insurance_alerts')
        .select('id, booking_id, alert_type')
        .is('resolved_at', null);

      if (activeInsError) {
        console.error(`[plate-alerts] Active insurance alerts query error: ${activeInsError.message}`);
      } else if (activeInsuranceAlerts) {
        const detectedInsuranceSet = new Set(
          allInsuranceDetected.map((a) => `${a.bookingId}:${a.alertType}`),
        );

        for (const existing of activeInsuranceAlerts) {
          const key = `${existing.booking_id}:${existing.alert_type}`;
          if (!detectedInsuranceSet.has(key)) {
            // Condition no longer exists -- resolve the alert
            const { error: resolveError } = await supabase
              .from('insurance_alerts')
              .update({ resolved_at: new Date().toISOString() })
              .eq('id', existing.id);

            if (resolveError) {
              console.error(
                `[plate-alerts] Failed to resolve insurance alert ${existing.id}: ${resolveError.message}`,
              );
            } else {
              stats.insuranceResolved++;
              console.log(
                `[plate-alerts] Auto-resolved insurance alert ${existing.id} (${existing.alert_type})`,
              );
            }
          }
        }
      }
    } catch (err) {
      console.error(`[plate-alerts] Insurance auto-resolve error: ${err}`);
    }

    // -------------------------------------------------------------------
    // 6. Find plate alerts needing notification (24-hour cooldown)
    // -------------------------------------------------------------------
    let plateAlertsToNotify: PlateAlertItem[] = [];
    let plateAlertIdsToMark: string[] = [];

    try {
      const twentyFourHoursAgo = new Date(
        Date.now() - 24 * 60 * 60 * 1000,
      ).toISOString();

      const { data: pendingAlerts, error: pendingError } = await supabase
        .from('plate_alerts')
        .select('id, plate_id, alert_type, severity')
        .is('resolved_at', null)
        .or(`last_notified_at.is.null,last_notified_at.lt.${twentyFourHoursAgo}`);

      if (pendingError) {
        console.error(
          `[plate-alerts] Pending alerts query error: ${pendingError.message}`,
        );
      } else if (pendingAlerts && pendingAlerts.length > 0) {
        // Match pending alerts to detected data for rich notification content
        const detectedMap = new Map<string, DetectedAlert>();
        for (const d of allDetected) {
          detectedMap.set(`${d.plateId}:${d.alertType}`, d);
        }

        for (const pa of pendingAlerts) {
          const key = `${pa.plate_id}:${pa.alert_type}`;
          const detected = detectedMap.get(key);

          if (detected) {
            plateAlertsToNotify.push({
              plateNumber: detected.plateNumber,
              alertType: detected.alertType,
              severity: detected.severity,
              customerName: detected.customerName,
              customerPhone: detected.customerPhone,
              vehicleInfo: detected.vehicleInfo,
              daysOverdue: detected.daysOverdue,
              daysUntilExpiry: detected.daysUntilExpiry,
            });
            plateAlertIdsToMark.push(pa.id);
          }
        }
      }
    } catch (err) {
      console.error(`[plate-alerts] Plate notification phase error: ${err}`);
    }

    // -------------------------------------------------------------------
    // 6b. Find insurance alerts needing notification (24-hour cooldown)
    // -------------------------------------------------------------------
    let insuranceAlertsToNotify: InsuranceAlertItem[] = [];
    let insuranceAlertIdsToMark: string[] = [];

    try {
      const twentyFourHoursAgo = new Date(
        Date.now() - 24 * 60 * 60 * 1000,
      ).toISOString();

      const { data: pendingInsAlerts, error: pendingInsError } = await supabase
        .from('insurance_alerts')
        .select('id, booking_id, alert_type, severity, notes')
        .is('resolved_at', null)
        .or(`last_notified_at.is.null,last_notified_at.lt.${twentyFourHoursAgo}`);

      if (pendingInsError) {
        console.error(
          `[plate-alerts] Pending insurance alerts query error: ${pendingInsError.message}`,
        );
      } else if (pendingInsAlerts && pendingInsAlerts.length > 0) {
        // Match pending insurance alerts to detected data
        const detectedInsMap = new Map<string, DetectedInsuranceAlert>();
        for (const d of allInsuranceDetected) {
          detectedInsMap.set(`${d.bookingId}:${d.alertType}`, d);
        }

        for (const pia of pendingInsAlerts) {
          const key = `${pia.booking_id}:${pia.alert_type}`;
          const detected = detectedInsMap.get(key);

          if (detected) {
            insuranceAlertsToNotify.push({
              type: detected.alertType,
              severity: detected.severity,
              description: detected.notes,
              bookingId: detected.bookingDisplayId,
              customerName: detected.customerName,
            });
            insuranceAlertIdsToMark.push(pia.id);
          }
        }
      }
    } catch (err) {
      console.error(`[plate-alerts] Insurance notification phase error: ${err}`);
    }

    // -------------------------------------------------------------------
    // 7. Batch and send notifications (plate + insurance combined)
    // -------------------------------------------------------------------
    const hasPlateAlerts = plateAlertsToNotify.length > 0;
    const hasInsuranceAlerts = insuranceAlertsToNotify.length > 0;

    if (hasPlateAlerts || hasInsuranceAlerts) {
      console.log(
        `[plate-alerts] Sending batched notification: ${plateAlertsToNotify.length} plate, ${insuranceAlertsToNotify.length} insurance alert(s)`,
      );

      const adminPhone = Deno.env.get('ADMIN_PHONE');
      const adminEmail = Deno.env.get('ADMIN_EMAIL');

      // Send ONE SMS (combined plate + insurance)
      if (adminPhone) {
        try {
          const smsBody = buildPlateAlertSms(
            plateAlertsToNotify,
            hasInsuranceAlerts ? insuranceAlertsToNotify : undefined,
          );
          const smsResult = await sendSms(adminPhone, smsBody);
          if (smsResult.success) {
            console.log(`[plate-alerts] SMS sent to admin, SID: ${smsResult.sid}`);
          } else {
            console.error(`[plate-alerts] SMS failed: ${smsResult.error}`);
          }
        } catch (smsErr) {
          console.error(`[plate-alerts] SMS error: ${smsErr}`);
        }
      } else {
        console.warn('[plate-alerts] ADMIN_PHONE not set, skipping SMS');
      }

      // Send ONE email (combined plate + insurance)
      if (adminEmail) {
        try {
          const emailHtml = buildPlateAlertEmail(
            plateAlertsToNotify,
            hasInsuranceAlerts ? insuranceAlertsToNotify : undefined,
          );

          // Build subject line reflecting both types of alerts
          const subjectParts: string[] = [];
          if (hasPlateAlerts) {
            subjectParts.push(
              `${plateAlertsToNotify.length} Plate Alert${plateAlertsToNotify.length !== 1 ? 's' : ''}`,
            );
          }
          if (hasInsuranceAlerts) {
            subjectParts.push(
              `${insuranceAlertsToNotify.length} Insurance Alert${insuranceAlertsToNotify.length !== 1 ? 's' : ''}`,
            );
          }
          const subject = `Triple J: ${subjectParts.join(', ')}`;

          const emailResult = await sendEmail({
            to: adminEmail,
            subject,
            html: emailHtml,
          });
          if (emailResult.success) {
            console.log(
              `[plate-alerts] Email sent to admin, ID: ${emailResult.id}`,
            );
          } else {
            console.error(`[plate-alerts] Email failed: ${emailResult.error}`);
          }
        } catch (emailErr) {
          console.error(`[plate-alerts] Email error: ${emailErr}`);
        }
      } else {
        console.warn('[plate-alerts] ADMIN_EMAIL not set, skipping email');
      }

      // Update last_notified_at for plate alerts
      if (plateAlertIdsToMark.length > 0) {
        const { error: updateError } = await supabase
          .from('plate_alerts')
          .update({ last_notified_at: new Date().toISOString() })
          .in('id', plateAlertIdsToMark);

        if (updateError) {
          console.error(
            `[plate-alerts] Failed to update plate last_notified_at: ${updateError.message}`,
          );
        }
      }

      // Update last_notified_at for insurance alerts
      if (insuranceAlertIdsToMark.length > 0) {
        const { error: updateError } = await supabase
          .from('insurance_alerts')
          .update({ last_notified_at: new Date().toISOString() })
          .in('id', insuranceAlertIdsToMark);

        if (updateError) {
          console.error(
            `[plate-alerts] Failed to update insurance last_notified_at: ${updateError.message}`,
          );
        }
      }

      stats.notified = plateAlertsToNotify.length;
      stats.insuranceNotified = insuranceAlertsToNotify.length;
    } else {
      console.log('[plate-alerts] No alerts need notification (within 24h cooldown or none detected)');
    }

    // -------------------------------------------------------------------
    // 8. Return response
    // -------------------------------------------------------------------
    console.log(
      `[plate-alerts] Done. Plates: detected=${stats.detected}, notified=${stats.notified}, resolved=${stats.resolved}. Insurance: detected=${stats.insuranceDetected}, notified=${stats.insuranceNotified}, resolved=${stats.insuranceResolved}`,
    );

    return new Response(JSON.stringify(stats), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (outerError) {
    const errMsg =
      outerError instanceof Error ? outerError.message : String(outerError);
    console.error(`[plate-alerts] Fatal error: ${errMsg}`);
    return new Response(
      JSON.stringify({ error: errMsg, ...stats }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
