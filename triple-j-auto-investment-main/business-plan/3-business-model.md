# Business Model

## Value Proposition

### For Buyers
- **Transparency:** Full vehicle history, inspection reports, cost breakdown
- **AI-Powered Insights:** Gemini-generated descriptions and fair market value analysis
- **Quality Assurance:** NHTSA VIN verification, detailed diagnostics
- **Competitive Pricing:** Lower overhead than traditional dealerships
- **Blockchain Verification:** (Future) Immutable ownership records via NFT certificates

### For Investors (Fractional Ownership - Year 3)
- **Low Barrier to Entry:** $500 minimum vs. $30k+ full vehicle purchase
- **Diversification:** Own shares of multiple vehicles vs. single asset
- **Passive Income:** Profit share when vehicle appreciates and sells
- **Liquidity:** Trade shares on secondary market
- **Transparency:** Smart contract-enforced profit distribution

### For Sellers
- **Fair Market Value:** AI analysis ensures competitive offers
- **Quick Transactions:** Buy vehicles wholesale within 48 hours
- **No Listing Hassles:** We handle reconditioning, photography, marketing

---

## Revenue Streams

### Revenue Stream 1: Vehicle Sales Markup (Current)

**Model:** Buy low, recondition, sell high

**Example Transaction:**
```
Purchase at auction:        $30,000
Reconditioning costs:        $3,000
  - Towing:                    $200
  - Mechanical repairs:      $1,500
  - Cosmetic (detailing):      $800
  - Other (DMV, etc.):         $500
Total Cost:                 $33,000

Sale Price:                 $58,000
Gross Profit:               $25,000
Profit Margin:              43%
```

**Year 1 Target:**
- 24 vehicles sold
- Average markup: $25,000
- Gross Revenue: $600,000
- Gross Margin: 60% ($360,000)

---

### Revenue Stream 2: NFT Certificate Issuance (Year 2)

**Model:** Charge premium for blockchain-verified ownership

**Pricing:**
- Standard Certificate: $100 (economy vehicles)
- Premium Certificate: $200 (luxury vehicles >$50k)
- Includes: NFT minting, IPFS metadata storage, OpenSea listing

**Year 2 Target:**
- 48 vehicles sold with certificates
- Average fee: $100
- Annual Revenue: $4,800

**Value to Customer:**
- Immutable ownership record
- Resale value enhancement (blockchain provenance)
- Bragging rights ("my car is on the blockchain")
- Marketing novelty (first in Houston)

---

### Revenue Stream 3: Fractional Ownership Platform Fees (Year 3)

**Model:** Transaction fee on share purchases

**Example:**
```
Vehicle: 2020 Porsche 911 Carrera
Value: $90,000
Tokenize: 30% equity = 900 shares @ $30 each

Investor A buys 100 shares ($3,000)
Platform fee: 5% × $3,000 = $150

If 900 shares sold:
Platform revenue: 5% × $27,000 = $1,350 per vehicle
```

**Year 3 Target:**
- 10 vehicles tokenized
- Average fractional sale: $30,000
- Total platform fees: $15,000

**Additional Revenue (Future):**
- **Management Fees:** 1% annual AUM on tokenized portfolios
- **Trading Fees:** 2% on secondary market share trades

---

### Revenue Stream 4: Ancillary Services (Future)

**Potential Add-Ons:**
1. **Extended Warranties:** Partner with 3rd party (Endurance, CarShield)
   - Commission: 10-15% of policy price
   - Revenue potential: $500/vehicle

2. **Financing Commissions:** Partner with lenders for customer financing
   - Commission: 1-2% of loan amount
   - Revenue potential: $400/vehicle

3. **Trade-In Services:** Buy customer trade-ins at wholesale
   - Profit margin: $2,000-$5,000 per vehicle

4. **Detailing/Maintenance Packages:** Post-sale services
   - Revenue: $200-$500 per customer

---

## Cost Structure

### Fixed Costs (Monthly)

| Expense | Year 1 | Year 2 | Year 3 |
|---------|--------|--------|--------|
| **Platform Costs** | $200 | $350 | $600 |
| - Supabase | $0 (free tier) | $25 | $25 |
| - VPS Hosting | $50 | $150 | $250 |
| - Domain/SSL | $12/yr → $1 | $1 | $1 |
| - EmailJS | $0 (free tier) | $15 | $25 |
| - Gemini API | $50 | $100 | $250 |
| - Blockchain (Alchemy) | $0 | $50 | $50 |
| **Salaries** | $10,000 | $18,000 | $35,000 |
| - Founders (2) | $10,000 | $15,000 | $25,000 |
| - Sales Manager | - | $3,000 | $5,000 |
| - Mechanic (part-time) | - | - | $3,000 |
| - Compliance Officer | - | - | $2,000 |
| **Rent/Office** | $0 | $500 | $1,500 |
| **Insurance** | $300 | $500 | $800 |
| **Marketing** | $4,000 | $6,000 | $10,000 |
| **Total Fixed** | $14,500/mo | $25,350/mo | $47,900/mo |

---

### Variable Costs (Per Vehicle)

