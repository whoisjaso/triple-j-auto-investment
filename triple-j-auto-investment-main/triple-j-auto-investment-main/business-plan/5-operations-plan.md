# Operations Plan

## Daily Operations Workflow

### 1. Vehicle Sourcing & Acquisition

**Channels:**
- **Auto Auctions:** Manheim, ADESA (primary source - 60% of inventory)
- **Wholesale Dealers:** Direct relationships with high-volume dealers
- **Trade-Ins:** Customer trade-ins (once operational)
- **Private Sellers:** Facebook Marketplace, Craigslist (cherry-pick deals)

**Weekly Cadence:**
1. **Monday:** Review auction listings, identify target vehicles
2. **Tuesday-Wednesday:** Attend virtual auctions, place bids
3. **Thursday:** Arrange towing for won vehicles
4. **Friday:** Inspect arriving vehicles, plan reconditioning

**Target Acquisition Cost:** $20k-$30k per vehicle (luxury segment)

---

### 2. Vehicle Inspection & Reconditioning

**Inspection Process (24-48 hours):**
```
Step 1: VIN Verification
  - NHTSA API lookup (automated via platform)
  - Vehicle specs, recalls, safety ratings
  - Document in Supabase database

Step 2: Mechanical Inspection
  - Engine diagnostics (OBD-II scanner)
  - Transmission, brakes, suspension check
  - Identify repair needs, estimate costs

Step 3: Cosmetic Assessment
  - Exterior (paint, dents, scratches)
  - Interior (seats, dashboard, electronics)
  - Detailing requirements

Step 4: Test Drive
  - Performance validation
  - Note any handling issues
  - Final go/no-go decision
```

**Reconditioning (3-7 days):**
- **Mechanical:** Address safety issues, replace worn parts ($500-$3k)
- **Cosmetic:** Professional detailing, minor paint touch-ups ($300-$800)
- **Detailing:** Full interior/exterior detail ($200)

**Quality Standards:**
- No check engine lights
- All safety features functional
- Clean title (no salvage/rebuilt)
- Mileage < 100k miles (luxury segment)

---

### 3. Photography & Listing Creation

**Photography (2-3 hours per vehicle):**
- **Equipment:** DSLR camera or iPhone 15 Pro
- **Shots Required:** 25-30 photos
  - Exterior: Front, rear, both sides, wheels, VIN plate
  - Interior: Dashboard, seats, trunk, controls
  - Engine bay, undercarriage (if clean)
- **Location:** Clean outdoor setting or studio
- **Editing:** Lightroom batch processing (color correction, cropping)

**Listing Content:**
```
Title: [Year] [Make] [Model] [Trim] - [Mileage]mi - [Key Feature]
Example: "2020 BMW X5 xDrive40i - 42k mi - Premium Package"

Description:
  - AI-generated via Gemini (see services/geminiService.ts)
  - Manual review and editing
  - Highlights: Features, condition, history
  - 300-500 words optimized for SEO

Pricing:
  - Market analysis (Kelly Blue Book, Edmunds, Cars.com comparables)
  - Apply markup formula (cost + recon + 40-60% margin)
  - Final price: $42k-$58k range for typical inventory

Metadata:
  - VIN, make, model, year, mileage
  - Status: Available, Pending, Sold
  - Gallery: JSONB array of image URLs
  - Diagnostics: JSONB with inspection results
```

**Upload to Platform:**
- Add vehicle to Supabase (pages/admin/AdminInventory.tsx)
- Syncs to public Inventory page automatically
- Google Sheets CSV import for legacy data

---

### 4. Lead Management & Sales

**Lead Capture:**
- Website contact form (pages/Contact.tsx)
- Phone calls (setup virtual phone number)
- Walk-ins (once office established)
- Stored in `leads` table (Supabase)

**CRM Workflow:**
```
New Lead → Auto-email (EmailJS) → Assign to salesperson
  ↓
Initial Contact (24 hours)
  ↓
Qualification (budget, timeline, preferences)
  ↓
Vehicle Showing (in-person or virtual tour)
  ↓
Negotiation & Closing
  ↓
Post-Sale Follow-Up (review request, referral ask)
```

**Sales Targets:**
- Year 1: 2 vehicles/month (24/year)
- Lead-to-sale conversion: 7-10%
- Average sales cycle: 7-14 days

---

### 5. Transaction Processing

**Closing Steps:**
1. **Payment Collection:**
   - Cash/Check: Bank verification
   - Financing: Work with customer's lender
   - (Future) Crypto: USDC via smart contract escrow

2. **Title Transfer:**
   - DMV paperwork (Texas Title 130-U form)
   - Release of lien (if applicable)
   - Buyer receives title within 30 days

3. **Vehicle Delivery:**
   - Local pickup (preferred)
   - Delivery service: $200-$500 (100+ miles)

4. **Post-Sale:**
   - Update vehicle status in Supabase (`status = 'Sold'`)
   - Log sale data for financial reporting
   - Request Google/Facebook review (24 hours later)

---

## Staffing Plan

### Year 1: Founders Only (2 People)

**Founder A - Technical Lead:**
- Platform development & maintenance
- AI/blockchain integration
- Analytics & reporting
- **Compensation:** $60k salary + 50% equity

