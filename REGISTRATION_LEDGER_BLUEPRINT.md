# Triple J Registration Status Ledger - Blueprint & Deployment

## Executive Summary
**Perception Control System**: This system reframes DMV delays as system sequence rather than dealer failure.
**Core Principle**: People hate *uncertain* waiting. This system provides a locked-stage status ledger to creates positive expectancy.

## 1. Behavioral Strategy (PRISM Application)

### ownership Framing
| Ownership Label | Color | Psychological Effect |
|----------------|-------|---------------------|
| **Your Action Required** | Amber | Creates urgency without nagging. |
| **Triple J Processing** | Blue | Shows work is happening. |
| **State Processing** | Gray | Externalizes delay (DMV). |
| **Blocked** | Red | Signals attention needed immediately. |
| **Complete** | Green | Reinforces progress. |

### Messaging Protocol
- **Never say**: "We're waiting on..."
- **Always say**: "The next step is..." or "Your registration is in the state queue."

## 2. System Architecture

### Database (Supabase)
The schema is defined in `supabase/registration_ledger.sql`.
- **Registrations**: Core record linked to Order ID.
- **Registration Stages**: 7 stages (payment -> ready) with status tracking.
- **Documents**: URLs for insurance, inspection, etc.
- **Notifications**: Audit log of sent messages.

### Frontend Components
- **Customer Tracker**: `src/pages/RegistrationTracker.tsx` (Route: `/track/:orderId`)
- **Admin Dashboard**: `src/pages/admin/Registrations.tsx` (Route: `/admin/registrations`)
- **Service Layer**: `src/services/registrationService.ts`

## 3. Deployment Checklist

### Step 1: Database Migration
1. Go to your Supabase Dashboard -> SQL Editor.
2. Open `supabase/registration_ledger.sql` from this project.
3. Run the entire script to create tables, triggers, and functions.
   - *Note: This script includes RLS policies.*

### Step 2: Environment Variables
Ensure your `.env.local` or Vercel Environment Variables are set:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Step 3: Go Live
1. Deploy the changes to Vercel (or your hosting provider).
2. Create your first registration in the Admin Dashboard (`/admin/registrations`).
3. Send the generated link (`domain.com/#/track/TJ-xxxx-xxxx`) to the customer.

## 4. Usage Guide

### Creating a Registration
1. Navigate to Command -> Admin Registrations.
2. Click "New Registration".
3. Select a sold vehicle from inventory OR enter details manually.
4. Enter Customer Name (Required).
5. The system generates a unique Order ID.

### Managing Stages
- **Advance Stage**: Click the dropdown on the current stage and select "Complete". The system automatically activates the next stage.
- **Block a Stage**: Select "Blocked" and enter a reason (e.g., "Insurance expired"). This highlights the stage in Red for the customer.
- **Customer Action**: Set "Insurance Verified" or "Inspection Complete" to "Pending" to show "Your Action Required".

## 5. Success Metrics
- **Phone Calls**: Target -60% reduction in status check calls.
- **Compliance**: Target -40% reduction in time to receive insurance/inspection docs.

---
*Built for Triple J Auto Investment LLC*
