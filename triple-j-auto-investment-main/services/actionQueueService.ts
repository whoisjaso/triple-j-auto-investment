// ================================================================
// ACTION QUEUE SERVICE — Intelligence Engine
// Computes prioritized action items from all data sources
// ================================================================

import { supabase } from '../supabase/config';
import { ActionItem, ActionPriority, VehicleStatus } from '../types';

// ================================================================
// HELPERS
// ================================================================

const today = () => new Date().toISOString().slice(0, 10);

const daysAgo = (dateStr: string): number => {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24)));
};

const daysUntil = (dateStr: string): number => {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((d.getTime() - now.getTime()) / (1000 * 3600 * 24));
};

let actionCounter = 0;
const makeId = (prefix: string) => `${prefix}-${++actionCounter}`;

// ================================================================
// MAIN ENTRY POINT
// ================================================================

export async function computeActionQueue(): Promise<ActionItem[]> {
  actionCounter = 0;
  const items: ActionItem[] = [];

  const [
    rentalsData,
    leadsData,
    registrationsData,
    vehiclesData,
    insuranceAlerts,
    plateAlerts,
    referralData,
  ] = await Promise.all([
    fetchRentalActions(),
    fetchLeadActions(),
    fetchRegistrationActions(),
    fetchInventoryActions(),
    fetchInsuranceAlerts(),
    fetchPlateAlerts(),
    fetchReferralActivity(),
  ]);

  items.push(
    ...rentalsData, ...leadsData, ...registrationsData,
    ...vehiclesData, ...insuranceAlerts, ...plateAlerts, ...referralData
  );

  // Sort by priority (urgent first), then by date (newest first)
  const priorityOrder: Record<ActionPriority, number> = {
    urgent: 0, high: 1, medium: 2, low: 3, info: 4,
  };

  return items.sort((a, b) => {
    const diff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (diff !== 0) return diff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

// ================================================================
// FETCH FUNCTIONS
// ================================================================

async function fetchRentalActions(): Promise<ActionItem[]> {
  const items: ActionItem[] = [];
  const todayStr = today();

  const { data, error } = await supabase
    .from('rental_bookings')
    .select('id, booking_id, vehicle_id, customer_id, start_date, end_date, status, total_cost')
    .in('status', ['active', 'overdue', 'reserved']);

  if (error || !data) {
    console.error('Failed to fetch rental actions:', error);
    return [];
  }

  for (const r of data) {
    // URGENT: Rentals returning today
    if (r.end_date === todayStr && r.status === 'active') {
      items.push({
        id: makeId('rental'),
        priority: 'urgent',
        category: 'rental',
        title: `Rental ${r.booking_id} returning today`,
        description: `Vehicle rental ends today. Coordinate return inspection.`,
        actionType: 'return_due',
        actionLabel: 'Mark Returned',
        entityType: 'rental',
        entityId: r.id,
        metadata: { bookingId: r.booking_id, vehicleId: r.vehicle_id },
        createdAt: new Date().toISOString(),
      });
    }

    // URGENT: Overdue rentals
    if ((r.status === 'active' || r.status === 'overdue') && r.end_date < todayStr) {
      const overdueDays = daysAgo(r.end_date);
      items.push({
        id: makeId('rental'),
        priority: 'urgent',
        category: 'rental',
        title: `Rental ${r.booking_id} overdue by ${overdueDays}d`,
        description: `Rental was due ${r.end_date}. Contact customer immediately.`,
        actionType: 'overdue',
        actionLabel: 'Contact Customer',
        entityType: 'rental',
        entityId: r.id,
        metadata: { bookingId: r.booking_id, overdueDays },
        createdAt: new Date().toISOString(),
      });
    }
  }

  // URGENT: Outstanding payment balances > 7 days
  const { data: unpaid, error: unpaidErr } = await supabase
    .from('rental_bookings')
    .select('id, booking_id, total_cost, created_at')
    .in('status', ['active', 'returned', 'overdue']);

  if (!unpaidErr && unpaid) {
    for (const b of unpaid) {
      // Check payments for this booking
      const { data: payments } = await supabase
        .from('rental_payments')
        .select('amount')
        .eq('booking_id', b.id);

      const totalPaid = (payments || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
      const balance = (b.total_cost || 0) - totalPaid;

      if (balance > 0 && daysAgo(b.created_at) > 7) {
        items.push({
          id: makeId('rental'),
          priority: 'urgent',
          category: 'rental',
          title: `Outstanding balance $${balance.toFixed(0)} on ${b.booking_id}`,
          description: `Payment balance outstanding for over 7 days.`,
          actionType: 'payment_due',
          actionLabel: 'Collect Payment',
          entityType: 'rental',
          entityId: b.id,
          metadata: { bookingId: b.booking_id, balance },
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  return items;
}

async function fetchLeadActions(): Promise<ActionItem[]> {
  const items: ActionItem[] = [];
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const { data, error } = await supabase
    .from('leads')
    .select('id, name, phone, status, date, interest')
    .in('status', ['New', 'Contacted', 'Engaged', 'Scheduled'])
    .order('date', { ascending: false })
    .limit(100);

  if (error || !data) {
    console.error('Failed to fetch lead actions:', error);
    return [];
  }

  for (const l of data) {
    // HIGH: Engaged leads (customer responded, needs human action)
    if (l.status === 'Engaged') {
      items.push({
        id: makeId('lead'),
        priority: 'high',
        category: 'lead',
        title: `${l.name} responded — needs follow-up`,
        description: `Lead is engaged and waiting for response. Interest: ${l.interest}`,
        actionType: 'engaged',
        actionLabel: 'Schedule Visit',
        entityType: 'lead',
        entityId: l.id,
        metadata: { name: l.name, phone: l.phone },
        createdAt: l.date || new Date().toISOString(),
      });
    }

    // HIGH: Scheduled visits (upcoming)
    if (l.status === 'Scheduled') {
      items.push({
        id: makeId('lead'),
        priority: 'high',
        category: 'lead',
        title: `${l.name} has a scheduled visit`,
        description: `Customer visit is scheduled. Prepare for walkthrough.`,
        actionType: 'visit_scheduled',
        actionLabel: 'View Details',
        entityType: 'lead',
        entityId: l.id,
        metadata: { name: l.name, phone: l.phone },
        createdAt: l.date || new Date().toISOString(),
      });
    }

    // HIGH: New leads from last 24h
    if (l.status === 'New' && l.date >= yesterday) {
      items.push({
        id: makeId('lead'),
        priority: 'high',
        category: 'lead',
        title: `New lead: ${l.name}`,
        description: `New inquiry received. Interest: ${l.interest}`,
        actionType: 'new_lead',
        actionLabel: 'View Lead',
        entityType: 'lead',
        entityId: l.id,
        metadata: { name: l.name, phone: l.phone, interest: l.interest },
        createdAt: l.date || new Date().toISOString(),
      });
    }
  }

  return items;
}

async function fetchRegistrationActions(): Promise<ActionItem[]> {
  const items: ActionItem[] = [];

  const { data, error } = await supabase
    .from('registrations')
    .select('id, order_id, customer_name, current_stage, sale_date, vehicle_year, vehicle_make, vehicle_model, doc_title_front, doc_title_back, doc_130u, doc_insurance, doc_inspection')
    .neq('current_stage', 'sticker_delivered');

  if (error || !data) {
    console.error('Failed to fetch registration actions:', error);
    return [];
  }

  for (const r of data) {
    // HIGH: Sticker ready for delivery
    if (r.current_stage === 'sticker_ready') {
      items.push({
        id: makeId('reg'),
        priority: 'high',
        category: 'registration',
        title: `Sticker ready for ${r.customer_name}`,
        description: `${r.vehicle_year} ${r.vehicle_make} ${r.vehicle_model} — sticker is ready for delivery.`,
        actionType: 'sticker_ready',
        actionLabel: 'Mark Delivered',
        entityType: 'registration',
        entityId: r.id,
        metadata: { orderId: r.order_id },
        createdAt: new Date().toISOString(),
      });
    }

    // MEDIUM: Document collection needed (3+ days in sale_complete, docs incomplete)
    if (r.current_stage === 'sale_complete' && r.sale_date) {
      const days = daysAgo(r.sale_date);
      const docsComplete = r.doc_title_front && r.doc_title_back && r.doc_130u && r.doc_insurance && r.doc_inspection;
      if (days >= 3 && !docsComplete) {
        items.push({
          id: makeId('reg'),
          priority: 'medium',
          category: 'registration',
          title: `Docs needed: ${r.customer_name}`,
          description: `${days} days since sale, documents still incomplete. Nudge customer.`,
          actionType: 'docs_needed',
          actionLabel: 'Send Reminder',
          entityType: 'registration',
          entityId: r.id,
          metadata: { orderId: r.order_id, daysSinceSale: days },
          createdAt: new Date().toISOString(),
        });
      }
    }

    // HIGH: Registrations ready to advance (stale in same stage 7+ days)
    if (r.sale_date && !['sale_complete', 'sticker_delivered', 'rejected'].includes(r.current_stage)) {
      const stageDays = daysAgo(r.sale_date); // approximate
      if (stageDays >= 7) {
        items.push({
          id: makeId('reg'),
          priority: 'high',
          category: 'registration',
          title: `Registration ${r.order_id} — check status`,
          description: `${r.customer_name}: ${r.current_stage} for ${stageDays}+ days. May need advancement.`,
          actionType: 'advance_stage',
          actionLabel: 'Advance Stage',
          entityType: 'registration',
          entityId: r.id,
          metadata: { orderId: r.order_id, currentStage: r.current_stage },
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  return items;
}

async function fetchInventoryActions(): Promise<ActionItem[]> {
  const items: ActionItem[] = [];

  const { data, error } = await supabase
    .from('vehicles')
    .select('id, make, model, year, price, cost, sold_price, status, date_added, market_estimate')
    .in('status', ['Available', 'Pending', 'Sold']);

  if (error || !data) {
    console.error('Failed to fetch inventory actions:', error);
    return [];
  }

  for (const v of data) {
    // MEDIUM: Stale inventory (21+ days, Available)
    if (v.status === 'Available' && v.date_added) {
      const days = daysAgo(v.date_added);
      if (days >= 21) {
        items.push({
          id: makeId('inv'),
          priority: 'medium',
          category: 'inventory',
          title: `${v.year} ${v.make} ${v.model} — ${days}d on lot`,
          description: `Vehicle listed for ${days} days with no sale. Consider price adjustment.`,
          actionType: 'stale_inventory',
          actionLabel: 'Adjust Price',
          entityType: 'vehicle',
          entityId: v.id,
          metadata: { currentPrice: v.price, daysOnLot: days },
          createdAt: v.date_added,
        });
      }
    }

    // MEDIUM: Price opportunity (marketEstimate > price * 1.1)
    if (v.status === 'Available' && v.market_estimate && v.price) {
      if (v.market_estimate > v.price * 1.1) {
        const delta = v.market_estimate - v.price;
        items.push({
          id: makeId('inv'),
          priority: 'medium',
          category: 'inventory',
          title: `Price opportunity: ${v.year} ${v.make} ${v.model}`,
          description: `Market estimate $${v.market_estimate.toLocaleString()} vs listing $${v.price.toLocaleString()} (+$${delta.toLocaleString()})`,
          actionType: 'price_opportunity',
          actionLabel: 'Review Price',
          entityType: 'vehicle',
          entityId: v.id,
          metadata: { price: v.price, marketEstimate: v.market_estimate, delta },
          createdAt: new Date().toISOString(),
        });
      }
    }

    // LOW: Cost anomaly (totalCost > soldPrice for Sold vehicles)
    if (v.status === 'Sold' && v.sold_price && v.cost) {
      if (v.cost > v.sold_price) {
        items.push({
          id: makeId('inv'),
          priority: 'low',
          category: 'inventory',
          title: `Loss on ${v.year} ${v.make} ${v.model}`,
          description: `Cost $${v.cost.toLocaleString()} exceeded sale price $${v.sold_price.toLocaleString()}.`,
          actionType: 'cost_anomaly',
          actionLabel: 'Review',
          entityType: 'vehicle',
          entityId: v.id,
          metadata: { cost: v.cost, soldPrice: v.sold_price },
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  return items;
}

async function fetchInsuranceAlerts(): Promise<ActionItem[]> {
  const items: ActionItem[] = [];
  const todayStr = today();

  // Get active/reserved rental bookings with insurance
  const { data, error } = await supabase
    .from('rental_insurance')
    .select('id, booking_id, expiration_date, insurance_company, policy_number')
    .not('expiration_date', 'is', null);

  if (error || !data) {
    console.error('Failed to fetch insurance alerts:', error);
    return [];
  }

  // Get active booking IDs
  const { data: activeBookings } = await supabase
    .from('rental_bookings')
    .select('id, booking_id')
    .in('status', ['active', 'reserved']);

  const activeBookingIds = new Set((activeBookings || []).map((b: any) => b.id));

  for (const ins of data) {
    if (!activeBookingIds.has(ins.booking_id)) continue;

    const dLeft = daysUntil(ins.expiration_date);

    // URGENT: Expired insurance on active rental
    if (ins.expiration_date <= todayStr) {
      items.push({
        id: makeId('ins'),
        priority: 'urgent',
        category: 'insurance',
        title: `Expired insurance on rental`,
        description: `Policy ${ins.policy_number || 'unknown'} (${ins.insurance_company || 'unknown'}) expired.`,
        actionType: 'insurance_expired',
        actionLabel: 'Notify Customer',
        entityType: 'rental',
        entityId: ins.booking_id,
        metadata: { policyNumber: ins.policy_number },
        createdAt: new Date().toISOString(),
      });
    }

    // LOW: Insurance expiring within 7 days
    if (dLeft > 0 && dLeft <= 7) {
      items.push({
        id: makeId('ins'),
        priority: 'low',
        category: 'insurance',
        title: `Insurance expires in ${dLeft}d`,
        description: `Policy ${ins.policy_number || 'unknown'} expires ${ins.expiration_date}.`,
        actionType: 'insurance_expiring',
        actionLabel: 'Remind Customer',
        entityType: 'rental',
        entityId: ins.booking_id,
        metadata: { policyNumber: ins.policy_number, daysLeft: dLeft },
        createdAt: new Date().toISOString(),
      });
    }
  }

  return items;
}

async function fetchPlateAlerts(): Promise<ActionItem[]> {
  const items: ActionItem[] = [];
  const todayStr = today();

  const { data, error } = await supabase
    .from('plate_assignments')
    .select('id, plate_id, customer_name, assignment_type, expected_return_date, returned_at, return_confirmed')
    .is('returned_at', null);

  if (error || !data) {
    console.error('Failed to fetch plate alerts:', error);
    return [];
  }

  for (const pa of data) {
    if (!pa.expected_return_date) continue;

    const dLeft = daysUntil(pa.expected_return_date);

    // URGENT: Overdue plate returns
    if (pa.expected_return_date < todayStr && !pa.return_confirmed) {
      items.push({
        id: makeId('plate'),
        priority: 'urgent',
        category: 'plate',
        title: `Overdue plate return: ${pa.customer_name || 'Unknown'}`,
        description: `Plate was due back ${pa.expected_return_date}. ${daysAgo(pa.expected_return_date)} days overdue.`,
        actionType: 'plate_overdue',
        actionLabel: 'Contact Customer',
        entityType: 'plate',
        entityId: pa.plate_id,
        metadata: { assignmentId: pa.id, customerName: pa.customer_name },
        createdAt: new Date().toISOString(),
      });
    }

    // LOW: Plates expiring within 14 days
    if (dLeft > 0 && dLeft <= 14) {
      items.push({
        id: makeId('plate'),
        priority: 'low',
        category: 'plate',
        title: `Plate due back in ${dLeft}d: ${pa.customer_name || 'Unknown'}`,
        description: `Expected return: ${pa.expected_return_date}`,
        actionType: 'plate_expiring',
        actionLabel: 'Remind',
        entityType: 'plate',
        entityId: pa.plate_id,
        metadata: { assignmentId: pa.id, daysLeft: dLeft },
        createdAt: new Date().toISOString(),
      });
    }
  }

  return items;
}

async function fetchReferralActivity(): Promise<ActionItem[]> {
  const items: ActionItem[] = [];

  // Referral codes used 3+ times this week
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  const { data, error } = await supabase
    .from('referral_clicks')
    .select('referral_code')
    .gte('clicked_at', weekAgo);

  if (error || !data) {
    console.error('Failed to fetch referral activity:', error);
    return [];
  }

  // Count clicks per code
  const counts: Record<string, number> = {};
  for (const c of data) {
    counts[c.referral_code] = (counts[c.referral_code] || 0) + 1;
  }

  // Look up referrer names for codes with 3+ clicks
  const hotCodes = Object.entries(counts).filter(([, count]) => count >= 3);

  if (hotCodes.length > 0) {
    const { data: referrals } = await supabase
      .from('owner_referrals')
      .select('referral_code, referrer_name')
      .in('referral_code', hotCodes.map(([code]) => code));

    const nameMap: Record<string, string> = {};
    for (const r of (referrals || [])) {
      nameMap[r.referral_code] = r.referrer_name;
    }

    for (const [code, count] of hotCodes) {
      items.push({
        id: makeId('ref'),
        priority: 'info',
        category: 'referral',
        title: `${nameMap[code] || code} referral used ${count}x this week`,
        description: `Active referral bringing traffic. Consider outreach to referrer.`,
        actionType: 'referral_hot',
        actionLabel: 'View',
        entityType: 'referral',
        entityId: code,
        metadata: { referralCode: code, clickCount: count },
        createdAt: new Date().toISOString(),
      });
    }
  }

  return items;
}

// ================================================================
// QUICK STATS
// ================================================================

export async function computeQuickStats(): Promise<{
  vehicles: { available: number; pending: number; soldThisMonth: number };
  revenue: { thisMonth: number; profit: number; margin: number };
  costs: { mechanical: number; cosmetic: number; towing: number };
  leads: { newThisWeek: number; contacted: number; qualified: number };
  registrations: { inProgress: number; readyForDelivery: number };
  rentals: { active: number; revenueThisMonth: number };
}> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartStr = monthStart.toISOString();

  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  const [vehicleRes, leadRes, regRes, rentalRes, paymentRes] = await Promise.all([
    supabase.from('vehicles').select('status, price, cost, cost_towing, cost_mechanical, cost_cosmetic, cost_other, sold_price, sold_date'),
    supabase.from('leads').select('status, date').order('date', { ascending: false }).limit(500),
    supabase.from('registrations').select('current_stage'),
    supabase.from('rental_bookings').select('status, total_cost, created_at').in('status', ['active', 'reserved', 'returned']),
    supabase.from('rental_payments').select('amount, payment_date').gte('payment_date', monthStartStr.slice(0, 10)),
  ]);

  const vehicles = vehicleRes.data || [];
  const leads = leadRes.data || [];
  const regs = regRes.data || [];
  const rentals = rentalRes.data || [];
  const payments = paymentRes.data || [];

  // Vehicle stats
  const available = vehicles.filter((v: any) => v.status === 'Available').length;
  const pending = vehicles.filter((v: any) => v.status === 'Pending').length;
  const soldThisMonth = vehicles.filter((v: any) =>
    v.status === 'Sold' && v.sold_date && v.sold_date >= monthStartStr.slice(0, 10)
  ).length;

  // Revenue stats (this month's sold vehicles)
  const monthSold = vehicles.filter((v: any) =>
    v.status === 'Sold' && v.sold_date && v.sold_date >= monthStartStr.slice(0, 10)
  );
  const thisMonth = monthSold.reduce((s: number, v: any) => s + (v.sold_price || v.price || 0), 0);
  const totalCost = monthSold.reduce((s: number, v: any) =>
    s + (v.cost || 0) + (v.cost_towing || 0) + (v.cost_mechanical || 0) + (v.cost_cosmetic || 0) + (v.cost_other || 0), 0);
  const profit = thisMonth - totalCost;
  const margin = thisMonth > 0 ? Math.round((profit / thisMonth) * 100) : 0;

  // Cost breakdown (all vehicles)
  const mechanical = vehicles.reduce((s: number, v: any) => s + (v.cost_mechanical || 0), 0);
  const cosmetic = vehicles.reduce((s: number, v: any) => s + (v.cost_cosmetic || 0), 0);
  const towing = vehicles.reduce((s: number, v: any) => s + (v.cost_towing || 0), 0);

  // Lead stats
  const newThisWeek = leads.filter((l: any) => l.date >= weekAgo).length;
  const contacted = leads.filter((l: any) => l.status === 'Contacted').length;
  const qualified = leads.filter((l: any) => l.status === 'Engaged' || l.status === 'Scheduled').length;

  // Registration stats
  const activeStages = ['sale_complete', 'documents_collected', 'submitted_to_dmv', 'dmv_processing'];
  const inProgress = regs.filter((r: any) => activeStages.includes(r.current_stage)).length;
  const readyForDelivery = regs.filter((r: any) => r.current_stage === 'sticker_ready').length;

  // Rental stats
  const activeRentals = rentals.filter((r: any) => r.status === 'active').length;
  const revenueThisMonth = payments.reduce((s: number, p: any) => s + (p.amount || 0), 0);

  return {
    vehicles: { available, pending, soldThisMonth },
    revenue: { thisMonth, profit, margin },
    costs: { mechanical, cosmetic, towing },
    leads: { newThisWeek, contacted, qualified },
    registrations: { inProgress, readyForDelivery },
    rentals: { active: activeRentals, revenueThisMonth },
  };
}
