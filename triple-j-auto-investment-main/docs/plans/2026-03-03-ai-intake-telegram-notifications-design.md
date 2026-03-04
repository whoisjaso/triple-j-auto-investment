# AI-Enhanced Vehicle Intake + Telegram Notifications

**Date:** 2026-03-03
**Status:** Approved

## Overview

Enhance the vehicle intake pipeline with Gemini AI deal analysis and broadcast
notifications via Telegram to the Triple J team group chat.

## Notification Recipients

- (832) 818-6428
- (281) 253-3602
- (281) 912-4266
- jobawems@gmail.com
- galachy1@gmail.com

All phone numbers receive Telegram via a shared group chat.
Emails receive parallel notification via Resend (when configured).

## Architecture

```
Manheim Email → Gmail Trigger → vehicle-intake Edge Function
                                     ↓
                               1. NHTSA VIN Decode
                               2. Gemini AI Deal Analysis (NEW)
                               3. Insert Draft Vehicle
                               4. Telegram Notification (NEW)
                                     ↓
                               Bot → Group Chat

Central Dispatch → Gmail Trigger → Supabase REST (towing update)
                                        ↓
                                   Telegram via new Edge Function
```

## Components

### 1. Shared Telegram Module (`_shared/telegram.ts`)

- `sendTelegramMessage(chatId, text, parseMode?)` — sends to Telegram Bot API
- Uses `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` secrets
- Supports MarkdownV2 formatting
- Returns `{ success, messageId, error }`

### 2. AI Deal Analysis (in `vehicle-intake/index.ts`)

After VIN decode, add Gemini prompt:
- Input: year, make, model, trim, mileage, purchasePrice, bodyClass, fuelType
- Output JSON: `{ marketValue, profitPotential, riskFlags[], recommendation, suggestedListPrice }`
- Uses existing Gemini 2.5 Flash endpoint

### 3. Telegram Notification (in `vehicle-intake/index.ts`)

After DB insert, send formatted message:
```
🚗 NEW VEHICLE INTAKE

2020 Ford Fusion SE — VIN: 3FA6P0HD5LR202453
Source: Manheim Auction

💰 DEAL ANALYSIS (AI)
• Purchase: $3,200
• Market Value: ~$8,500
• Suggested List: $12,800
• Profit Potential: ★★★ HIGH
• Margin: ~$9,600

⚠️ Flags: None

📋 Status: Draft
```

### 4. Towing Cost Notification (`manheim-gmail-trigger.gs`)

After towing update, call a lightweight Edge Function or Telegram API directly:
```
🚚 TOWING UPDATE

2013 BMW 5 Series — VIN: WBAFU7C55DDU71300
Towing Cost: $175.00
```

### 5. Weekly Summary (enhance `weekly-digest/index.ts`)

Add Telegram message alongside email:
```
📊 WEEKLY SUMMARY

Vehicles Acquired: 4
Total Spend: $12,800
Towing Costs: $700
Est. Profit Potential: $38,400
```

## Secrets Required

| Secret | Status |
|--------|--------|
| `TELEGRAM_BOT_TOKEN` | ✅ Set |
| `TELEGRAM_CHAT_ID` | Pending (user creating group) |
| `GEMINI_API_KEY` | ✅ Set |

## Files to Create/Modify

1. **CREATE** `supabase/functions/_shared/telegram.ts`
2. **MODIFY** `supabase/functions/vehicle-intake/index.ts` — add AI analysis + Telegram
3. **MODIFY** `docs/manheim-gmail-trigger.gs` — add Telegram call after towing
4. **MODIFY** `supabase/functions/weekly-digest/index.ts` — add Telegram summary
5. **SET** `TELEGRAM_CHAT_ID` secret once group is created
