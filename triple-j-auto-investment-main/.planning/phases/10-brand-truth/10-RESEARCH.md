# Phase 10: Brand Truth - Research

**Researched:** 2026-02-15
**Domain:** Content audit, translation system, brand alignment
**Confidence:** HIGH

## Summary

This research is a comprehensive audit of every customer-facing file in the Triple J Auto Investment codebase. The goal is to identify all content that needs to change to align with the "automotive investment firm" positioning using real business data, while removing internal framework jargon (SOVEREIGN, FATE, PRISM, PCP, Six-Axis) that leaked into customer-visible pages.

The current site reads like a military-psychological operations center, not an automotive dealership. Nearly every page contains language from the internal SOVEREIGN framework that was never meant for customer eyes: "ARCHITECT REALITY," "Subconscious Indoctrination," "Dominion Established," "Sovereign Vetting," "Psychological Moonshot." The hero section literally flashes subliminal words like "AUTHORITY," "CONTROL," "DOMINION," and "SOVEREIGNTY" at visitors. The About page talks about "rewriting source code of identity" and "psychological leverage." The footer says "Sovereign Entity" instead of the business name. Fallback vehicle descriptions reference Rolls-Royces and Lamborghinis ($265K-$289K) -- vehicles that have nothing to do with a $3K-$8K pre-owned dealer.

The translation system is centralized in `utils/translations.ts` with a `LanguageContext` provider. Both English and Spanish versions contain the same jargon. However, the About page, FAQ page, Services page, Finance page, Policies page, Legal page, PaymentOptions page, and NotFound page all have hardcoded English strings NOT in the translation system. This is a significant discovery: most pages bypass the translation system entirely.

**Primary recommendation:** Rewrite all customer-facing content to reflect an honest Houston family automotive dealership selling $3K-$8K pre-owned vehicles, update the translation system to include ALL page content (not just a few pages), and remove every instance of internal framework jargon from customer-visible code.

## Standard Stack

No new libraries are needed for this phase. This is a pure content/copy phase.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | Existing | Component framework | Already in use |
| react-router-dom | Existing | Routing | Already in use |
| framer-motion | Existing | Animations | Already in use |
| lucide-react | Existing | Icons | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| LanguageContext | Custom | Bilingual support | All translated content |
| utils/translations.ts | Custom | Translation strings | All UI text |

**No installation needed.** This phase modifies existing files only.

## Architecture Patterns

### Translation System Architecture

The translation system is a simple key-value object in `utils/translations.ts`:

```typescript
// utils/translations.ts
export const t = {
    en: {
        nav: { home: "Home", ... },
        footer: { tagline: "...", ... },
        home: { hero: { title1: "...", ... }, ... },
        // etc.
    },
    es: {
        // Mirror structure
    }
};
```

Consumed via `LanguageContext.tsx`:
```typescript
const { t } = useLanguage();
// Usage: {t.home.hero.title1}
```

**CRITICAL FINDING: Pages that use the translation system:**
- Home.tsx -- partial (hero, arsenal, pillars, cards, vault use translations; but "Live Signals" section is hardcoded)
- Inventory.tsx -- partial (headers, labels; but modal content uses translations)
- Contact.tsx -- full use
- Login.tsx -- full use
- FAQ.tsx -- partial (structure labels translated, but FAQ questions/answers are hardcoded English only)
- Services.tsx -- minimal (only badge, title, subtitle use translations; all service descriptions are hardcoded English)

**Pages that DO NOT use translations at all (100% hardcoded English):**
- About.tsx -- ALL content hardcoded, no `useLanguage()` import
- Finance.tsx -- ALL content hardcoded, no `useLanguage()` import
- Policies.tsx -- ALL content hardcoded
- PaymentOptions.tsx -- ALL content hardcoded
- Legal.tsx -- ALL content hardcoded
- NotFound.tsx -- ALL content hardcoded
- VinLookup.tsx -- ALL content hardcoded

### File Modification Map

This section maps each requirement to the specific files that need changes.