| Cost | Amount |
|------|--------|
| Vehicle Acquisition | Varies ($20k-$50k avg) |
| Towing | $100-$300 |
| Mechanical Repairs | $500-$3,000 |
| Cosmetic (Detailing) | $300-$1,500 |
| Photography | $100 (or DIY = $0) |
| DMV/Title Fees | $200-$500 |
| **Average Total** | $25,000 |

---

## Pricing Strategy

### Competitive Pricing Analysis

**2020 BMW X5 Example:**

| Source | Price | Markup |
|--------|-------|--------|
| **Dealership (AutoNation)** | $52,000 | 30% |
| **Carvana** | $49,500 | 24% |
| **Triple J Target** | $47,000 | 18% |
| **Private Party** | $43,000 | 8% |

**Strategy:** Price 5-10% below dealerships, 5% below Carvana, 5-10% above private party

**Justification:**
- Lower than dealerships: Attract price-sensitive HNW buyers
- Lower than Carvana: Compete with national platforms
- Higher than private party: Justified by verification, warranty, trust

---

### Dynamic Pricing

**Factors:**
1. **Market Demand:** Increase price 10% for hot models (Porsche, Mercedes AMG)
2. **Time on Lot:** Decrease 5% every 30 days unsold
3. **Condition:** Premium 15% for low-mileage, pristine vehicles
4. **Seasonality:** Increase 10% for convertibles in summer, SUVs in winter

---

## Unit Economics

### Year 1 Target (24 Vehicles)

**Revenue per Vehicle:**
```
Sale Price: $45,000 (average)
Cost of Vehicle: $20,000 (auction/wholesale)
Reconditioning: $3,000
Gross Profit: $22,000
Gross Margin: 49%
```

**Contribution Margin (after variable costs):**
```
Gross Profit: $22,000
Marketing (allocated): $2,083 ($50k / 24 vehicles)
Net Contribution: $19,917 per vehicle
```

**Break-Even:**
```
Fixed Costs: $14,500/month × 12 = $174,000
Contribution per Vehicle: $19,917
Break-Even Units: 174,000 / 19,917 = 8.7 vehicles
```

**Required Sales:** 9 vehicles to cover fixed costs, 15+ to be profitable

---

## Customer Acquisition Cost (CAC)

**Year 1 Marketing Budget:** $50,000

**Channels:**
1. **Google Ads:** $24,000 (48% of budget)
   - CPC: $3.50 (keyword: "luxury cars Houston")
   - Clicks: 6,857
   - Conversion Rate: 2%
   - Customers: 137
   - CAC: $175

2. **SEO / Content Marketing:** $10,000 (20%)
   - Organic traffic: 10,000 visitors
   - Conversion: 1.5%
   - Customers: 150
   - CAC: $67

3. **Social Media (Instagram/Facebook):** $12,000 (24%)
   - Impressions: 500,000
   - CTR: 0.8%
   - Clicks: 4,000
   - Conversion: 1%
   - Customers: 40
   - CAC: $300

4. **Referrals / Word of Mouth:** $4,000 (8% - referral bonuses)
   - Customers: 10
   - CAC: $400

**Blended CAC:** $50,000 / 337 total customers = **$148**

**Customer Lifetime Value (LTV):**
- Average purchases: 1.2 vehicles over 5 years (repeat customers)
- Revenue per customer: 1.2 × $45,000 = $54,000
- Gross Profit: 1.2 × $22,000 = $26,400

**LTV:CAC Ratio:** $26,400 / $148 = **178x** (exceptional, validates model)

---

## Scalability

### Path to $10M Annual Revenue (Year 5)

**Required Sales:**
- $10M revenue / $45k avg vehicle = 222 vehicles/year
- = 18.5 vehicles/month (currently: 2 vehicles/month Year 1)

**Growth Strategy:**
1. **Increase Inventory:** Acquire 10-15 vehicles at a time (bulk discounts)
2. **Hire Sales Team:** 3 salespeople @ 6 vehicles/month each = 18/month
3. **Geographic Expansion:** Dallas + Austin markets (2x TAM)
4. **Fractional Ownership:** Tokenize 50 vehicles (adds $250k platform fees)

**Infrastructure Needs:**
- Larger facility for 20+ vehicle inventory
- Full-time mechanic for faster reconditioning
- CRM manager for lead nurturing

---

## Conclusion

Our business model combines:
1. **Proven Revenue Stream:** Vehicle sales with healthy 49% gross margins
2. **Innovative Add-Ons:** NFT certificates and fractional ownership differentiate us
3. **Scalable Unit Economics:** 178x LTV:CAC ratio enables aggressive growth
4. **Low Fixed Costs:** Asset-light model (no expensive showroom) maximizes profitability

**Year 3 Projected Revenue Mix:**
- Vehicle Sales: 95% ($1,800,000)
- NFT Certificates: 0.5% ($10,800)
- Fractional Fees: 0.8% ($15,000)
- **Total: $1,825,800**

As fractional ownership scales, platform fees will grow to 10-20% of revenue by Year 5.

---

**Last Updated:** December 24, 2024
