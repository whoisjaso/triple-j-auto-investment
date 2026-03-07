---
phase: 12-seo-foundation
plan: 04
subsystem: seo-content
tags: [faq, aeo, geo, schema, translations, bilingual, bhph, answer-capsule]

dependency_graph:
  requires: [12-01, 12-02]
  provides: [expanded-faq-23-bilingual, bhph-content, answer-capsule-services, faq-schema-33-questions]
  affects: [13-focus-capture]

tech_stack:
  added: []
  patterns: [answer-capsule-format, dual-language-faq-schema, bhph-process-block]

key_files:
  created: []
  modified:
    - triple-j-auto-investment-main/utils/translations.ts
    - triple-j-auto-investment-main/index.html

decisions:
  - id: 12-04-01
    decision: "FAQ expanded to 23 questions per language (46 total) -- exceeds 20+ target"
    rationale: "Covered all query clusters (financing, price, rental, trust) plus retained and enhanced all 8 original questions"
  - id: 12-04-02
    decision: "Separate Spanish FAQPage schema block with inLanguage='es' rather than mixing languages in one block"
    rationale: "AI engines can more reliably cite language-appropriate answers when schema explicitly declares language"
  - id: 12-04-03
    decision: "Spanish FAQ schema limited to 10 highest-value questions (vs 23 English)"
    rationale: "Schema size trade-off: full 23 Spanish questions would double schema bulk; 10 covers the top conversational queries AI users actually ask in Spanish"
  - id: 12-04-04
    decision: "'Financing Assistance' renamed to 'In-House Financing' / 'Financiamiento Interno' in services"
    rationale: "More specific and accurate -- matches BHPH model; better for AI extraction"
  - id: 12-04-05
    decision: "Added bhph{} block to finance translations (en+es) with processSteps, whyTitle, whyItems"
    rationale: "Structured BHPH content enables future UI rendering and provides clear answer-capsule data for AI extraction"

metrics:
  duration: "~7 minutes"
  completed: "2026-02-16"
---

# Phase 12 Plan 04: GEO/AEO Gap Closure Summary

**One-liner:** Expanded bilingual FAQ from 8 to 23 questions targeting AI search queries, added BHPH answer-capsule content to finance/services, and updated FAQ schema to 33 total questions (23 EN + 10 ES).

## What Was Done

### Task 1: Expand FAQ questions in translations.ts
- Grew `t.en.faq.questions[]` from 8 to 23 questions
- Grew `t.es.faq.questions[]` from 8 to 23 questions (natural Mexican Spanish)
- Added 15 new questions per language across 4 clusters:
  - **Financing (6):** bad credit, BHPH, down payment, credit check, documents, in-house financing
  - **Price/Inventory (3):** under $5K, cheapest car, SUVs/trucks under $8K
  - **Rental (3):** rental cost, no credit card, weekly/monthly
  - **Trust/Process (3):** licensed dealer, reliability, post-purchase
- Every answer uses answer-capsule format: direct 1-2 sentence answer FIRST, then details
- Every answer includes "Triple J Auto Investment" branded attribution
- Every answer includes specific data points: $3,000-$8,000, (832) 400-9760, 8774 Almeda Genoa Road
- Spanish uses natural Mexican Spanish phrasing (tu/tus informal, "carro" not "auto", "enganche" not "anticipo")

### Task 2: Enhance Finance and Services content with answer capsules
- **Finance intro:** Rewritten as answer capsule ("Triple J Auto Investment offers in-house Buy Here Pay Here financing...")
- **Finance bhph block:** New `bhph{}` object with processTitle, processIntro, 4 processSteps, whyTitle, 5 whyItems (en+es)
- **Finance options:** Steps updated with specific details (price range, document list, same-day drive-off)
- **Services list:** All 5 service descriptions rewritten with answer-capsule format
  - Vehicle Sales: "Triple J Auto Investment sells reliable pre-owned vehicles in the $3,000-$8,000 range..."
  - Vehicle Rentals: "Triple J Auto Investment offers affordable vehicle rentals in Houston by the week or month..."
  - VIN History: "Triple J Auto Investment provides free VIN lookup..."
  - In-House Financing: "Triple J Auto Investment provides in-house Buy Here Pay Here financing with no credit check..."
  - Trade-In: "Triple J Auto Investment accepts trade-ins and applies the value directly..."
- Spanish equivalents mirror English structure with natural Mexican Spanish

### Task 3: Update FAQ schema in index.html
- Replaced old 8-question FAQPage schema with 23-question English FAQPage (inLanguage="en")
- Added new separate 10-question Spanish FAQPage (inLanguage="es")
- All schema answers are concise capsule versions (40-60 words)
- Targets high-value conversational queries:
  - "Can I buy a car with bad credit in Houston?"
  - "What is Buy Here Pay Here financing?"
  - "What cars can I get for under $5,000 in Houston?"
  - "Cuanto cuesta rentar un carro en Houston?"
  - "Puedo comprar un carro con mal credito en Houston?"
- All 6 JSON-LD blocks validated as valid JSON

## Verification

- [x] FAQ has 23 questions per language (46 total, target was 20+)
- [x] FAQ questions include BHPH, no-credit-check, affordable cars queries
- [x] Spanish FAQ uses natural Mexican Spanish (carro, enganche, tu/tus)
- [x] FAQ schema in index.html matches expanded content (23 EN + 10 ES)
- [x] Finance content includes BHPH process with answer-capsule format
- [x] Services content includes answer-capsule descriptions for all 5 services
- [x] Branded "Triple J Auto Investment" in every answer (84 total mentions in file)
- [x] Specific data included: $3,000-$8,000, (832) 400-9760, 8774 Almeda Genoa Road
- [x] All JSON-LD blocks valid (6 blocks, all parse correctly)
- [x] Pre-existing TS errors unchanged (SEO.tsx hreflang, About.tsx animation types)

## Deviations from Plan

None -- plan executed exactly as written.

## Commits

| # | Hash | Type | Description |
|---|------|------|-------------|
| 1 | e925fd0 | feat | Expand FAQ from 8 to 23 bilingual questions targeting AI search |
| 2 | 9d348b9 | feat | Add answer-capsule content to finance and services pages |
| 3 | d25e602 | feat | Expand FAQ schema to 23 English + 10 Spanish questions for AEO |

## Files Modified

| File | Changes |
|------|---------|
| `triple-j-auto-investment-main/utils/translations.ts` | +365 lines (FAQ expansion + BHPH + answer capsules) |
| `triple-j-auto-investment-main/index.html` | +212 lines (FAQ schema expansion) |