#### BRAND-01: Homepage Content
| File | What Needs to Change |
|------|---------------------|
| `utils/translations.ts` | Rewrite ALL `home.*` keys in both `en` and `es` |
| `pages/Home.tsx` | Remove `SubliminalPrime` component (lines 43-74), rewrite "Live Signals" section (lines 393-436), rewrite "System Architecture" heading (line 441), remove "Intercepted Transmissions" label |

**Home.tsx specific issues:**
1. `SubliminalPrime` -- flashes "AUTHORITY", "CONTROL", "LEGACY", "DOMINION", "SOVEREIGNTY" at visitors (lines 43-74). MUST BE REMOVED.
2. `DecryptText` -- "hacker" text decode animation (lines 9-40). Consider keeping animation but with appropriate text.
3. Hero titles: "ARCHITECT REALITY" -- must change
4. Hero subtitle: "Identity precedes results. Upgrade your avatar." -- must change
5. Hero status badge: "System Override: Active" / "Uplink Established" -- must change
6. Ticker: "PSYCHOLOGY DRIVES ECONOMICS", "VELOCITY IS POWER", etc. -- must change
7. Arsenal section: "The Arsenal" / "Live Allocations" / "Select your instrument of power" -- must change
8. Pillars: "The Trinity" / "Operating System V3.0" -- must change
9. Pillar 1: "The vehicle is not transport. It is a reinforced psychological environment." -- must change
10. Pillar 2: "Money hates friction." -- must change
11. Pillar 3: "vetted for mechanical and aesthetic sovereignty" -- must change
12. Cards: "Sovereign Vetting" / "Psychological Moonshot" / "Strategic Velocity" -- must change
13. Card descriptions: "kingdom", "Bending behavior around a new identity", "doctrine" -- must change
14. Live Signals marquee: Hardcoded fake transactions referencing G-Wagon, Rolls Royce Wraith, Lamborghini Huracan, "DOMINION ESTABLISHED: SECTOR 7" (lines 407-434) -- MUST REPLACE OR REMOVE
15. Vault section: "THE VAULT" / "Secure Access Only" -- must change

#### BRAND-02: About Page
| File | What Needs to Change |
|------|---------------------|
| `pages/About.tsx` | Complete rewrite of ALL content (entire file, ~330 lines) |
| `utils/translations.ts` | Add `about.*` section (currently does not exist in translations) |

**About.tsx specific issues (entire page is problematic):**
1. Hero: "System Restoration Protocol" -- remove
2. Hero title: "PERCEPTION IS REALITY" -- change
3. Hero quote: "Most operate unconsciously. We provide the leverage to reclaim sovereignty through systems, automation, and pure signal." -- change
4. Section 1 label: "Subconscious Indoctrination" -- REMOVE
5. Section 1 heading: "WHO IS WRITING YOUR SCRIPT?" -- change
6. Section 1 content: "The world is a machine of subconscious indoctrination. The drift is designed to keep you reactive." -- REMOVE
7. Section 1 quote: "Triple J supplies the psychological leverage to break the cycle. We restore sovereignty." -- change
8. Section 2: "THE LAW OF IDENTITY" -- change
9. Section 2 cards: "Identity precedes results. We verify and fortify the sovereign operator." -- change
10. Section 3: "OPERATIONAL DOCTRINE" -- change
11. Section 3 principles: "Psychology Drives Economics", "Clarity Drives Scale", "Identity Drives Behavior" -- change
12. Section 3 terminal: "System Output" / "REMOVE FRICTION" / "INCREASE LEVERAGE" / "DECISIVE ACTION" / "VELOCITY WITHOUT LIMIT" -- change
13. HQ section: "Base of Operations" / "Coordinates" / "Sector" / "USA / SOUTHERN COMMAND" / "Tactical Approach" -- change
14. CTA: "The Psychological Moonshot" / "Shift perception. Bend behavior. Solidify identity." / "Initiate Alignment" -- change
15. **No mention of real dealership story, team, business history, or actual services**
16. **No bilingual support** -- entire page is English only
17. Uses stock Unsplash photos, not dealership photos (acceptable per CONTEXT.md)

