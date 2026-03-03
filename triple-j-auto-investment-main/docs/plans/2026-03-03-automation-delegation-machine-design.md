# Triple J Auto Investment: Automation & Delegation Machine Design

**Date**: 2026-03-03
**Goal**: Transform every manual workflow into an automated, employee-delegatable system
**Approach**: Hybrid — Smart Command Center + Autopilot + Employee Playbook
**North Star**: Any untrained employee opens the app and knows exactly what to do

---

## 1. Smart Command Center (The Hub)

Replace the current admin dashboard with a single "Mission Control" screen that tells anyone exactly what needs attention RIGHT NOW.

### Layout

**Zone 1 — Action Queue (primary, 60% of screen)**

A prioritized list of tasks, sorted by urgency. Each item is one line with one action button. Items auto-generate from existing data (leads, registrations, rental_bookings, plates, insurance, session_events). No manual entry.

Priority levels:
- **URGENT**: Rentals returning today, overdue payments, expired insurance during active rental
- **HIGH**: Leads that responded, registrations ready to advance, new leads (Divine called)
- **MEDIUM**: Stale inventory (21+ days), price opportunities, document collection needed
- **LOW**: Insurance expiring soon, plate approaching expiry, referral activity
- **INFO**: Revenue milestones, referral usage, weekly trends

Each item has a one-click action: "Advance Stage", "Schedule Visit", "Adjust Price", "Notify Customer", "Mark Returned", etc.

**Zone 2 — Quick Stats + Financials (sidebar, 40%)**

- Vehicles: X Available / Y Pending / Z Sold this month
- Revenue: $X this month / $Y profit / Z% margin
- Cost breakdown: mechanical / cosmetic / towing totals
- Best/worst performer by profit
- Leads: X New / Y Contacted / Z Qualified this week
- Registrations: X in progress / Y ready for delivery
- Rentals: X active / $Y rental revenue this month

**Zone 3 — Customer Comms Feed (below action queue)**

Live feed of all customer interactions:
- SMS replies, Divine call summaries, lead form submissions
- Notification delivery confirmations
- Owner portal activity (referral shares, review completions)
- Each item links to the relevant lead/registration/rental for one-click action

**Zone 4 — Quick Actions Bar (bottom/floating)**

Big buttons for the most common tasks:
- `+ New Vehicle` (opens Quick-Intake Wizard)
- `+ New Registration` (opens guided flow)
- `+ New Rental Booking` (opens booking wizard)
- `View All Leads`
- `View Calendar`

---

## 2. Vehicle Quick-Intake Wizard

Streamlined wizard: "just bought a car at auction" to "live on the website" in under 2 minutes.

### Flow

**Step 1 — VIN Scan (10 seconds)**
- Paste or type VIN
- Auto-decode via NHTSA: Year, Make, Model, Body Type, Engine, Transmission, Drive Type
- All fields pre-populated — verify only
- Status auto-set to "Draft" (not visible to customers)

**Step 2 — Costs & Pricing (20 seconds)**
- Purchase price (what you paid)
- Towing cost
- Estimated mechanical cost
- Estimated cosmetic cost
- System suggests listing price: `(total cost x 1.4)` rounded to nearest $500
- Market estimate shown for reference
- Adjust as needed

**Step 2.5 — Condition & Source (20 seconds)**
- Condition checklist (quick toggles):
  - Check Engine Light / Dents / Scratches / Tire Wear / Interior Damage / Mechanical Issues / Other
- Free-text notes for specifics ("Driver door ding, rear bumper scuff")
- Source: Auction (Manheim / ADESA / Other) / Wholesale Dealer / Private Seller / Trade-In
- Seller name/reference (optional, for records)
- Feeds directly into AI content generation (honest disclosure)

**Step 3 — Photos (30 seconds)**
- Drag-and-drop or mobile camera upload
- Multi-select (upload 10+ at once)
- First photo auto-set as primary
- Auto-compressed for web

**Step 4 — AI Content (15 seconds, automatic)**
- System auto-generates ALL in parallel (no button clicking):
  - Description (EN)
  - Identity Headline (EN + ES)
  - Vehicle Story (EN + ES)
- Review and tweak if needed
- AI acknowledges condition issues honestly

**Step 5 — Review & Publish (15 seconds)**
- Preview card exactly as customer will see it
- Toggle: "Publish now" (Available) or "Keep as Draft"
- Toggle: "Available for Rental" (sets listing_type)
- If rental: set daily/weekly rates
- One click to publish

**Total time**: ~90 seconds for a complete, AI-enhanced listing.

---

## 3. Auto-Nurture Lead Pipeline

After a lead comes in and Divine makes the initial call, the system automatically follows up. Human takeover only when customer engages.

### Sequence

