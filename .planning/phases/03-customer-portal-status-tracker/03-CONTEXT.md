# Phase 3: Customer Portal - Status Tracker - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Customers can check their registration status without logging in via a unique link (texted/emailed after sale). This phase delivers:
- 6-stage progress tracker with visual progress bar
- Customer access via unique link
- Animated progress visualization (Golden Crest logo, car animation)
- Stage descriptions explaining what's happening at each stage

Login, notifications, and returning customer features are Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Progress Visualization - Arc Element
- Circular/arc progress with Golden Crest logo centered inside
- Arc fills with gold/amber color as stages complete
- Incomplete stages shown in faded gold (20% opacity)
- Current stage marker has gold glow pulse animation
- "Stage X of 6" text displayed below the arc
- Page header shows "Triple J Auto Investment" with dealership name

### Progress Visualization - Road Element
- Horizontal road graphic below the arc (on desktop)
- Road has dashed line styling
- Car icon that "drives" along road to current position
- Realistic outline car icon matching the purchased vehicle type (sedan, truck, SUV - Claude decides appropriate set)
- Green start flag at left, checkered finish flag at right
- No stage markers on road - car position indicates progress
- Clean background (no scenery/clouds)
- Road is the dominant element (larger than arc)

### Animation Behavior
- Arc fills and car drives simultaneously on page load
- 2.5-3 second total animation duration
- Animation plays every page load (always animate on refresh)
- Clean motion (no smoke/dust effects)
- On resize/orientation change: jump to final state (no replay)
- Car is static after animation ends (no idle animation)
- Claude decides animation easing

### Visual Styling
- White to light gold gradient page background
- No container/card around visualization
- No decorative elements - clean design
- Modern sans-serif typography
- No celebration animation for completed registrations

### Rejected State
- Red warning banner above the progress visualization
- Arc still shows last completed stage position

### Stage Information
- Current stage description appears below the road/car element
- Medium detail (paragraph) - explanation + what to expect
- Time estimates shown only for predictable stages (range format)
- Completed stages show dates (e.g., "Documents collected: Jan 15")

### Link Access Flow
- URL format: `/track/{orderID}-{token}` (readable + secure)
- Links expire 30 days after sticker delivered
- Loading state: Animated Golden Crest logo pulses/spins
- Different error messages for "expired" vs "invalid" links with dealership contact info

### Mobile Experience
- Simplified layout prioritizing stage info
- Both visualization and stage info visible without scrolling if possible
- Road runs vertically (top-to-bottom) on mobile
- Tap arc segment to see that stage's description
- Minimum supported width: 360px
- Haptic feedback when tapping interactive elements
- Native share sheet for sharing tracking link
- Claude decides landscape orientation behavior

### Claude's Discretion
- Number of vehicle type icons (reasonable set based on common types)
- Animation easing curve
- Landscape orientation layout on mobile
- Exact spacing and proportions

</decisions>

<specifics>
## Specific Ideas

- Arc with logo at center, road with car below - road is the larger/dominant element
- Car matches purchased vehicle type from registration record
- Green start flag, checkered finish flag on road
- Gold glow pulse on current stage marker
- "Stage X of 6" format (not percentage)
- Dates shown for completed stages in stage info section
- Native share button for easy link sharing

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-customer-portal-status-tracker*
*Context gathered: 2026-02-05*