#### BRAND-03: Services Page
| File | What Needs to Change |
|------|---------------------|
| `pages/Services.tsx` | Rewrite service descriptions, add rental service |
| `utils/translations.ts` | Expand `services.*` section significantly |

**Services.tsx specific issues:**
1. Subtitle: "Precision operations for the discerning client." -- must change
2. "VIN Intelligence" / "DEEP DATA ANALYSIS" / "Military-grade vehicle history verification" -- tone needs adjustment
3. "Logistics Coordination" -- mentions out-of-state shipping; verify this is a real service
4. "high-value asset financing" -- should reference $3K-$8K range
5. "Trade-In Assessment" / "ASSET VALUATION" -- verify this is a real service
6. **No mention of vehicle rentals** -- BRAND-03 requires sales + rentals
7. **Mostly hardcoded English** -- only badge/title/subtitle use translations
8. "No Pressure Tactics" in "What We Don't Do" says "not emotion" -- could be improved
9. "high-value asset financing" is misleading for $3K-$8K vehicles

#### BRAND-04: Social Proof
| File | What Needs to Change |
|------|---------------------|
| `pages/Home.tsx` | Remove/replace fake "Live Signals" ticker (lines 393-436) |

**Social proof audit results:**
- The "Live Signals" section on the homepage contains completely fabricated data:
  - "ASSET SECURED: 2021 G-WAGON (HOUSTON)" -- fake
  - "DOMINION ESTABLISHED: SECTOR 7" -- nonsense
  - "ROLLS ROYCE WRAITH: DEPLOYED" -- fake ($289K vehicle, not in $3K-$8K range)
  - "CLIENT IDENTITY: VERIFIED" -- meaningless
  - "TRANSACTION VELOCITY: < 24 HOURS" -- unverifiable
  - "LAMBORGHINI HURACAN: ALLOCATED" -- fake ($265K vehicle)
  - "STATUS: SOVEREIGN" -- internal jargon
- **No "487 families served" or "127 five-star reviews" counters were found in actual code** -- those were only in the blueprint as examples. Good.
- No customer testimonials currently exist on the site. Per CONTEXT.md, skip testimonials until real ones exist.

#### BRAND-05: Footer
| File | What Needs to Change |
|------|---------------------|
| `App.tsx` (Footer component, lines 326-408) | Rewrite footer content |
| `utils/translations.ts` | Expand `footer.*` section |

**Footer audit results:**
1. Footer tagline: "Redefining the standard of luxury and performance." (EN) / "Redefiniendo el estandar de lujo y rendimiento." (ES) -- MUST CHANGE. "Luxury" is wrong for $3K-$8K vehicles.
2. Copyright: "Sovereign Entity" -- MUST CHANGE to "Triple J Auto Investment"
3. Section heading: "Headquarters" -- consider changing to something warmer
4. **Missing from footer:**
   - Phone number (exists only on Contact page: (832) 400-9760)
   - Business hours
   - Social media links (Facebook, X confirmed in CONTEXT.md)
   - "Automotive investment firm" positioning language
5. **Present in footer (good):**
   - Address: 8774 Almeda Genoa Road, Houston, Texas 77075
   - Dealer License: P171632
   - Legal links (DMV, Privacy, Terms, Arbitration)
   - Logo image
6. **No Spanish translations for footer labels** beyond basic tagline/links
7. Footer is rendered in App.tsx, so it IS consistent across all pages -- good

#### BRAND-06: Consistent Tone Across All Pages
| File | What Needs to Change |
|------|---------------------|
| `utils/translations.ts` | Comprehensive rewrite of all translation keys |
| ALL page files | Remove hardcoded jargon, move to translations |

**Cross-page jargon inventory:**

