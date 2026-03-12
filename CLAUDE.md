# Triple J Auto Investment — Project Rules

## Playwright Verification (MANDATORY)

**EVERY UI change, fix, or suggestion MUST be verified with Playwright before considering it done.** This is a hard, non-negotiable rule.

### Required workflow:
1. Make the code change
2. Set Playwright viewport to mobile (390x844) AND desktop (1440x900)
3. Navigate to the relevant page on the local dev server
4. Take screenshots at key scroll positions / interaction states
5. Visually confirm the fix works in the screenshot
6. Only THEN tell the user it's done

### Rules:
- Never assume CSS/animation/layout fixes work — **prove it with screenshots**
- For scroll-driven animations: scroll to each phase and screenshot
- For responsive changes: screenshot both mobile AND desktop
- If the screenshot shows the fix didn't work, keep iterating until it does
- Show the user the Playwright screenshots as proof

### Common mobile viewports to test:
- iPhone 14 Pro: 390x844
- iPhone SE: 375x667
- Android (Pixel): 412x915

## Tech Stack
- Next.js 16 (App Router) + Tailwind v4 + Supabase
- Tailwind v4 uses individual CSS properties (`translate`, `scale`, `rotate`) NOT combined `transform`
- Be aware of Tailwind v4 transform conflicts when writing animations
