# Phase 10: Brand Truth - Context

**Gathered:** 2026-02-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Align all customer-facing content with the "automotive investment firm" positioning using real business data. Every page communicates Triple J as trustworthy -- real story, real metrics, real business info, honest positioning. Remove fabricated counters, internal framework jargon, and language that doesn't match the $3K-$8K pre-owned vehicle reality. The SOVEREIGN psychological architecture blueprint is the foundation and must NOT be changed -- Phase 10 grounds it in truth.

What this phase does NOT include:
- New page layouts or components (that's Phase 13: Focus Capture)
- Vehicle listing redesign (that's Phase 14: Expectancy Building)
- New interactive features (that's Phase 15: Engagement Spectrum)
- Performance or accessibility fixes (that's Phase 11: Production Polish)

</domain>

<decisions>
## Implementation Decisions

### Business Identity & Tone

- The SOVEREIGN psychological architecture blueprint is the master framework and must be preserved in full. Phase 10 makes the content honest within that framework, not outside it.
- Claude's discretion: Review all customer-facing copy and remove any internal framework terminology (SOVEREIGN, FATE, PRISM, PCP, Six-Axis, etc.) that leaked into customer-visible pages. The framework guides design decisions internally -- customers never see the framework language.
- Claude's discretion: Match tone to context -- warm/advisor tone on landing and about pages, sharp/transparent on listings and pricing. Both tones serve the blueprint's goal of breaking the "used car lot" script.
- Claude's discretion: Use "automotive investment firm" framing per-page as appropriate -- sometimes explicit, sometimes let the business name carry it.
- Claude's discretion: Review existing taglines/slogans and keep or improve what works for the $3K-$8K Houston family market.
- Claude's discretion: Maintain the current dark theme with gold accents (tj-gold) as the established brand identity. Ensure visual consistency across all pages.
- Claude's discretion: Handle cultural alignment authentically -- bilingual content, family-centered approach, reflecting the Houston Hispanic community without being performative.

### Bilingual Content

- Both English and Spanish must be updated simultaneously. Brand truth applies equally to both language versions.
- All content changes must flow through the existing translation system (LanguageContext + utils/translations.ts).
- Footer labels fully translate to Spanish when language is toggled (e.g., "Hours" -> "Horario", "Contact" -> "Contacto", "Dealer License" -> "Licencia de distribuidor").

### Real Data & Social Proof

- Claude's discretion: Determine whether metrics should be dynamic (from Supabase) or hardcoded per metric. Some counters may query actual data, others may be manually maintained.
- Skip customer testimonials for now. Do not add testimonials until verifiable real ones exist. Avoid anything that looks fabricated.
- Claude's discretion: Look up or verify real business data (Google reviews, years in business) where possible. Omit metrics where verifiable numbers don't exist rather than fabricating them.
- The blueprint's social proof metrics ("487 families served", "127 five-star reviews") are EXAMPLES, not real numbers. Replace with actual data or remove entirely.

### About Page & Story

- Claude's discretion: Write an honest About section based on verifiable facts -- Texas independent dealer, Houston location at 8774 Almeda Genoa, family-focused, sales and rentals.
- Claude's discretion: Work with whatever imagery currently exists in the codebase. Do not reference photos that don't exist.
- Claude's discretion: Review which services the codebase actually supports and present them honestly. Don't advertise services that aren't built or active.
- Business hours: Monday-Saturday 9am-6pm, closed Sunday. This is confirmed.

### Footer & Legal Consistency

- Claude's discretion: Determine footer content based on Texas dealer requirements and existing site structure. Must include dealer license P171632.
- Phone number: Use whatever is currently in the codebase.
- Social media links (confirmed):
  - Facebook: https://www.facebook.com/thetriplejauto
  - X (Twitter): @thetriplejauto (https://x.com/thetriplejauto)
  - Other platforms (Instagram, TikTok, etc.): not yet created -- do not add placeholder links for platforms that don't exist.
- Footer must be consistent across ALL pages in both English and Spanish.
- Address: 8774 Almeda Genoa, Houston, TX (verify zip code from codebase).

### Claude's Discretion

Claude has broad discretion on this phase because the user trusts Claude to:
1. Audit all customer-facing copy against the psychological architecture blueprint
2. Replace internal jargon with customer-appropriate language
3. Ground aspirational metrics in real data (or remove them)
4. Write honest About content based on verifiable facts
5. Ensure tone matches context (warm vs transparent per page purpose)
6. Maintain visual brand consistency (dark theme, gold accents)
7. Handle cultural alignment authentically
8. Determine dynamic vs static approach for any metrics shown

The constraint is: the SOVEREIGN framework guides all decisions, but its terminology never appears in customer-facing content.

</decisions>

<specifics>
## Specific Ideas

- The user provided the full SOVEREIGN/FATE/PRISM psychological architecture blueprint (stored in `.planning/PSYCHOLOGICAL-ARCHITECTURE.md`). This is the master reference for ALL design and content decisions across v2.0. Phase 10 makes the current site content honest within this framework.
- "Triple J is not a used car lot -- it's a family automotive investment firm that happens to sell pre-owned vehicles." This positioning stays, but must be expressed through real data and honest language, not through inflated claims.
- The vehicle price range is $3K-$8K. Language must match this reality -- no "luxury" positioning that contradicts the actual market segment. The differentiation is trust, transparency, and care, not price tier.
- The site already has a bilingual system (LanguageContext). Phase 10 must update both languages simultaneously for every content change.

</specifics>

<deferred>
## Deferred Ideas

- Instagram and TikTok accounts need to be created -- when ready, add links (not Phase 10 scope, just a content update)
- Customer testimonials -- skip until real, verifiable testimonials exist
- Professional lot/team photography -- when available, integrate into About page

</deferred>

---

*Phase: 10-brand-truth*
*Context gathered: 2026-02-15*