| Term | Location(s) | Replace With |
|------|-------------|-------------|
| "Sovereign" | translations.ts, About.tsx, Home.tsx, Legal.tsx, SovereignCrest.tsx, vehicles.ts, sheets.ts, LuxuryHero.tsx | Remove from customer-facing text |
| "Dominion" | Home.tsx, vehicles.ts, sheets.ts | Remove |
| "Doctrine" | About.tsx, translations.ts | Remove |
| "Arsenal" | translations.ts (home.arsenal.*) | "Featured Vehicles" or similar |
| "Moonshot" | About.tsx, translations.ts | Remove |
| "Psychological" | About.tsx, translations.ts | Remove |
| "ARCHITECT REALITY" | translations.ts (home.hero.*) | New tagline |
| "Identity precedes results" | translations.ts, About.tsx, vehicles.ts | Remove |
| "Sovereign Entity" | App.tsx footer copyright | "Triple J Auto Investment" |
| "Dossier" | translations.ts (inventory modal) | "information" or "inquiry" |
| "Transmission" | translations.ts (contact form) | "message" |
| "Uplink" | translations.ts (hero) | Remove |
| "Cipher" | translations.ts (login) | "Password" |
| "Headquarters" | translations.ts, Contact.tsx, About.tsx, Legal.tsx, etc. | "Location" or "Office" |
| "System Override: Active" | translations.ts (hero) | Remove |
| "INTERCEPTED TRANSMISSIONS" | Home.tsx | Remove entire section or replace |
| "SIGNAL RECEIVED" | translations.ts (contact form) | "Message Sent" |
| "Transmit Message" | translations.ts (contact form) | "Send Message" |
| "RESTRICTED ACCESS" | translations.ts (login) | "Admin Login" |
| "Triple J Sovereign Domain" | translations.ts (login subtitle) | "Dealer Portal" |
| "Identity Key (Email)" | translations.ts (login) | "Email" |
| "Access Cipher (Password)" | translations.ts (login) | "Password" |
| "ENTER DESIGNATION" | translations.ts (login placeholder) | "Enter email" |
| "ENTER SEQUENCE" | translations.ts (login placeholder) | "Enter password" |
| "Security breach detected" | translations.ts (login error) | "Invalid credentials" |
| "Verification protocol dispatched" | translations.ts (login error) | "Check your email for verification" |
| "Command Center" | NotFound.tsx | "Homepage" |
| "Base of Operations" | About.tsx | "Our Location" |
| "USA / SOUTHERN COMMAND" | About.tsx | Remove |
| "Tactical Approach" | About.tsx | "Get Directions" |
| "Return to Base" | Legal.tsx | "Back to Home" |
| "Capital Strategies" | Finance.tsx | "Financing Options" |
| "Financial Instruments" | PaymentOptions.tsx | "Payment Methods" |
| "SIGNAL NOT FOUND" | NotFound.tsx | "Page Not Found" |
| "CONTACT HEADQUARTERS" | FAQ.tsx, PaymentOptions.tsx | "Contact Us" |

#### BRAND-07: Google Reviews
| File | What Needs to Change |
|------|---------------------|
| Potentially new section in Home.tsx or About.tsx | Add real Google review quotes |

**Current state:** No Google reviews exist on the site. Per CONTEXT.md, real Google review quotes should be added as static social proof. Claude has discretion on whether to look up real reviews or omit if unverifiable.

### Additional Files Requiring Content Changes

| File | Issues |
|------|--------|
| `components/SovereignCrest.tsx` | Alt text says "Triple J Sovereign Crest" -- change to "Triple J Auto Investment" |
| `lib/store/vehicles.ts` | FALLBACK_VEHICLES contain luxury vehicles ($85K-$289K) and jargon descriptions. These are backup data shown if DB fails. |
| `lib/store/sheets.ts` | `generateOpulentCaption()` produces jargon-laden descriptions ("sovereign asset", "enforce your will upon the asphalt", "capacity for dominion"). Used as fallback when vehicle has no description. |
| `services/geminiService.ts` | AI prompt instructs Gemini to write "Sovereign Asset" descriptions with "Authority, Precision, Legacy, Kinetic Energy, Fortress, Sanctuary" language. Also "Sovereign CFO" prompt for financial analysis (admin-only, less urgent). |
| `components/luxury/LuxuryHero.tsx` | Default title "SOVEREIGN", subtitle "Where automotive excellence meets uncompromising luxury" -- currently not in active use but may be imported |
| `pages/VinLookup.tsx` | Line 127: "Deep Layer Extraction - Sovereign Access Only" -- jargon |
| `pages/Inventory.tsx` | Line 98: Section heading "The Collection" / "Secure Asset Allocations" -- jargon in translations |
| `pages/Inventory.tsx` | Line 113: Success message "Our agent has received your dossier. We will contact you shortly to finalize the acquisition." -- jargon in translations |

