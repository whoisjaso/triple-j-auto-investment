# Triple J — Rolls-Royce Architecture Redesign

**Date:** 2026-03-04
**Status:** Approved
**Scope:** Full visual/animation redesign of public-facing pages

---

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Keep React 19 + Vite | 27 routes, 75+ components, 24 services — migration cost too high |
| Color theme | Light #F7F7F7 base | Current site identity; Rolls-Royce layout/animations layered on top |
| Menu overlay | Dark forest green rgba(15,42,30,0.96) | Cinematic contrast against light pages |
| Frame animations | Keep all 3 (Maybach, Key, Logo forge) | User preference — placed within new section architecture |
| Global easing | cubic-bezier(0.76, 0, 0.24, 1) everywhere | Single curve = cohesive experience (Rolls-Royce pattern) |

---

## 1. Design Tokens

### Colors (CSS Custom Properties)
```css
:root {
  --tj-black:        #0A0A0A;
  --tj-forest:       #1B3A2D;
  --tj-forest-deep:  #0F2A1E;
  --tj-gold:         #C9A84C;
  --tj-gold-light:   #D4BA6A;
  --tj-cream:        #F5F0E8;
  --tj-white:        #FAFAF8;
  --tj-charcoal:     #2A2A2A;
  --tj-bg:           #F7F7F7;

  --text-primary:    #0e1b16;
  --text-muted:      rgba(14, 27, 22, 0.5);
  --text-ghost:      rgba(14, 27, 22, 0.3);
  --gold-muted:      rgba(201, 168, 76, 0.5);
  --border:          rgba(201, 168, 76, 0.08);
  --border-hover:    rgba(201, 168, 76, 0.2);
  --overlay-bg:      rgba(15, 42, 30, 0.96);
  --sub-panel-bg:    rgba(10, 10, 10, 0.4);

  --ease-rr:         cubic-bezier(0.76, 0, 0.24, 1);
}
```

### Typography
- **Display/Headlines:** Playfair Display, weight 300/400
- **Body/UI:** Plus Jakarta Sans, weight 200-600
- **Accent/Numbers:** Cormorant Garamond, weight 300-500
- **Labels:** Plus Jakarta Sans, uppercase, letter-spacing 0.15-0.25em

### Spacing
```css
--space-section:  clamp(120px, 18vh, 240px);
--space-inner:    clamp(60px, 8vh, 120px);
--space-element:  clamp(24px, 3vh, 48px);
```

---

## 2. Navigation System

### Persistent Nav Bar (70px, fixed, z-9999)
- Logo left: "TRIPLE J" in Playfair Display 16-18px gold, "AUTO INVESTMENT" below 9px
- "MENU" text right: Plus Jakarta Sans 10px, uppercase, letter-spacing 0.18em
- Scroll states: transparent → rgba(var(--tj-bg), 0.92) + backdrop-blur(14px) at 80px
- Menu open: "MENU" crossfades to "CLOSE" (absolute positioning, opacity transition)

### Full-Screen Overlay Menu — Desktop (>=1024px)
- Backdrop: rgba(15, 42, 30, 0.96) + backdrop-blur(20px)
- Left panel: 5 primary links in Playfair Display clamp(32px, 4.2vw, 52px), weight 300
  - Inventory (has sub-panel: vehicle category image cards)
  - Financing (has sub-panel: BHPH, Cash Purchase, Pre-Qualification)
  - Rentals (has sub-panel: Vehicles, Tow Truck, Agreement)
  - About (direct link)
  - Contact (direct link)
- Hover: color→gold, translateX(8px), 24px gold line appears left
- Sub-panel slides from right on category click, 2-col grid for image cards
- Footer: address, phone, socials at bottom of left panel
- Exact timing from spec (250ms stagger start, 70ms per link, etc.)