**Founder B - Operations Lead:**
- Vehicle sourcing & acquisition
- Inspections & reconditioning coordination
- Customer sales & relationship management
- **Compensation:** $60k salary + 50% equity

**Total Year 1 Payroll:** $120k

---

### Year 2: Add Sales Support

**Sales Manager** (Hire Month 13)
- Lead qualification & follow-up
- Customer showings & negotiations
- Target: 4 vehicles sold/month (doubles founder capacity)
- **Compensation:** $36k salary + $500/vehicle commission

**Part-Time Mechanic** (Contract, Month 7)
- Mechanical inspections & repairs
- 10-15 hours/week @ $40/hour
- **Compensation:** $24k/year

**Total Year 2 Payroll:** $180k base + commissions

---

### Year 3: Full Team

**Add:**
- **Compliance Officer:** Web3 legal/regulatory (KYC/AML)
- **Marketing Specialist:** SEO, social media, content creation
- **Full-Time Mechanic:** In-house reconditioning

**Total Year 3 Payroll:** $420k

---

## Technology Infrastructure

### Current Stack (Year 1) ✅

**Frontend:**
- React 19.2 + TypeScript
- Vite 6.2 (build tool)
- Tailwind CSS (styling)
- React Router DOM v7 (routing)

**Backend:**
- Supabase (PostgreSQL + Auth + Real-time)
- Google Gemini 2.5-flash (AI descriptions)
- EmailJS (contact form notifications)
- NHTSA API (VIN lookups)

**Hosting:**
- DokPloy on VPS (178.156.146.106)
- Nginx reverse proxy
- Let's Encrypt SSL

**Domain:** [TBD - being configured]

---

### Future Stack (Year 2-3)

**Web3 Infrastructure:**
- Base blockchain (Ethereum L2)
- Alchemy RPC provider
- Pinata IPFS (NFT metadata storage)
- Hardhat (smart contract development)
- ethers.js v6 (blockchain interactions)
- RainbowKit + wagmi (wallet connections)

**Backend API:**
- Node.js + Express + TypeScript
- Redis (caching)
- Bull (transaction queue)
- Socket.io (WebSocket for real-time events)

---

## Facilities & Equipment

### Year 1: Home-Based

**Requirements:**
- Home office for administrative work
- Garage/driveway for vehicle photography
- Public storage for 2-3 vehicle inventory (~$200/month)

**Equipment:**
- Laptop/desktop (already owned)
- Photography: iPhone 15 Pro or DSLR ($1,000)
- OBD-II scanner: $150
- Detailing supplies: $500

---

### Year 2-3: Small Office/Lot

**Facility:**
- 1,500-2,000 sq ft office + small lot
- Capacity: 8-10 vehicles
- Location: Near Almeda Genoa Rd (current address)
- **Rent:** $1,500-$2,000/month

**Equipment:**
- Lift/hoist for inspections: $3,000
- Pressure washer, detailing tools: $1,000
- Security cameras: $500
- Signage: $2,000

---

## Key Performance Indicators (KPIs)

### Operational Metrics

| Metric | Target | Tracking Method |
|--------|--------|-----------------|
| **Inventory Turnover** | 8x/year | Days in inventory (Supabase query) |
| **Reconditioning Time** | <7 days | Created_at → status change |
| **Lead Response Time** | <24 hours | EmailJS timestamps |
| **Conversion Rate** | 7-10% | Leads table → vehicles sold |
| **Customer Satisfaction** | 4.5+ stars | Google Reviews avg rating |
| **Average Sale Price** | $45k | SQL average of sold_price |

### Dashboard (Admin Panel)

**Real-Time Metrics:**
- Current inventory count & value
- Leads by status (New, Contacted, Closed)
- Sales this month vs. target
- Profit per vehicle (cost vs. sold_price)
- AI-generated financial analysis (Gemini)

**Reports:**
- Monthly P&L statement
- Vehicle turnover report
- Lead source attribution
- Customer acquisition cost (CAC) by channel

---

## Risk Management

### Operational Risks

**1. Vehicle Acquisition Quality**
- **Risk:** Buy lemon vehicles with hidden issues
- **Mitigation:**
  - Thorough pre-purchase inspections
  - Auction condition reports review
  - Build relationships with trusted wholesalers

**2. Reconditioning Cost Overruns**
- **Risk:** Repairs exceed estimates, eat into margins
- **Mitigation:**
  - Conservative cost estimates (+20% buffer)
  - Cap recon spending at $4k/vehicle
  - Walk away from money pits

**3. Inventory Stagnation**
- **Risk:** Vehicles sit unsold, capital tied up
- **Mitigation:**
  - Dynamic pricing (reduce 5% every 30 days)
  - Diversify inventory (mix of makes/models)
  - Wholesale exit strategy (sell at cost to liquidate)

---

## Conclusion

Our operations plan emphasizes:
1. **Lean Operations:** Founders-only Year 1 keeps costs low
2. **Quality Control:** Rigorous inspection process ensures customer satisfaction
3. **Technology Leverage:** AI and automation reduce manual work
4. **Scalability:** Clear hiring plan and facility expansion path

**Next Steps:**
1. Finalize SOPs (Standard Operating Procedures) document
2. Create inspection checklist template
3. Set up CRM dashboard in Supabase
4. Train founders on auction bidding strategies

---

**Last Updated:** December 24, 2024