### Phone Number Inconsistency

**CRITICAL FINDING:** Multiple phone numbers exist across the codebase:

| Phone Number | Location | Notes |
|-------------|----------|-------|
| (832) 400-9760 | Home.tsx (hero CTA), Contact.tsx, Inventory.tsx | Main number, appears most frequently |
| (832) 777-7580 | PaymentOptions.tsx (fraud notice) | Different number -- inconsistent |
| (713) 555-0192 | CustomerStatusTracker.tsx, RegistrationTracker.tsx, ErrorState.tsx | Looks like a placeholder/test number (555 exchange) |

**Action needed:** Standardize to ONE verified phone number across all pages.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bilingual content | Separate pages per language | Existing LanguageContext + translations.ts | Already built, works well, just needs more content added |
| Content management | CMS or database-driven content | Static translations.ts | Per CONTEXT.md, content is static; no CMS needed for this phase |
| Social proof metrics | Dynamic counters from database | Static hardcoded values (or remove) | CONTEXT.md says Claude has discretion; static is simpler and more honest |
| Google reviews | API integration | Static hardcoded quotes | Per CONTEXT.md, use static quotes |

**Key insight:** This phase is purely about editing content strings and removing jargon. No new components, no new architecture. The complexity is in the volume and consistency of changes across 15+ files and two languages.

## Common Pitfalls

### Pitfall 1: Partial Translation Coverage
**What goes wrong:** Some pages get updated to use the translation system while others remain hardcoded English, creating an inconsistent bilingual experience.
**Why it happens:** Pages like About.tsx, Finance.tsx, Policies.tsx were never wired into the translation system.
**How to avoid:** For each page modified, add ALL customer-visible text to translations.ts in both EN and ES. Verify by toggling language.
**Warning signs:** Any customer-visible text that doesn't change when language is toggled.

### Pitfall 2: Missing Spanish Content
**What goes wrong:** English content gets updated but Spanish translations are forgotten or auto-translated poorly.
**Why it happens:** Spanish translations are easy to defer. CONTEXT.md explicitly requires simultaneous updates.
**How to avoid:** Every change to EN must have a corresponding ES change in the same commit.
**Warning signs:** Spanish translations that are word-for-word Google Translate quality.

### Pitfall 3: Jargon Whack-a-Mole
**What goes wrong:** Most jargon is removed but some instances survive in obscure locations (fallback data, AI prompts, error messages, alt text).
**Why it happens:** Jargon exists in 15+ files across pages, components, services, and data files.
**How to avoid:** Use the comprehensive jargon inventory in this research document. After changes, grep the entire codebase for: sovereign, dominion, doctrine, arsenal, moonshot, cipher, dossier, transmission, uplink, indoctrination.
**Warning signs:** Any of the terms listed in the jargon inventory appearing in grep results from customer-facing files.

### Pitfall 4: Breaking the Translation Type System
**What goes wrong:** Adding new keys to translations.ts breaks TypeScript if the EN and ES objects don't have identical structure.
**Why it happens:** The `t` object type is inferred from the structure. Adding a key to EN but not ES (or vice versa) causes type errors.
**How to avoid:** Always add keys to both EN and ES simultaneously. Keep the structure mirrors identical.
**Warning signs:** TypeScript compilation errors after modifying translations.ts.

