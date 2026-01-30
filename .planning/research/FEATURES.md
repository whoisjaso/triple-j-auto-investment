# Feature Landscape

**Domain:** Dealership Operations Platform (Texas DMV Registration + Rentals + Customer Portal)
**Researched:** 2026-01-29
**Overall Confidence:** MEDIUM-HIGH

---

## Domain 1: Texas DMV Document Validation

### Table Stakes

Features users (the dealer) expect. Missing = system feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Document completeness checklist | Cannot submit incomplete package | Low | Title front/back, 130-U, inspection (if emissions county), reassignment form |
| SURRENDERED stamp reminder | Required on all titles per webDEALER | Low | Must be stamped front AND back, plus next blank assignment |
| Mileage consistency check | #1 rejection reason per txDMV | Medium | Cross-check 130-U, title, and if available, stored sale record |
| VIN validation | Errors cause rejections | Low | 17 chars, no I/O/Q, self-certification required since Jan 2025 |
| Document scanning guidance | webDEALER rejects copies | Low | Must be originals, grayscale recommended for OCR |
| Registration fee calculator | Dealer needs quick quotes | Low | Vehicle Price x 6.25% + ~$50.75 base + $16.75 inspection replacement fee |

### Differentiators

Features that set product apart from paper checklists or basic systems.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Cross-document validation | Catches inconsistencies before submission | High | Name matching (exactly as on title), date sequencing, mileage progression |
| Document order enforcement | webDEALER requires specific order | Medium | 130-U, then evidence of ownership, then supporting docs |
| Rejection reason prevention | Proactively flags common issues | Medium | Liens not carried forward, odometer brand incorrect, remarks omitted |
| Emissions county detection | Different requirements per county | Low | 17 counties require passing emissions inspection |
| SPV warning | Alerts when sale price << Standard Presumptive Value | Medium | Prevents surprise tax adjustments at county |
| webDEALER deep link | One-click access to submit | Low | Direct link to txdmv portal login |

### Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Automated DMV submission | webDEALER requires dealer login, manual submission | Validate and prepare, provide one-click link |
| OCR/scan processing | Error-prone, liability issues | Accept document confirmation checkboxes |
| Title history lookup | Requires DMV database access we don't have | Focus on current transaction validation |
| Salvage/flood title handling | Cannot submit branded titles via webDEALER | Display warning, direct to county office |

### Feature Dependencies

```
VIN Validation
    |
    v
Document Completeness Check
    |
    v
Cross-Document Consistency
    |
    v
Document Order Validation
    |
    v
Pre-Submission Checklist (pass/fail)
    |
    v
webDEALER Link
```

### Document Requirements by Scenario

**Standard Texas Title Transfer (Dealer to Customer):**
1. Form 130-U (Application for Texas Title and/or Registration)
2. Original Texas Title (front signed by seller, back signed by buyer)
3. SURRENDERED stamp on title (front and back)
4. Passing inspection (emissions counties only) OR self-certification

**Out-of-State Title:**
1. Form 130-U with VIN self-certification checkbox
2. Original out-of-state title with SURRENDERED stamp
3. May require Dealer's Reassignment form if multiple transfers

**Title with Multiple Assignments:**
1. Form 130-U
2. Original Title with SURRENDERED on next blank assignment
3. Dealer's Reassignment of Title (VTR-41-A) if all assignments used
4. SURRENDERED stamp on reassignment form

### Common Rejection Reasons (from txDMV)

| Rejection Reason | Prevention Strategy |
|------------------|---------------------|
| Vehicle info incorrect (year, make, VIN) | VIN validation against NHTSA database |
| Owner info incorrect or signatures omitted | Name matching check, signature reminder |
| Liens omitted or not released | Lienholder field validation |
| Odometer brand/reading incorrect | Mileage progression check |
| Later title record already issued | Warning if title date seems old |
| Surrendered evidence mismatched | Stamp placement checklist |
| Title remarks not carried forward (Rebuilt, Flood) | Cannot process via webDEALER - display warning |

