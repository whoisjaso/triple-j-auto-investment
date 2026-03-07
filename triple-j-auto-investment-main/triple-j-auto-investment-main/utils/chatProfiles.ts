// Phase 17: Divine Response - Chat Profile Identification
//
// Classifies customer messages into psychological profiles using bilingual
// keyword signal analysis. Used by the divine-chat Edge Function to adapt
// system prompts via the PCP (Perception, Context, Permission) framework.

// ================================================================
// PROFILE TYPES
// ================================================================

export type ProfileType = 'provider' | 'skeptic' | 'first_timer' | 'struggler' | 'unidentified';

/**
 * Customer-friendly profile labels (never expose internal names like "Skeptic" or "Struggler").
 */
export const PROFILE_LABELS: Record<ProfileType, { en: string; es: string }> = {
  provider: { en: 'Family-Focused', es: 'Enfocado en Familia' },
  skeptic: { en: 'Detail-Oriented', es: 'Orientado al Detalle' },
  first_timer: { en: 'First-Time Buyer', es: 'Comprador Primerizo' },
  struggler: { en: 'Solution Seeker', es: 'Buscador de Soluciones' },
  unidentified: { en: 'Getting to Know You', es: 'Conociendote' },
};

// ================================================================
// BILINGUAL SIGNAL KEYWORDS
// ================================================================

const FAMILY_SIGNALS = [
  'family', 'familia', 'kids', 'hijos', 'wife', 'esposa',
  'husband', 'esposo', 'children', 'ninos',
];

const BUDGET_SIGNALS = [
  'afford', 'budget', 'tight', 'money', 'dinero',
  'pagar', 'caro', 'expensive', 'cheap', 'barato',
];

const SKEPTIC_SIGNALS = [
  'catch', 'hidden', 'scam', 'too good', 'trust',
  'honest', 'real', 'trampa', 'estafa', 'problema',
];

const FIRST_TIMER_SIGNALS = [
  'first car', 'primer carro', 'first time', 'primera vez',
  'teen', 'learning', 'new driver', 'nuevo conductor',
];

const URGENCY_SIGNALS = [
  'need', 'asap', 'broke down', 'urgente', 'necesito',
  'descompuso', 'stranded', 'sin carro',
];

const RELIABILITY_SIGNALS = [
  'reliable', 'break down', 'confiable', 'dependable',
  'last long', 'duradero',
];

// ================================================================
// PROFILE IDENTIFICATION
// ================================================================

interface ProfileSignals {
  mentionsFamily: boolean;
  mentionsBudget: boolean;
  mentionsReliability: boolean;
  mentionsFirstCar: boolean;
  expressesSkepticism: boolean;
  expressesUrgency: boolean;
  messageCount: number;
}

/**
 * Identify the customer profile from their accumulated chat messages.
 *
 * Requires at least 2 messages before committing to a profile classification.
 * Returns 'unidentified' for fewer than 2 messages or when no clear signals match.
 *
 * Priority order:
 * 1. family + (budget OR reliability) = provider
 * 2. skepticism signals = skeptic
 * 3. first-timer signals = first_timer
 * 4. urgency + budget = struggler
 * 5. budget + reliability = provider (secondary)
 * 6. unidentified
 */
export function identifyProfile(messages: string[]): ProfileType {
  if (messages.length < 2) return 'unidentified';

  const combined = messages.join(' ').toLowerCase();

  const signals: ProfileSignals = {
    mentionsFamily: FAMILY_SIGNALS.some(s => combined.includes(s)),
    mentionsBudget: BUDGET_SIGNALS.some(s => combined.includes(s)),
    mentionsReliability: RELIABILITY_SIGNALS.some(s => combined.includes(s)),
    mentionsFirstCar: FIRST_TIMER_SIGNALS.some(s => combined.includes(s)),
    expressesSkepticism: SKEPTIC_SIGNALS.some(s => combined.includes(s)),
    expressesUrgency: URGENCY_SIGNALS.some(s => combined.includes(s)),
    messageCount: messages.length,
  };

  // 1. Family + budget/reliability = provider
  if (signals.mentionsFamily && (signals.mentionsBudget || signals.mentionsReliability)) {
    return 'provider';
  }

  // 2. Skepticism signals = skeptic
  if (signals.expressesSkepticism) {
    return 'skeptic';
  }

  // 3. First-timer signals = first_timer
  if (signals.mentionsFirstCar) {
    return 'first_timer';
  }

  // 4. Urgency + budget = struggler
  if (signals.expressesUrgency && signals.mentionsBudget) {
    return 'struggler';
  }

  // 5. Budget + reliability = provider (secondary)
  if (signals.mentionsBudget && signals.mentionsReliability) {
    return 'provider';
  }

  return 'unidentified';
}