### Pitfall 5: Forgetting Non-Page Files
**What goes wrong:** All page content is updated but fallback vehicle data, AI prompts, and caption generators still produce jargon-laden text.
**Why it happens:** These files feel like "backend" but their output reaches customers (fallback vehicles display on the site, AI generates descriptions shown to visitors).
**How to avoid:** Include `lib/store/vehicles.ts`, `lib/store/sheets.ts`, and `services/geminiService.ts` in the content update scope.
**Warning signs:** Fallback vehicles showing with $289K Rolls-Royce data, or AI-generated descriptions using "sovereign" language.

### Pitfall 6: Phone Number Inconsistency
**What goes wrong:** Different phone numbers appear on different pages.
**Why it happens:** Numbers were hardcoded in individual files rather than centralized.
**How to avoid:** Use a single source of truth for the phone number (either in translations.ts or a constants file). The primary number appears to be (832) 400-9760.
**Warning signs:** Multiple different phone numbers in grep results.

## Code Examples

### Pattern: Adding a New Section to translations.ts

```typescript
// utils/translations.ts - Adding about page translations
export const t = {
    en: {
        // ... existing sections ...
        about: {
            hero: {
                badge: "Our Story",
                title: "TRIPLE J AUTO INVESTMENT",
                subtitle: "Your trusted automotive partner in Houston since 2025."
            },
            story: {
                title: "Who We Are",
                content: "We're a family-run independent dealer..."
            },
            location: {
                title: "Visit Us",
                address: "8774 Almeda Genoa Road",
                city: "Houston, Texas 77075",
                directions: "Get Directions"
            }
        }
    },
    es: {
        // ... existing sections ...
        about: {
            hero: {
                badge: "Nuestra Historia",
                title: "TRIPLE J AUTO INVESTMENT",
                subtitle: "Tu socio automotriz de confianza en Houston desde 2025."
            },
            story: {
                title: "Quienes Somos",
                content: "Somos un distribuidor independiente familiar..."
            },
            location: {
                title: "Visitanos",
                address: "8774 Almeda Genoa Road",
                city: "Houston, Texas 77075",
                directions: "Como Llegar"
            }
        }
    }
};
```

### Pattern: Consuming Translations in a Previously Hardcoded Page

```typescript
// pages/About.tsx - Before (hardcoded)
const About = () => {
  return (
    <h1>PERCEPTION IS REALITY</h1>
  );
};

// pages/About.tsx - After (translated)
import { useLanguage } from '../context/LanguageContext';

const About = () => {
  const { t } = useLanguage();
  return (
    <h1>{t.about.hero.title}</h1>
  );
};
```

### Pattern: Removing the SubliminalPrime Component

```typescript
// pages/Home.tsx - REMOVE these lines entirely (lines 43-74):
// const SubliminalPrime = () => { ... };

// And remove its usage (line 135):
// <SubliminalPrime />
```

### Pattern: Replacing Fake Social Proof

```typescript
// pages/Home.tsx - Replace "Live Signals" section (lines 393-436)

// BEFORE (fake):
{[
  "ASSET SECURED: 2021 G-WAGON (HOUSTON)",
  "DOMINION ESTABLISHED: SECTOR 7",
  "ROLLS ROYCE WRAITH: DEPLOYED",
  ...
]}

// AFTER (real or remove entirely):
// Option A: Remove the entire "Intercepted Transmissions" section
// Option B: Replace with real, honest ticker content like:
{[
  "OPEN MON-SAT 9AM-6PM",
  "SERVING HOUSTON FAMILIES",
  "TRANSPARENT PRICING ON EVERY VEHICLE",
  "PRE-OWNED VEHICLES $3K-$8K",
  "SALES AND RENTALS"
]}
```

## State of the Art

| Old Approach (Current) | Current Approach (Phase 10 Target) | Impact |
|------------------------|--------------------------------------|--------|
| Framework jargon in customer copy | Clear, honest dealership language | Trust |
| Luxury vehicle references ($265K+) | $3K-$8K pre-owned vehicle focus | Authenticity |
| Military/psyops tone throughout | Warm advisor on landing/about, transparent on listings | Approachability |
| Hardcoded English on most pages | All content in translations.ts, EN+ES | Bilingual parity |
| Fabricated social proof ticker | Real data or removed entirely | Honesty |
| "Sovereign Entity" in copyright | "Triple J Auto Investment" | Legal accuracy |
| No social media links | Facebook + X links in footer | Discoverability |
| Inconsistent phone numbers | Single verified number everywhere | Professionalism |