### Sources

- [TxDMV Form 130-U](https://www.txdmv.gov/sites/default/files/form_files/130-U.pdf) - HIGH confidence
- [webDEALER Dealer User Guide December 2025](https://www.txdmv.gov/sites/default/files/body-files/webDEALER_Dealer_User_Guide.pdf) - HIGH confidence
- [TxDMV webDEALER Portal](https://www.txdmv.gov/dealers/webdealer) - HIGH confidence
- [Motor Vehicle Sales Tax](https://comptroller.texas.gov/taxes/motor-vehicle/sales-use.php) - HIGH confidence
- [TXIADA 130-U Updates](https://www.txiada.org/blog_home.asp?display=576) - MEDIUM confidence

---

## Domain 2: Vehicle Rental Management

### Table Stakes

Features users expect from any rental management system.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Availability calendar | Core function - what's available when | Medium | Visual timeline view, drag-to-book |
| Rental agreement generation | Legal requirement | Low | Auto-populate from vehicle + customer data |
| Vehicle status tracking | Know where each car is | Low | Available, Rented, Maintenance, For Sale |
| Customer records | Know who rented what | Low | Contact info, rental history, ID on file |
| Deposit tracking | Financial requirement | Low | Amount held, release date, deductions |
| Return date management | Basic scheduling | Low | Expected return, overdue alerts |

### Differentiators

Features that provide competitive advantage for a small dealer.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Dual inventory mode | Same vehicle can be for sale AND rent | Medium | Triple J specific - flexible inventory |
| LoJack integration | Real-time vehicle location | High | Existing hardware, API integration needed |
| Digital vehicle inspection | Pre/post rental condition with photos | Medium | Reduces damage disputes by 60%+ |
| Authorization holds (not charges) | Industry best practice for deposits | Medium | Hold funds without capturing until return |
| Automated late notifications | Proactive communication | Low | SMS/email when overdue |
| Mileage tracking | Usage-based pricing option | Low | Start/end odometer logging |

### Anti-Features

Features to avoid for a small dealership operation.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Online payment processing | PCI compliance complexity, fees | Track payments received, not process them |
| Dynamic pricing algorithm | Overkill for small fleet | Simple daily/weekly/monthly rates |
| Multi-branch management | Single location operation | Focus on single-site efficiency |
| Keyless/app unlock | Requires hardware investment | LoJack for location only |
| Insurance verification API | Complexity, cost | Manual verification, checkbox confirmation |
| Full accounting integration | Scope creep | Export to QuickBooks/spreadsheet |

### Feature Dependencies

```
Vehicle Inventory (existing)
    |
    +---> Rental Status Field (new)
    |         |
    |         v
    |     Availability Calendar
    |         |
    |         v
    +---> Rental Agreement Generation
              |
              v
          Customer Rental Record
              |
              +---> Deposit Tracking
              |
              +---> Return Management
              |
              v
          LoJack Integration (location check)
              |
              v
          Vehicle Inspection (return)
```

### Deposit Management Best Practices

| Practice | Implementation |
|----------|----------------|
| Use authorization holds | Hold $200-500 on card, don't charge until issues |
| Clear policy display | Show deposit amount, hold duration, deduction conditions |
| Align with deductible | Deposit should match or exceed insurance deductible |
| Document release timing | 10-20 business days for credit card releases |
| Keep records | Store authorization codes, release confirmations |

### Vehicle Condition Inspection Checklist

**Exterior (photo each):**
- Front bumper/hood
- Driver side
- Rear bumper/trunk
- Passenger side
- Roof (if visible damage)
- Wheels/tires (all 4)

**Interior:**
- Dashboard/controls
- Front seats
- Rear seats
- Trunk/cargo area
- Fuel level
- Odometer reading

**Functional:**
- Lights (headlights, brake, turn signals)
- Horn
- Wipers
- AC/Heat
- Locks/windows

### Sources

- [Adamosoft: 25 Must-Have Car Rental Features](https://adamosoft.com/blog/travel-software-development/must-have-features-of-car-rental-management-software/) - MEDIUM confidence
- [Camasys: 7 Must-Have Features](https://www.camasys.com/posts/7-must-have-features-in-modern-car-rental-software) - MEDIUM confidence
- [VEVS: Deposit Management](https://www.vevs.com/car-rental-software/blog/how-car-rental-companies-handle-deposit-and-security-payments-for-online-reservations-182.php) - MEDIUM confidence
- [Record360: Inspection Checklist](https://record360.com/blog/what-to-check-when-renting-a-car-an-inspection-checklist/) - MEDIUM confidence
- [LoJack Fleet Features](https://www.lojack.com/) - HIGH confidence

---

## Domain 3: Customer Status Tracking Portal

### Table Stakes

Features customers expect from any order/status tracking system.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Visual progress indicator | Shows where they are in process | Low | Horizontal bar with stages, checkmarks |
| Current status prominently displayed | Primary information need | Low | Large, clear, top of page |
| Estimated completion timeframe | Manages expectations | Low | "Typically 5-7 business days" per stage |
| Access without login | Convenience for one-time check | Low | Unique link via SMS/email |
| Mobile-responsive design | Most will check on phone | Low | Already in codebase architecture |
| Status history | See what's happened | Low | Timeline of all stage changes with dates |

### Differentiators

Features that make the experience exceptional (Domino's/Uber level).

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Push notifications on status change | Proactive vs. pull | Medium | SMS or email when status advances |
| Stage-specific messaging | Reduces anxiety with context | Low | "DMV typically takes 3-5 days" |
| Human element | Builds trust | Low | "Submitted by [dealer name]" |
| What's needed indicator | Clear next action | Low | If stuck at "Documents Needed", show what's missing |
| Estimated completion date | Concrete expectation | Medium | Based on historical processing times |
| No login required but login available | Flexibility | Medium | Link for quick access, account for history |

### Anti-Features

Features to avoid in status tracking.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Too many stages | Creates anxiety, users obsessively check | 6 stages max, meaningful transitions |
| Real-time DMV status | We don't have API access | Update when dealer manually advances |
| Excessive notifications | Notification fatigue | Notify only on stage changes |
| Complex login requirements | Friction for simple check | Unique link as primary access |
| Chat/support integration | Scope creep, staffing needs | Dealer phone number prominently displayed |
| ETA countdown timer | Creates false precision | Use ranges ("3-5 business days") |

### The 6-Stage Model (from PROJECT.md)

| Stage | Customer Sees | What's Actually Happening | Typical Duration |
|-------|---------------|---------------------------|------------------|
| 1. Sale Complete | "Your vehicle purchase is complete!" | Car sold, plates issued, 60-day permit active | Day 0 |
| 2. Documents Needed | "We need a few things from you" | Waiting: insurance, inspection, registration fee | 1-14 days |
| 3. All Documents Received | "We have everything - preparing your paperwork" | Dealer preparing submission | 1-3 days |
| 4. Submitted to DMV | "Your registration is with the DMV" | Filed via webDEALER | 1 day |
| 5. DMV Processing | "DMV is reviewing your registration" | Awaiting approval | 3-10 days |
| 6. Registration Complete | "Your registration is ready!" | Sticker picked up from tax office | Done |

### Notification Strategy

| Event | Channel | Message Example |
|-------|---------|-----------------|
| Initial (Stage 1) | SMS + Email | "Your Triple J registration tracker is ready: [link]" |
| Documents Needed | SMS | "We need your insurance and inspection to proceed: [link]" |
| Stage Advance | SMS | "Update: Your registration moved to [stage name]. [link]" |
| Complete | SMS + Email | "Great news! Your registration is ready for pickup." |
| Stuck >7 days | Email only | "Status update on your registration..." |

### Design Guidelines (from NN/g Research)

**Must implement:**
1. Prioritize the latest update (top of page, prominent)
2. Use plain language (no "fulfilled" or "processing queue")
3. Make information scannable (clear spacing, visual distinction)
4. Display historical updates with dates
5. Include direct link in notifications (no login required)
6. Provide specific error messages if stuck

**Recommended:**
7. Allow notification preferences (SMS vs email vs both)
8. Enable tracking from customer account (for repeat customers)
9. Regular updates even if minor ("Still processing...")
10. Ensure consistency between tracker and any verbal updates

### Visual Design Patterns

**Progress Bar:**
- Horizontal for mobile-friendly
- Completed stages: filled/colored + checkmark
- Current stage: highlighted/animated
- Future stages: outlined/gray
- Show stage labels below bar

**Stage Detail:**
- Current stage name large and bold
- Brief description of what's happening
- If action needed: prominent call-to-action
- Timeline of previous stages below

**Animations (per PROJECT.md):**
- Golden Crest logo animation
- Car animation for visual interest
- Subtle transitions on stage change

### Sources

- [NN/g: 16 Design Guidelines for Status Trackers](https://www.nngroup.com/articles/status-tracker-progress-update/) - HIGH confidence
- [The Hustle: Domino's Pizza Tracker](https://thehustle.co/originals/how-the-dominos-pizza-tracker-conquered-the-business-world) - HIGH confidence
- [Medium: Revamping Domino's Track Order](https://medium.muz.li/revamping-the-track-order-experience-at-dominos-8e4e801a6f12) - MEDIUM confidence
- [Uber Eats Live Activities](https://www.macrumors.com/2023/05/02/uber-eats-live-activities/) - MEDIUM confidence
- [MagicBell: SMS Notification Best Practices](https://www.magicbell.com/blog/sms-notification-best-practices) - MEDIUM confidence

---

## MVP Recommendation

### Phase 1: Registration Checker + Status Portal (Core Value)

**Build first - delivers core value proposition:**

1. **Registration Checker (Table Stakes)**
   - Document completeness checklist
   - SURRENDERED stamp reminder
   - Basic mileage consistency check
   - VIN validation
   - Registration fee calculator
   - webDEALER quick link

2. **Customer Status Portal (Table Stakes)**
   - 6-stage visual progress bar
   - Current status prominent display
   - Access via unique link (no login)
   - Stage history timeline
   - Mobile-responsive

3. **Notifications (One Differentiator)**
   - SMS on stage change (using existing infrastructure)

### Phase 2: Rental Management

**Build second - new revenue stream:**

1. **Rental Basics (Table Stakes)**
   - Dual inventory mode (sale/rent/both)
   - Availability calendar
   - Rental agreement generation
   - Customer rental records
   - Deposit tracking

2. **Rental Differentiators**
   - LoJack integration (location only)
   - Digital vehicle inspection (photo-based)

### Phase 3: Advanced Validation + Enhancements

**Build third - reduces errors:**

1. **Registration Differentiators**
   - Cross-document validation (name/date/mileage)
   - Document order enforcement
   - Rejection reason prevention
   - Emissions county detection

2. **Portal Enhancements**
   - Customer login option
   - Notification preferences
   - Estimated completion dates

### Defer to Post-MVP

- Authorization holds (payment processing complexity)
- SPV warning system (requires external data)
- Advanced LoJack features (kill switch, geofencing)
- Multi-language notifications (English first)

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| txDMV Requirements | HIGH | Official documentation, webDEALER user guide |
| Rejection Reasons | MEDIUM-HIGH | Official sources + dealer community |
| Rental Features | MEDIUM | Industry surveys, not Texas-specific |
| Status Tracking UX | HIGH | NN/g research, Domino's/Uber case studies |
| LoJack Integration | LOW | Need to verify specific API availability |

---

*Feature landscape research: 2026-01-29*