```
Lead comes in (form, call, chat)
  -> Divine calls immediately (existing)
  -> IF connected: Lead tagged "Contacted"
  -> IF no answer:
      T+2h:  Auto-SMS (approved template)
      T+24h: Divine re-call attempt (automated voice, same vehicle context)
      T+48h: Auto-SMS with vehicle photo
      T+72h: Auto-email with payment calculator + similar vehicles
      T+7d:  Final SMS with urgency ("X other inquiries this week")
      T+14d: Auto-tag "Cold" - removed from active pipeline

  -> IF customer responds at ANY point:
      -> Lead auto-promoted to "Engaged"
      -> Shows in Command Center Action Queue as HIGH priority
      -> Human takes over personally

  -> IF customer schedules visit:
      -> Auto-SMS confirmation with address + directions
      -> T-1h: Auto-SMS reminder
      -> T+1d after visit: Auto-SMS "Thanks for visiting!"
```

### Template Approval Mode

When first set up, admin reviews and edits every message template. Once approved, they send automatically. Any template can be toggled back to "manual approval" mode. A "Template Manager" page lets you edit all auto-messages in one place with live preview.

### What shows on Command Center

- Only leads that RESPONDED or SCHEDULED show as action items
- Cold leads disappear automatically
- Pipeline Health stat: "X leads in nurture / Y engaged / Z scheduled this week"
- Drill-in available for full pipeline view

### Bilingual

All auto-messages sent in customer's preferred language (captured at form submission or detected by AI chat).

---

## 4. Registration Auto-Pilot

Registration tracking becomes nearly hands-free. System reminds admin what to do, auto-notifies customers, eliminates "where's my registration?" calls.

### Automations

1. **Auto-notify on stage change**: Advancing a registration stage automatically notifies the customer via their preferred channel (SMS/email). No separate step. Uses existing notification_queue + Edge Functions.

2. **Guided stage advancement**: Command Center shows time-based prompts: "Registration TJ-2026-0015 in 'submitted_to_dmv' for 5 days — check DMV status?" with one-click action buttons.

3. **Document collection reminders**: If registration in "sale_complete" and documents not uploaded in 3 days, auto-SMS customer with missing document list and portal link.

4. **Customer document upload portal**: Customers upload documents directly through the tracking portal (`/track/:accessKey`). Documents appear in admin registration view for verification. Eliminates texting photos back and forth.

5. **Proactive weekly updates**: Even when nothing changes, send weekly status updates: "Hi [Name], your registration is with the DMV (Stage 4 of 6). Estimated completion: [X days]. Track anytime: [link]"

6. **Sticker delivery coordination**: When stage reaches "sticker_ready", auto-SMS: "Great news! Your registration sticker is ready. Call (832) 400-9760 to schedule pickup."

### Employee Mode

Any employee can advance stages. System validates transitions, auto-notifies, and logs everything to audit trail. No tribal knowledge required.

---

## 5. Rental Streamlined Wizards

Rental workflow becomes a guided checklist that any employee can follow perfectly.

### Booking Wizard (8 Steps)

1. Select vehicle (shows available rentals with rates)
2. Select/create customer (auto-fill from phone lookup, pre-fill insurance from cache)
3. Pick dates (calendar shows conflicts visually)
4. Insurance collection (upload card, auto-validate Texas 30/60/25 minimums)
5. Agreement signature (digital, auto-generated agreement)
6. Assign plate (shows available dealer plates)
7. Condition report (guided photo checklist: front, rear, left, right, interior, odometer)
8. Confirm & dispatch

### Return Wizard (6 Steps)

1. Post-rental condition report (guided photos, side-by-side compare with checkout)
2. Mileage recording
3. Damage assessment (if any, auto-calculate charges)
4. Collect plate (mark returned)
5. Late fee calculation (auto, with override option)
6. Final payment summary

### Auto-Alerts

- T-1 day: SMS customer "Your rental return is tomorrow"
- T+0 (return day): Dashboard alert "Rental #X due back today"
- T+1 day overdue: Auto-SMS customer + dashboard URGENT alert
- Insurance expiring during rental: Dashboard URGENT alert + customer SMS
- Plate approaching expiry: Dashboard alert

### Payment Tracking

- Payment ledger per booking (amount, date, method, received by)
- Outstanding balance calculation (total cost - payments received)
- Auto-SMS for overdue payments at 3, 7, 14 days
- Dashboard alert for outstanding balances

### Employee Checklist View

Every step has a checkbox. At a glance: "Booking #TJ-R-2026-0042: Insurance check, Agreement check, Plate check, Condition Report X — BLOCKED: need checkout photos"

---

## 6. Proactive Intelligence Layer

System watches everything and surfaces insights before you'd think to look.

### Alert Types

| Alert | Trigger | Action |
|-------|---------|--------|
| Stale inventory | Vehicle listed 21+ days, 0 leads | Suggest price reduction |
| Price opportunity | Market estimate > listing price by 10%+ | Suggest price increase |
| Hot lead | Customer viewed same vehicle 3+ times | Auto-promote in pipeline |
| Referral momentum | Referral code used 3+ times in a week | Notify owner |
| Registration delay | Registration in same stage 7+ days | Alert + suggest next step |
| Insurance gap | Active rental with expiring insurance | URGENT alert |
| Revenue milestone | Monthly revenue hits target | Celebratory notification |
| Repeat customer | Customer phone matches previous lead/rental | Tag as "returning" |
| Seasonal trend | Vehicle type inquiry spikes | Suggest acquisition focus |
| Competitor pricing | Similar vehicles priced 10%+ differently | Surface insight |
| Cost anomaly | Vehicle total cost > sold price (loss) | Flag for review |