## Complete File Inventory

### Files That MUST Be Modified (Customer-Facing Content)

| Priority | File | Scope of Changes | Requirements |
|----------|------|-------------------|-------------|
| 1 | `utils/translations.ts` | Rewrite ALL existing keys + add new sections for About, Services detail, Finance, FAQ content | BRAND-01, 02, 03, 05, 06 |
| 2 | `pages/Home.tsx` | Remove SubliminalPrime, rewrite Live Signals, remove fake social proof | BRAND-01, 04 |
| 3 | `pages/About.tsx` | Complete rewrite + wire to translations | BRAND-02 |
| 4 | `App.tsx` (Footer, lines 326-408) | Rewrite footer: tagline, copyright, add phone/hours/social links | BRAND-05 |
| 5 | `pages/Services.tsx` | Rewrite descriptions, add rental service, wire to translations | BRAND-03 |
| 6 | `pages/Contact.tsx` | Minor tone fixes (already uses translations) | BRAND-06 |
| 7 | `pages/FAQ.tsx` | Wire FAQ content to translations for bilingual, minor tone fixes | BRAND-06 |
| 8 | `pages/Finance.tsx` | Remove "Capital Strategies" jargon, wire to translations, fix placeholder text | BRAND-06 |
| 9 | `pages/Login.tsx` | Already uses translations; fix jargon in translation keys | BRAND-06 |
| 10 | `pages/VinLookup.tsx` | Remove "Sovereign Access Only" text | BRAND-06 |
| 11 | `pages/Policies.tsx` | Wire to translations for bilingual support | BRAND-06 |
| 12 | `pages/PaymentOptions.tsx` | Fix phone number, remove "Financial Instruments"/"Capital Strategies" jargon, wire to translations | BRAND-05, 06 |
| 13 | `pages/Legal.tsx` | Remove "sovereignty" quote, fix "Return to Base" | BRAND-06 |
| 14 | `pages/NotFound.tsx` | Fix "SIGNAL NOT FOUND", "Command Center", "Initiate Communication" | BRAND-06 |
| 15 | `pages/Inventory.tsx` | Fix jargon in translation keys (handled via translations.ts) | BRAND-06 |

### Files That SHOULD Be Modified (Support/Data Files)

| Priority | File | Scope of Changes | Notes |
|----------|------|-------------------|-------|
| 16 | `lib/store/vehicles.ts` | Update FALLBACK_VEHICLES to $3K-$8K range vehicles, remove jargon descriptions | Shown to users when DB is down |
| 17 | `lib/store/sheets.ts` | Rewrite `generateOpulentCaption()` to produce honest descriptions | Generates descriptions for vehicles missing them |
| 18 | `services/geminiService.ts` | Update AI prompt from "Sovereign Asset" to honest dealer language | Generates customer-facing descriptions |
| 19 | `components/SovereignCrest.tsx` | Fix alt text from "Triple J Sovereign Crest" to "Triple J Auto Investment" | Accessibility |

### Files That MAY Be Modified (Lower Priority)

| File | Notes |
|------|-------|
| `components/luxury/LuxuryHero.tsx` | Not actively used but contains jargon. Clean up if time permits. |
| `components/luxury/LuxurySplashScreen.tsx` | Not actively used. Low priority. |
| `pages/CustomerStatusTracker.tsx` | Fix placeholder phone number (713) 555-0192 |
| `pages/RegistrationTracker.tsx` | Fix placeholder phone number (713) 555-0192 |
| `components/tracking/ErrorState.tsx` | Fix placeholder phone number (713) 555-0192 |

## Open Questions

