# Phase 4: Customer Portal - Notifications & Login - Context

**Gathered:** 2026-02-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Customers receive SMS/email notifications when their registration status changes, and returning customers can log in via phone OTP to see all their registrations. This phase adds contact info fields, a notification system with delivery tracking, customer authentication, and preference management. The status tracker page (Phase 3) and admin workflow (Phase 2) already exist.

</domain>

<decisions>
## Implementation Decisions

### Notification Delivery
- SMS is the primary channel, email is the backup/secondary
- Auto-fallback to email when SMS fails (wrong number, carrier issue) — log failure for admin
- Notify on every stage change (all 6 transitions)
- Detailed SMS message format: "Hi [name], your [year] [make] [model] registration is now at [stage description]. View details: [link]"
- Rich HTML email with mini progress visualization (not just plain text + link)
- SMS provider: whichever is easiest to deploy and use — researcher should compare Twilio vs Vonage vs alternatives on setup simplicity
- Customer phone and email fields need to be added to registrations table (don't exist yet)
- Full notification audit trail visible to admin: every notification sent with channel, timestamp, delivery status

### Throttling & Timing
- Debounce: 5-minute window after last status change before sending notification (prevents spam on rapid corrections)
- No quiet hours — send immediately regardless of time of day
- Admin gets a "Notify customer" checkbox on the status change confirmation dialog (default: checked) to optionally skip notification
- Rejection state gets a special notification template: explains what happened, what customer needs to do, who to contact

### Customer Login Flow
- Phone code (SMS OTP) authentication — customer enters phone number, gets 6-digit code via SMS
- Logged-in view shows: active registrations prominently on top, completed registrations in collapsible history section below
- Both token link (Phase 3) and login work — relationship between them is Claude's discretion
- Session duration is Claude's discretion

### Notification Preferences
- Preference options: SMS / Email / Both / None — customer picks their preferred channel(s) or opts out entirely
- Accessible from both the tracker page (quick toggle/gear icon) and the logged-in dashboard (full settings)
- Default for new registrations: SMS + Email (opt-out model)
- One-tap unsubscribe in every notification — email unsubscribe link, SMS STOP keyword support
- Compliance: unsubscribe links legally required in emails, STOP keyword for SMS

### Claude's Discretion
- SMS provider selection (optimize for easiest deployment)
- Token link + login session coexistence design
- Login session duration
- Rich email template design/layout
- OTP code length and expiry time
- Debounce implementation approach (DB-level vs app-level)

</decisions>

<specifics>
## Specific Ideas

- SMS message should include vehicle details so customer knows which car it's about (they may have multiple): "Hi [name], your [year] [make] [model] registration is now at [stage]. View details: [link]"
- Rejection notification is a special case — needs to be more informative than regular stage updates, explaining what went wrong and next steps
- Admin should be able to see the full notification history per registration (not just a badge)
- Phone OTP ties naturally into the SMS provider already being integrated for notifications

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-customer-portal-notifications-login*
*Context gathered: 2026-02-08*
