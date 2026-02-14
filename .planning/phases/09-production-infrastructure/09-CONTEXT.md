# Phase 9: Production Infrastructure - Context

**Gathered:** 2026-02-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Deploy Triple J Auto Investment to production infrastructure -- fresh Supabase project, Vercel deployment connected to GitHub, custom domain with SSL, all credentials rotated out of code, and every v1 workflow verified end-to-end on production. This phase makes the existing site live; it does not add features or change functionality.

</domain>

<decisions>
## Implementation Decisions

### Service accounts
- Twilio: Paid account, ready for production SMS
- A2P 10DLC: Registration submitted, awaiting approval -- plan around this delay (may need fallback or phased OTP rollout)
- Resend: No account yet -- needs to be created, domain verified (48+ hour DNS propagation)
- Other services (Retell AI, Google Maps, etc.): Claude reviews codebase for all service dependencies and flags what needs setup

### Domain & hosting
- Domain: Owned, registered at Namecheap
- Vercel: Account exists, already connected to GitHub repo (whoisjaso/triple-j-auto-investment)
- Pushes to master trigger deploys -- CI/CD pipeline is already in place
- Custom domain needs to be pointed from Namecheap to Vercel (DNS configuration)

### Production data
- Migrate real vehicle inventory from dev Supabase to production Supabase
- Dev data contains real vehicles currently being sold -- worth preserving
- Customer data migration: Claude's discretion based on data review (determine what's worth migrating vs fresh start)
- File storage (vehicle photos, documents): Status unknown -- Claude audits dev storage and recommends what to migrate

### Secret management
- Make GitHub repo private AND rotate all credentials (committed creds in 30+ files are exposed in public git history)
- Secret storage approach: Claude's discretion (standard for Vite + Vercel + Supabase stack)
- Solo operator -- no shared secret management needed, just personal accounts
- Current credential validity: Unknown -- Claude audits which committed credentials are still active and flags all for rotation

### Claude's Discretion
- Which third-party services the codebase depends on (audit and flag)
- Secret management architecture (likely Vercel env vars for production + local .env for dev, both gitignored)
- Customer data migration decision (after reviewing what exists in dev)
- Dev storage audit and migration recommendation
- Credential rotation order and approach
- Supabase project region selection (optimize for Houston, TX user base)

</decisions>

<specifics>
## Specific Ideas

- A2P 10DLC is in-progress -- start Resend setup early since both have multi-day lead times
- Repo must go private before any credential rotation to limit further exposure window
- Since Vercel-GitHub integration exists, deployment pipeline is partially ready -- focus is on environment configuration, not CI/CD setup

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 09-production-infrastructure*
*Context gathered: 2026-02-13*