### Competitor Monitoring

Periodically check comparable listings (same make/model/year/mileage range) on public sources. Surface: "2019 Honda Accord in Houston: avg asking $9,800, your price $8,500 — you're 13% below market."

### Weekly Digest Email (Sunday night)

- Vehicles: added, sold, avg days on lot
- Leads: total, conversion rate, response rate
- Revenue: gross, net, margin
- Registrations: completed, in progress
- Rentals: active, revenue, late returns
- Top referrer of the week
- Recommended actions for next week

---

## 7. Template & Communication Manager

One place to manage ALL automated messages — SMS, email, voice scripts.

### Template Categories

- **Lead nurture**: Follow-up SMS sequence (5 messages), follow-up emails (2), Divine re-call script
- **Registration**: Stage change notifications (6 stages x 2 channels = 12 templates), document reminders, weekly status updates, sticker ready notification
- **Rental**: Booking confirmation, return reminder, overdue notice, payment reminder, insurance expiry warning
- **Owner**: Referral code delivery, review request (3-day and 7-day), upgrade suggestion, service reminder
- **System**: Weekly digest email, competitor pricing alert

### Features

- Edit any template with live preview (see exactly what customer sees)
- Variables highlighted: `{customer_name}`, `{vehicle_year}`, `{vehicle_make}`, `{tracker_link}`, etc.
- Toggle: Auto-send (approved) vs. Manual approval (drafts queue for review)
- Language toggle: Edit EN and ES side-by-side
- Test send: Send to your own phone/email to verify
- History: See every message sent from each template

### Employee Mode

Employees can trigger manual messages but cannot edit templates. Only admin can modify templates.

---

## Architecture Notes

### Data Sources for Command Center Action Queue

The action queue is a computed view that queries:
- `leads` table: New/Engaged leads, response timestamps
- `registrations` table: Stage durations, missing documents, pending notifications
- `rental_bookings` table: Returns due, overdue, payment status
- `rental_insurance` table: Expiring coverage
- `plates` table: Expiring plates, active assignments
- `vehicles` table: Days on lot, view counts, lead counts
- `session_events` table: Repeat visitors, hot vehicles
- `notification_queue` table: Pending/failed notifications
- `owner_referrals` table: Referral activity

Each source generates task objects with: priority, category, title, description, action_type, entity_id, action_url.

### Auto-Nurture Pipeline Architecture

- Scheduled tasks via Supabase pg_cron + Edge Functions
- `follow_up_queue` table tracks scheduled messages with send_after timestamps
- Edge Function processes queue every 5 minutes
- Twilio (SMS) and Resend (email) for delivery
- Retell API for Divine re-calls
- Customer response detection via Twilio webhook -> updates lead status

### Template System Architecture

- `message_templates` table: category, channel, language, subject, body, variables, is_approved, auto_send
- Template rendering: Replace variables at send time from entity data
- Approval workflow: New templates start as manual-approval, admin can toggle to auto-send
- Audit: Every sent message logged with template_id, recipient, timestamp, delivery status

### Competitor Monitoring Architecture

- Scheduled job (daily or weekly)
- Scrape or API-query public listing aggregators for Houston market
- Match by make/model/year/mileage range (+-20%)
- Store in `market_comparables` table
- Surface as intelligence alerts when price delta > 10%

---

## Success Criteria

1. **Time to intake**: Vehicle from "just bought" to "live listing" in under 2 minutes
2. **Lead follow-up**: 100% of leads receive automated follow-up within 2 hours, zero manual effort
3. **Registration updates**: Customers notified within 5 minutes of stage change, zero manual notification
4. **Customer inquiries**: "Where's my registration?" calls reduced by 80%+ via proactive updates
5. **Employee onboarding**: New employee can operate the system on day 1 with zero training (guided wizards + checklists)
6. **Daily admin time**: Owner spends <30 minutes/day on routine operations (vs. hours currently)
7. **Nothing falls through cracks**: Every time-sensitive item surfaces as an alert before it becomes a problem

---

## What This Replaces

| Current State | Future State |
|---------------|-------------|
| Open 5 admin pages to find what needs attention | Open 1 Command Center |
| Manually enter every vehicle field | VIN paste -> auto-populate -> auto-AI -> publish |
| Remember to follow up on leads | System follows up automatically |
| Remember to update registration stages | System prompts you when it's time |
| Manually send notification after stage change | Auto-notify on stage change |
| Customer texts you photos of documents | Customer uploads through portal |
| Customer calls asking "where's my registration?" | Customer gets weekly proactive updates |
| Remember rental return dates | System alerts you and the customer |
| Manually track payments and late fees | Auto-calculate and auto-remind |
| Hope you notice stale inventory | System flags it at 21 days |
| No competitor awareness | System monitors market pricing |
| Train employees by shadowing | System guides every step with checklists |
