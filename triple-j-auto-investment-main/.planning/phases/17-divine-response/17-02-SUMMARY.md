---
phase: 17
plan: 02
subsystem: chat-ui
tags: [react, hooks, streaming, chat, bilingual, framer-motion, react-markdown]
depends_on:
  requires: [17-01]
  provides: [useDivineChat hook, ChatWidget, ChatMessage, ChatInput, ChatFallback, chat translation keys]
  affects: [17-03]
tech-stack:
  added: []
  patterns: [streaming-response-hook, floating-widget-pattern, role-based-message-styling]
key-files:
  created:
    - triple-j-auto-investment-main/hooks/useDivineChat.ts
    - triple-j-auto-investment-main/components/chat/ChatWidget.tsx
    - triple-j-auto-investment-main/components/chat/ChatMessage.tsx
    - triple-j-auto-investment-main/components/chat/ChatInput.tsx
    - triple-j-auto-investment-main/components/chat/ChatFallback.tsx
  modified:
    - triple-j-auto-investment-main/utils/translations.ts
decisions:
  - Hook uses getSessionId from trackingService (reuses existing session tracking)
  - ChatWidget focus management via useRef + setTimeout(100ms) for post-animation focus
  - ChatMessage uses react-markdown only for model responses (user messages plain text)
  - Chat panel z-index 9998 (below mobile menu z-99999)
  - Streaming placeholder shows 3-dot pulsing animation (CSS animate-pulse with staggered delays)
metrics:
  duration: ~12 minutes
  completed: 2026-02-20
---

# Phase 17 Plan 02: Chat UI Components & Hook Summary

**One-liner:** Floating gold chat widget with streaming response hook, bilingual message bubbles (react-markdown for AI), and phone fallback CTA.

## What Was Built

### useDivineChat Hook (`hooks/useDivineChat.ts`)
- Chat state management: messages array, isStreaming, profile, error
- Streaming response parsing via `response.body.getReader()` + TextDecoder chunk loop
- Profile identification runs on all accumulated user messages after each send
- AbortController ref for canceling in-flight requests
- Auto-scroll via messagesEndRef on message changes
- Auto-save to localStorage via saveChatHistory on message changes
- Bilingual error messages based on language param
- clearChat resets messages, localStorage, and profile state

### ChatWidget (`components/chat/ChatWidget.tsx`)
- Floating gold button: fixed bottom-6 right-6, z-[9998], 56px circle, AnimatePresence scale entrance
- Chat panel: fixed, mobile fullscreen (100dvh), desktop windowed (400x600px, rounded-2xl)
- Header: Triple J logo (GoldTripleJLogo.png) + title + vehicle subtitle (year make model)
- Clear conversation button (Trash2 icon) when messages exist
- Escape key closes panel, focus trap (auto-focus input on open, return to button on close)
- role="dialog" with aria-label for accessibility

### ChatMessage (`components/chat/ChatMessage.tsx`)
- User messages: right-aligned, bg-tj-gold/20, rounded-2xl rounded-br-sm, plain text
- Model messages: left-aligned, bg-white/5, rounded-2xl rounded-bl-sm, react-markdown
- Empty text (streaming placeholder): 3-dot pulsing animation with staggered delays
- framer-motion entrance animation (opacity + y translate)

### ChatInput (`components/chat/ChatInput.tsx`)
- Single-line text input with rounded-full styling, 48px min-height
- Send button (Lucide Send icon) absolute positioned inside input container
- Enter submits, disabled state reduces opacity
- Auto-focus on mount via useRef + useEffect

### ChatFallback (`components/chat/ChatFallback.tsx`)
- Red-tinted error container (bg-red-900/20, border-red-500/30)
- AlertCircle icon + error text + phone CTA button
- Phone link: tel:+18324009760 styled as gold button
- Bilingual via useLanguage() and t.chat.callUs

### Translation Keys (12 per language)
Added `chat` block to both `en` and `es` in translations.ts:
- title, subtitle, openChat, closeChat, placeholder, welcome
- thinking, errorMessage, callUs, clearChat, poweredBy, maxReached

## Decisions Made

1. **getSessionId reuse:** Hook imports getSessionId from trackingService rather than duplicating -- keeps session consistent across tracking and chat.
2. **Focus management timing:** 100ms setTimeout before focusing input after panel open, allowing framer-motion entrance animation to render first.
3. **react-markdown for model only:** User messages render as plain text (no markdown injection risk). Model messages use ReactMarkdown with prose-invert styling.
4. **z-index 9998:** Consistent with plan spec, below mobile menu (z-99999) so menu overlays chat.
5. **Pulsing dot animation:** CSS animate-pulse with 0/150/300ms staggered delays for visual streaming indicator.

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

| Check | Result |
|-------|--------|
| All 5 new files compile without TS errors | PASS |
| ChatWidget renders floating button + expandable panel | PASS |
| useDivineChat manages streaming, profile, error, persistence | PASS |
| translations.ts has all chat.* keys in both en and es | PASS (12 keys each) |
| Build passes (`npm run build`) | PASS |
| No hardcoded English in components | PASS (all from translations) |

## Next Phase Readiness

Plan 17-03 (integration + wiring) can proceed. All components and hook are ready to be imported into VehicleDetail.tsx and/or App.tsx. No blockers.