### Full-Screen Overlay Menu — Mobile (<1024px)
- Same backdrop, single column, full-width links
- Sub-navigation via horizontal translateX(-100vw) slide (not side panel)
- Back button at top of sub-screen
- 52px minimum tap targets
- Stagger fires after slide completes

### MENU/CLOSE Animation Sequences
Open: backdrop(0-400ms) → links stagger(250-530ms) → footer(700ms)
Close: sub-panel out → links reverse stagger(150-310ms) → backdrop out(500-850ms)
All using cubic-bezier(0.76, 0, 0.24, 1).

---

## 3. Hero Section

- Full-viewport carousel (2-3 slides) above existing Maybach frame animation
- Ken Burns effect on images (scale 1.0→1.06 over 8s)
- Text entrance: opacity 0, y:40 → visible, power3.out, 0.8s
- Crossfade transitions between slides (1.2s)
- Scroll indicator: gold pulsing line at bottom center
- On scroll: parallax exit (1.3x speed, opacity fade)

---

## 4. GSAP Animation System

Global `data-animate` attributes on elements:
- `fade-up`: y:50, opacity:0 → visible, 0.8s, start top 85%
- `reveal`: clipPath inset(12%) → inset(0%), 1.2s
- `rule`: horizontal gold line width:0 → full, 0.8s
- `stagger`: children stagger 0.12s apart, y:40, opacity:0

Page load sequence: nav logo → nav links → hero image → hero title → hero CTA → scroll indicator

---

## 5. Button Style (Global)

Single `.btn-rr` pattern: transparent bg, 1px gold border, gold text.
Hover: gold bg fills, text goes dark. Arrow `→` translateX(5px) on hover.
Mobile: full width.

---

## 6. Section Architecture

Rolls-Royce alternating pattern:
- Full-bleed image with clip-path reveal
- Text + image pairs with extreme vertical spacing
- Gold horizontal rules above headings
- Content sections: Our Collection, The Triple J Standard, Parallax Divider, Financing, Contact

---

## 7. Footer

Minimal, centered:
- Forest deep background
- Triple J crest → company name → address
- Single-row nav links
- Social icons
- Copyright
- 120px+ vertical padding

---

## 8. Pages Affected

| Page | Change Level |
|------|-------------|
| Home | Full rebuild — hero carousel + existing frame animations + new sections |
| Inventory | New card pattern, GSAP reveals, Rolls-Royce grid |
| VehicleDetail | New layout with image gallery, typography, spacing |
| About | Section architecture, value props with gold numbering |
| Contact | Map + CTA section, new form styling |
| Services | Section architecture update |
| Finance | Two-column layout update |
| All other pages | Typography + spacing + button style updates |
| Admin pages | No changes |
| Customer portal | No changes |

---

## 9. Build Order

1. Design tokens (CSS vars, fonts, easing) + Tailwind config update
2. Menu system (desktop + mobile overlay, all sub-panels, exact timing)
3. Nav bar (scroll behavior, MENU/CLOSE crossfade, responsive)
4. Hero section + scroll indicator
5. GSAP `data-animate` animation system
6. Home page sections rebuild
7. Inventory + VehicleDetail pages
8. About, Contact, Services, Finance pages
9. Footer redesign
10. Performance + mobile polish pass

---

## 10. What Does NOT Change

- React 19 + Vite + React Router framework
- Supabase backend + all 24 services
- Store context architecture
- Admin dashboard, Command Center, Templates
- Customer portal, Owner portal, Registration tracker
- All form components and wizards
- Bilingual EN/ES translation system
- Vercel deployment + env variables
- Frame animations (Maybach, Key, Logo forge)

---

## 11. Performance Targets

- Only animate `transform` and `opacity` (GPU-composited)
- GSAP loaded client-side only
- Font display: swap with system fallbacks
- Above-fold hero image: priority preload
- Lazy load all below-fold images
- `will-change: transform` during animation, removed after
- `touch-action: manipulation` on all interactive elements