1. **Phone number verification**
   - What we know: (832) 400-9760 appears to be the primary number (used on Home, Contact, Inventory). (832) 777-7580 appears on PaymentOptions. (713) 555-0192 is clearly a placeholder.
   - What's unclear: Which is the verified, current business phone number?
   - Recommendation: Use (832) 400-9760 everywhere since it appears most frequently and on the most important pages. Flag (832) 777-7580 for owner verification.

2. **Google reviews data**
   - What we know: BRAND-07 requires real Google review quotes as static social proof.
   - What's unclear: What actual Google reviews exist for Triple J Auto Investment?
   - Recommendation: Claude should attempt to look up real Google reviews. If none can be verified, omit this section entirely rather than fabricate. Per CONTEXT.md: "Omit metrics where verifiable numbers don't exist rather than fabricating them."

3. **Rental service details**
   - What we know: The admin panel has a Rentals section (admin/Rentals route), confirming rentals are a real service.
   - What's unclear: Specific rental terms, pricing, or policies.
   - Recommendation: Add rentals to the Services page with general information. Don't invent specific pricing or terms.

4. **About page team information**
   - What we know: BRAND-02 asks for "team information."
   - What's unclear: Who are the team members? What is the actual dealership story?
   - Recommendation: Write a honest generic About section based on verifiable facts (Texas independent dealer, family-focused, Houston location). Don't invent team member names or biographies.

5. **Fallback vehicles scope**
   - What we know: FALLBACK_VEHICLES in vehicles.ts shows Rolls-Royce Wraith ($289K), Mercedes G63 ($215K), Lamborghini Huracan ($265K), Range Rover ($85K).
   - What's unclear: Whether to update these with realistic $3K-$8K vehicles or just update descriptions.
   - Recommendation: Update both the vehicles (realistic makes/models/prices for $3K-$8K range) AND their descriptions. These are what visitors see if the database connection fails.

## Sources

### Primary (HIGH confidence)
- Direct codebase audit of all files in `triple-j-auto-investment-main/` directory
- `utils/translations.ts` -- read in full, all 376 lines
- `pages/Home.tsx` -- read in full, 532 lines
- `pages/About.tsx` -- read in full, 329 lines
- `pages/Services.tsx` -- read in full, 186 lines
- `pages/Contact.tsx` -- read in full, 214 lines
- `pages/FAQ.tsx` -- read in full, 206 lines
- `pages/Finance.tsx` -- read in full, 300 lines
- `pages/Login.tsx` -- read in full, 132 lines
- `pages/Policies.tsx` -- read in full, 180 lines
- `pages/PaymentOptions.tsx` -- read in full, 209 lines
- `pages/Legal.tsx` -- read in full, 70 lines
- `pages/NotFound.tsx` -- read in full, 81 lines
- `App.tsx` -- read in full, 533 lines (contains Footer and Navbar)
- `context/LanguageContext.tsx` -- read in full, 45 lines
- `components/SovereignCrest.tsx` -- read in full, 79 lines
- `components/SplashScreen.tsx` -- read in full, 262 lines
- `lib/store/vehicles.ts` -- read in full, 426 lines
- `lib/store/sheets.ts` -- read in full, 229 lines
- `services/geminiService.ts` -- read in full, 100 lines
- `.planning/phases/10-brand-truth/10-CONTEXT.md` -- full context
- `.planning/PSYCHOLOGICAL-ARCHITECTURE.md` -- full blueprint

### Secondary (MEDIUM confidence)
- Grep searches across entire codebase for jargon patterns (sovereign, dominion, luxury, arsenal, etc.)
- Phone number audit via regex grep

### Tertiary (LOW confidence)
- None -- all findings are from direct code inspection

## Metadata

**Confidence breakdown:**
- File inventory: HIGH - every file was read directly
- Jargon inventory: HIGH - comprehensive grep + manual review
- Translation system: HIGH - full code analysis
- Phone number audit: HIGH - grep results verified
- Content recommendations: MEDIUM - depend on business decisions not fully known (actual team, actual reviews, etc.)

**Research date:** 2026-02-15
**Valid until:** Indefinitely (codebase-specific research, not library-dependent)
