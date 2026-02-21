# Phase 17: Divine Response - Research

**Researched:** 2026-02-20
**Domain:** AI Chat Widget + Behavioral Profiling + Voice Agent + Bilingual Support
**Confidence:** MEDIUM-HIGH

## Summary

Phase 17 adds an AI-powered conversational chat widget to vehicle listing pages using Google Gemini (already integrated via `@google/genai` SDK v1.30+), updates the existing Retell AI voice agent for rental inquiries and Spanish language support, and implements psychological profile-based communication adaptation using the PCP (Perception, Context, Permission) closing framework.

The existing codebase already uses `@google/genai` with `GoogleGenAI` client, `gemini-2.5-flash` model, and `thinkingConfig`. The SDK (currently v1.32 installed, v1.42 latest) natively supports multi-turn chat via `ai.chats.create()` with `sendMessage()` and `sendMessageStream()` for streaming responses. The Retell AI service already passes dynamic variables per call. Supabase Edge Functions (Deno-based) are already deployed for notifications and plate alerts, providing the proven pattern for a server-side AI proxy.

**Critical architectural decision:** The current `geminiService.ts` uses `VITE_GEMINI_API_KEY` directly in the client bundle. For a customer-facing chat widget, this API key MUST be proxied through a Supabase Edge Function to prevent abuse. The existing admin-only Gemini calls (financial analysis, headline generation) are lower risk since they're behind auth, but the public chat endpoint absolutely requires server-side proxying.

**Primary recommendation:** Build the chat widget as a client-side React component that communicates via a new Supabase Edge Function (`divine-chat`) which holds the Gemini API key, manages system prompts with profile adaptation, and returns streamed responses. Profile identification happens in the Edge Function's system prompt logic. The Retell agent updates are configuration-only (dashboard + API updates, no new code beyond updating `retellService.ts` for fallback handling).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@google/genai` | ^1.30.0 (1.32 installed) | Gemini AI chat + streaming | Already in project, official Google SDK |
| `@supabase/supabase-js` | ^2.87.1 | Edge Function invocation from client | Already in project |
| Supabase Edge Functions | Deno runtime | Server-side Gemini proxy (API key protection) | Already used for notifications, plate alerts |
| Framer Motion | ^12.23.26 | Chat widget animations | Already in project |
| Tailwind CSS | ^3.4.19 | Chat widget styling | Already in project |
| Lucide React | ^0.554.0 | Chat UI icons (MessageCircle, Send, X, Phone) | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-markdown` | ^10.1.0 | Render markdown in chat responses | Already installed, use for formatted AI replies |
| localStorage | Browser API | Persist chat history for session continuity | Always, for conversation persistence across page loads |
| `trackingService.ts` | Existing | Track chat interactions as behavioral events | Always, feeds into profile identification |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom chat widget | `@blumessage/react-chat` or similar | Adding a dependency for something simple enough to build with existing Tailwind + Framer Motion |
| Direct Gemini client calls | Supabase Edge Function proxy | Edge Function adds latency (~50-100ms) but protects API key -- MUST use for public-facing chat |
| Server-managed chat history | Client-side localStorage | localStorage is simpler, no new DB tables; lose history on device switch but that's acceptable for this use case |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
# Update @google/genai if desired (optional, current version works):
npm install @google/genai@latest
```

## Architecture Patterns

### Recommended Project Structure
```
services/
  geminiService.ts          # Existing -- keep admin-only functions unchanged
  divineChatService.ts      # NEW -- client-side chat orchestration
  retellService.ts          # Existing -- add fallback handling
components/
  chat/
    ChatWidget.tsx           # Floating chat bubble + panel
    ChatMessage.tsx          # Individual message bubble component
    ChatInput.tsx            # Text input with send button
    ChatFallback.tsx         # Fallback UI when AI is down
    ProfileBadge.tsx         # Visual indicator of identified profile
hooks/
  useDivineChat.ts           # Chat state management hook
  useChatProfile.ts          # Profile identification logic
supabase/
  functions/
    divine-chat/
      index.ts               # Edge Function: Gemini proxy with profile-aware system prompts
utils/
  chatProfiles.ts            # Profile definitions, signal mappings, prompt templates
  translations.ts            # Add chat.* translation keys (en/es)
```

### Pattern 1: Edge Function as AI Proxy
**What:** Client sends chat messages to a Supabase Edge Function, which holds the Gemini API key and forwards to Gemini with system instructions. Response is streamed back.
**When to use:** All customer-facing AI interactions.
**Example:**
```typescript
// Client side: services/divineChatService.ts
import { supabase } from '../supabase/config';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface ChatRequest {
  message: string;
  history: ChatMessage[];
  vehicleContext: VehicleContext;
  sessionId: string;
  language: 'en' | 'es';
  identifiedProfile?: ProfileType;
}

export async function sendChatMessage(req: ChatRequest): Promise<ReadableStream<string>> {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/divine-chat`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(req),
    }
  );

  if (!response.ok) throw new Error('Chat service unavailable');
  return response.body!; // ReadableStream for streaming
}
```

```typescript
// Server side: supabase/functions/divine-chat/index.ts
import { GoogleGenAI } from 'npm:@google/genai@^1.30.0';

const ai = new GoogleGenAI({ apiKey: Deno.env.get('GEMINI_API_KEY')! });

Deno.serve(async (req) => {
  const { message, history, vehicleContext, language, identifiedProfile } = await req.json();

  const systemPrompt = buildSystemPrompt(vehicleContext, language, identifiedProfile);

  const contents = [
    ...history.map((m: any) => ({
      role: m.role,
      parts: [{ text: m.text }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  const stream = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.7,
      thinkingConfig: { thinkingBudget: 1024 },
    },
  });

  // Stream response back to client
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.text) {
          controller.enqueue(encoder.encode(chunk.text));
        }
      }
      controller.close();
    },
  });

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
});
```
**Source:** [Google GenAI Text Generation Docs](https://ai.google.dev/gemini-api/docs/text-generation), [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)

### Pattern 2: Profile Identification via Chat Signal Analysis
**What:** After each user message, analyze accumulated signals to classify the visitor into one of four profiles. The classification happens client-side (fast, no extra API call) and is sent with the next message to adjust the system prompt.
**When to use:** After every user message exchange.
**Example:**
```typescript
// utils/chatProfiles.ts

export type ProfileType = 'provider' | 'skeptic' | 'first_timer' | 'struggler' | 'unidentified';

interface ProfileSignals {
  mentionsFamily: boolean;        // "my kids", "wife", "family"
  mentionsBudget: boolean;        // "afford", "budget", "tight", "money"
  mentionsReliability: boolean;   // "reliable", "break down", "problems"
  mentionsFirstCar: boolean;      // "first car", "learning to drive", "teen"
  expressesSkepticism: boolean;   // "catch", "hidden fees", "scam", "too good"
  expressesUrgency: boolean;      // "need ASAP", "car broke down", "no ride"
  asksTechnical: boolean;         // "mileage", "engine", "transmission"
  asksFinancing: boolean;         // "payments", "down payment", "credit"
  messageCount: number;
}

// Signal keywords (bilingual)
const FAMILY_SIGNALS = ['family', 'familia', 'kids', 'hijos', 'wife', 'esposa', 'husband', 'esposo', 'children'];
const BUDGET_SIGNALS = ['afford', 'budget', 'tight', 'money', 'dinero', 'pagar', 'caro', 'expensive', 'cheap'];
const SKEPTIC_SIGNALS = ['catch', 'hidden', 'scam', 'too good', 'trust', 'honest', 'real', 'trampa'];
const FIRST_TIMER_SIGNALS = ['first car', 'primer carro', 'first time', 'primera vez', 'teen', 'learning', 'new driver'];

export function identifyProfile(messages: string[]): ProfileType {
  const combined = messages.join(' ').toLowerCase();
  const signals: ProfileSignals = {
    mentionsFamily: FAMILY_SIGNALS.some(s => combined.includes(s)),
    mentionsBudget: BUDGET_SIGNALS.some(s => combined.includes(s)),
    mentionsReliability: ['reliable', 'break down', 'confiable'].some(s => combined.includes(s)),
    mentionsFirstCar: FIRST_TIMER_SIGNALS.some(s => combined.includes(s)),
    expressesSkepticism: SKEPTIC_SIGNALS.some(s => combined.includes(s)),
    expressesUrgency: ['need', 'asap', 'broke down', 'urgente', 'necesito'].some(s => combined.includes(s)),
    asksTechnical: ['engine', 'transmission', 'motor', 'mileage'].some(s => combined.includes(s)),
    asksFinancing: ['payment', 'credit', 'finance', 'down payment', 'credito'].some(s => combined.includes(s)),
    messageCount: messages.length,
  };

  // Require 2+ messages for identification
  if (signals.messageCount < 2) return 'unidentified';

  // Scoring
  if (signals.mentionsFamily && (signals.mentionsBudget || signals.mentionsReliability)) return 'provider';
  if (signals.expressesSkepticism) return 'skeptic';
  if (signals.mentionsFirstCar) return 'first_timer';
  if (signals.expressesUrgency && signals.mentionsBudget) return 'struggler';
  if (signals.mentionsBudget && signals.mentionsReliability) return 'provider';

  return 'unidentified';
}
```

### Pattern 3: PCP Closing Sequence in System Prompt
**What:** The PCP (Perception, Context, Permission) framework is embedded into the Gemini system prompt. The AI naturally follows the sequence: first establish shared perception ("I understand you need..."), then provide context ("This vehicle fits because..."), then grant permission ("Many families in your situation choose to...").
**When to use:** When profile is identified and user shows interest signals.
**Example:**
```typescript
// Part of system prompt builder in Edge Function
function buildPCPGuidance(profile: ProfileType): string {
  const pcpBase = `
CLOSING APPROACH - PCP (Perception, Context, Permission):
When the visitor shows interest, follow this natural sequence:

1. PERCEPTION: Reflect back what you understand about their situation.
   "It sounds like you're looking for [their stated need]..."
   DO NOT assume. Use THEIR words.

2. CONTEXT: Connect the vehicle to their situation.
   "This [vehicle] is a good fit because [specific reasons matching their need]..."
   Be specific. Use the vehicle data provided.

3. PERMISSION: Make the next step feel natural and pressure-free.
   "Many people in a similar situation find it helpful to [schedule a visit / call us].
   Would you like me to help with that?"
   NEVER pressure. NEVER use urgency tactics. The permission must feel genuine.
`;

  const profileAdaptation: Record<ProfileType, string> = {
    provider: `
PROFILE: PROVIDER (Family Decision-Maker)
- Emphasize: reliability, safety, value for the family
- Speak to: their responsibility and good judgment
- Permission frame: "You're making a smart choice for your family"
- Avoid: anything that sounds risky or impulsive`,
    skeptic: `
PROFILE: SKEPTIC (Trust-Building Required)
- Emphasize: transparency, honesty, AS-IS disclosure, inspection details
- Speak to: their intelligence in doing due diligence
- Permission frame: "We appreciate customers who ask tough questions"
- Avoid: anything that sounds like a sales pitch`,
    first_timer: `
PROFILE: FIRST-TIMER (New to Buying)
- Emphasize: simplicity, guidance, patience, education
- Speak to: the excitement of getting their first vehicle
- Permission frame: "Everyone starts somewhere, and you're doing great"
- Avoid: jargon, complex financing terms, overwhelming details`,
    struggler: `
PROFILE: STRUGGLER (Urgent Need, Limited Budget)
- Emphasize: practical solutions, flexible payments, understanding
- Speak to: their situation with empathy, not pity
- Permission frame: "We work with families in all kinds of situations"
- Avoid: anything condescending, upselling, suggesting they can't afford it`,
    unidentified: `
PROFILE: Not yet identified. Ask open-ended questions to understand their needs.
Focus on: "What brings you here today?" or "Tell me about what you're looking for."`,
  };

  return pcpBase + (profileAdaptation[profile] || profileAdaptation.unidentified);
}
```

### Pattern 4: Streaming Chat Response in React
**What:** Use a custom hook that fetches from the Edge Function and reads the streaming response incrementally, updating the UI character-by-character.
**When to use:** Every chat interaction.
**Example:**
```typescript
// hooks/useDivineChat.ts
import { useState, useCallback, useRef } from 'react';
import { identifyProfile, ProfileType } from '../utils/chatProfiles';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export function useDivineChat(vehicleContext: VehicleContext, language: 'en' | 'es') {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [profile, setProfile] = useState<ProfileType>('unidentified');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    setError(null);
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);

    // Update profile based on user messages
    const userMessages = [...messages.filter(m => m.role === 'user').map(m => m.text), text];
    const newProfile = identifyProfile(userMessages);
    setProfile(newProfile);

    // Create placeholder for streaming response
    const assistantId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: assistantId, role: 'model', text: '', timestamp: Date.now() }]);
    setIsStreaming(true);

    try {
      abortRef.current = new AbortController();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/divine-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            message: text,
            history: messages.map(m => ({ role: m.role, text: m.text })),
            vehicleContext,
            language,
            identifiedProfile: newProfile,
          }),
          signal: abortRef.current.signal,
        }
      );

      if (!response.ok) throw new Error('Service unavailable');

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, text: accumulated } : m)
        );
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError('Chat is temporarily unavailable. Call us at (832) 400-9760.');
        setMessages(prev => prev.filter(m => m.id !== assistantId));
      }
    } finally {
      setIsStreaming(false);
    }
  }, [messages, vehicleContext, language]);

  return { messages, sendMessage, isStreaming, profile, error };
}
```

### Anti-Patterns to Avoid
- **Exposing Gemini API key in client code for chat:** The existing `VITE_GEMINI_API_KEY` pattern is acceptable for admin-only features behind auth, but a public chat widget MUST proxy through an Edge Function. Anyone can inspect the bundle and steal the key.
- **Building a full chatbot framework:** Don't add LangChain, vector databases, or RAG. Gemini's multi-turn chat with a good system prompt and vehicle context is sufficient. The vehicle data is small enough to include directly in the system prompt.
- **Over-engineering profile identification:** Don't use ML or another AI call for profiling. Simple keyword matching on 2-3 user messages is fast, cheap, and effective enough. The four profiles are broad categories, not precise psychological assessments.
- **Sending full chat history to Supabase on every message:** Store chat in localStorage for session continuity. Only persist to Supabase if the user converts (submits a lead form from chat). This avoids unnecessary DB writes and privacy concerns.
- **Using `ai.chats.create()` in Edge Function:** Edge Functions are stateless per invocation. Don't try to maintain a chat session object. Instead, pass the full history array with each request to `generateContentStream()` -- this is how the SDK works behind the scenes anyway.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Streaming text display | Custom character-by-character renderer | ReadableStream + TextDecoder with `reader.read()` loop | Browser API handles chunked transfer encoding natively |
| Chat message markdown | Custom text formatter | `react-markdown` (already installed) | Handles bold, links, lists that Gemini may include in responses |
| Chat widget positioning | Custom position logic | Tailwind `fixed bottom-6 right-6` + `z-[9999]` | CSS handles this perfectly, no JS needed |
| Mobile chat fullscreen | Complex resize logic | Tailwind responsive: `md:w-[400px] md:h-[600px] w-full h-full` on mobile | Chat should go fullscreen on mobile, windowed on desktop |
| Chat scroll-to-bottom | Manual scroll management | `useRef` + `scrollIntoView({ behavior: 'smooth' })` on new messages | Standard pattern, don't overthink it |
| UUID generation | Custom ID generator | `crypto.randomUUID()` (already used in trackingService) | Browser-native, no library needed |
| Retell Spanish support | Custom translation layer | Retell's built-in `language` field + prompt instruction | Set `language: 'es'` on agent, add "respond in Spanish" to prompt |

**Key insight:** This phase is primarily about prompt engineering and UI, not complex infrastructure. The Gemini SDK handles multi-turn chat automatically. The only new "backend" piece is a single Edge Function that's essentially a thin proxy with a smart system prompt.

## Common Pitfalls

### Pitfall 1: API Key Exposure in Client Bundle
**What goes wrong:** Gemini API key in `VITE_GEMINI_API_KEY` is bundled into the client JS. Anyone viewing the page can extract it and make unlimited API calls at your expense.
**Why it happens:** The existing pattern works for admin-only features but the chat widget is public-facing.
**How to avoid:** All chat requests go through `supabase/functions/divine-chat/` Edge Function. The Gemini API key is stored as an Edge Function secret (`GEMINI_API_KEY`), never in `VITE_` env vars for chat.
**Warning signs:** If you see `import.meta.env.VITE_GEMINI_API_KEY` in any file that handles public chat messages, stop immediately.

### Pitfall 2: Chat Widget Blocking Page Interaction
**What goes wrong:** A floating chat widget covers important page elements (CTA buttons, price, phone number) especially on mobile.
**Why it happens:** Fixed positioning with high z-index can overlap with the existing navbar (z-50) and mobile menu (z-99999).
**How to avoid:** Use `z-[9998]` (below mobile menu). On mobile, the chat button should be small (56px circle). When expanded, chat goes fullscreen with a clear close button. On desktop, position bottom-right with the widget taking at most 400x600px.
**Warning signs:** Test on 375px width (iPhone SE). If the chat bubble covers the phone number or "Call Now" CTA, reposition.

### Pitfall 3: Gemini Hallucinating Vehicle Details
**What goes wrong:** AI invents features, prices, or availability that don't match the actual vehicle data.
**Why it happens:** Gemini will "fill in gaps" if the system prompt doesn't explicitly constrain it.
**How to avoid:** The system prompt MUST include: (1) exact vehicle data (year, make, model, price, mileage, diagnostics), (2) explicit instruction: "ONLY discuss details you have been given. If you don't know something, say 'I don't have that information, but our team can help you at (832) 400-9760.'" and (3) "NEVER invent features, history, or claims about the vehicle."
**Warning signs:** AI says "this car has Bluetooth" when vehicle data doesn't mention Bluetooth.

### Pitfall 4: Infinite Token Usage from Long Conversations
**What goes wrong:** Each Gemini call sends the FULL conversation history. After 20+ exchanges, this becomes expensive and slow.
**Why it happens:** The `@google/genai` chat SDK sends all history with each turn.
**How to avoid:** Cap conversation history at 10 message pairs (20 messages). When exceeded, keep the system prompt + first 2 exchanges + last 8 exchanges. Display a message: "For a longer conversation, call us at (832) 400-9760."
**Warning signs:** Gemini responses getting slower after many turns; monthly API bill spikes.

### Pitfall 5: Retell Agent Prompt Changes Breaking Existing Calls
**What goes wrong:** Updating the Retell agent prompt for rental inquiries accidentally breaks the vehicle purchase inquiry flow.
**Why it happens:** Retell uses a single prompt (or conversation flow) per agent.
**How to avoid:** Test the updated prompt against ALL existing scenarios (vehicle inquiry, appointment setting) before deploying. Consider creating a separate Retell agent for rental inquiries if the prompts diverge significantly.
**Warning signs:** Outbound calls about vehicle purchases start mentioning rental terms.

### Pitfall 6: Chat Not Respecting Language Context
**What goes wrong:** User is browsing in Spanish (lang=es) but chat responds in English, or vice versa.
**Why it happens:** Language preference not passed to the Edge Function.
**How to avoid:** Read language from `useLanguage()` hook and pass it with every chat request. The system prompt explicitly says "Respond in Spanish" or "Respond in English" based on the language parameter. The user can also switch mid-conversation.
**Warning signs:** `lang` parameter not included in the chat request payload.

## Code Examples

### Chat Widget Component Structure
```typescript
// Source: Custom implementation following codebase patterns (Tailwind + Framer Motion)

// components/chat/ChatWidget.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Phone } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useDivineChat } from '../../hooks/useDivineChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatFallback } from './ChatFallback';
import { Vehicle } from '../../types';

interface ChatWidgetProps {
  vehicle: Vehicle;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ vehicle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { lang, t } = useLanguage();
  const vehicleContext = {
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    price: vehicle.price,
    mileage: vehicle.mileage,
    status: vehicle.status,
    diagnostics: vehicle.diagnostics || [],
    description: vehicle.description,
    listingType: vehicle.listingType,
    dailyRate: vehicle.dailyRate,
    weeklyRate: vehicle.weeklyRate,
  };

  const { messages, sendMessage, isStreaming, profile, error } = useDivineChat(vehicleContext, lang);

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-[9998] w-14 h-14 rounded-full bg-tj-gold text-black shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center"
            aria-label={t.chat?.openChat || 'Chat with us'}
          >
            <MessageCircle size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-0 right-0 md:bottom-6 md:right-6 z-[9998]
                       w-full h-[100dvh] md:w-[400px] md:h-[600px] md:rounded-2xl
                       bg-black border border-white/10 flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/80">
              <div className="flex items-center gap-3">
                <img src="/GoldTripleJLogo.png" alt="" className="w-8 h-8" />
                <div>
                  <p className="text-white text-sm font-display tracking-wider">
                    {t.chat?.title || 'Triple J Assistant'}
                  </p>
                  <p className="text-gray-400 text-[10px] uppercase tracking-widest">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white p-2"
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Welcome message */}
              {messages.length === 0 && (
                <ChatMessage
                  role="model"
                  text={t.chat?.welcome || `Hi! I can help you learn about this ${vehicle.year} ${vehicle.make} ${vehicle.model}. What would you like to know?`}
                />
              )}
              {messages.map(msg => (
                <ChatMessage key={msg.id} role={msg.role} text={msg.text} />
              ))}
              {error && <ChatFallback message={error} />}
            </div>

            {/* Input Area */}
            <ChatInput
              onSend={sendMessage}
              disabled={isStreaming}
              placeholder={t.chat?.placeholder || 'Ask about this vehicle...'}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
```

### Edge Function: divine-chat
```typescript
// Source: Follows existing Edge Function patterns (supabase/functions/unsubscribe/index.ts)

// supabase/functions/divine-chat/index.ts
import { GoogleGenAI } from 'npm:@google/genai@^1.30.0';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'AI service not configured' }),
      { status: 503, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { message, history, vehicleContext, language, identifiedProfile } = await req.json();

    if (!message || typeof message !== 'string' || message.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Invalid message' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Cap history to prevent token abuse
    const cappedHistory = (history || []).slice(-20);

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const systemPrompt = buildSystemPrompt(vehicleContext, language, identifiedProfile);

    const contents = [
      ...cappedHistory.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: String(m.text).slice(0, 500) }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ];

    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 1024 },
      },
    });

    const encoder = new TextEncoder();
    const body = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.text) {
              controller.enqueue(encoder.encode(chunk.text));
            }
          }
        } catch {
          controller.enqueue(encoder.encode('\n\n[Chat temporarily unavailable. Call (832) 400-9760]'));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(body, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Divine chat error:', error);
    return new Response(
      JSON.stringify({ error: 'Service temporarily unavailable' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});

function buildSystemPrompt(
  vehicle: any,
  language: string,
  profile: string
): string {
  const langInstruction = language === 'es'
    ? 'RESPOND ENTIRELY IN SPANISH. The customer speaks Spanish.'
    : 'Respond in English.';

  return `You are the Triple J Auto Investment virtual assistant on the dealership website.
${langInstruction}

ABOUT THE DEALERSHIP:
- Triple J Auto Investment, 8774 Almeda Genoa Road, Houston, TX 77075
- Phone: (832) 400-9760
- Hours: Mon-Sat 9AM-6PM, Closed Sunday
- Buy Here Pay Here (BHPH) dealership serving Houston working families
- Price range: $3,000-$8,000 pre-owned vehicles
- Honest, transparent, no-pressure approach
- Dealer License: P171632

VEHICLE THE CUSTOMER IS VIEWING:
- ${vehicle.year} ${vehicle.make} ${vehicle.model}
- Price: $${vehicle.price?.toLocaleString() || 'Contact for pricing'}
- Mileage: ${vehicle.mileage?.toLocaleString() || 'N/A'} miles
- Status: ${vehicle.status || 'Available'}
- Condition Notes: ${vehicle.diagnostics?.length ? vehicle.diagnostics.join(', ') : 'No issues reported, vehicle inspected'}
- Description: ${vehicle.description || 'Contact us for details'}
${vehicle.listingType === 'rental_only' || vehicle.listingType === 'both' ? `- Also available for rent: $${vehicle.dailyRate}/day, $${vehicle.weeklyRate}/week` : ''}

RULES:
1. ONLY discuss information you've been given above. NEVER invent features, history, or claims.
2. If asked something you don't know, say "I don't have that specific detail, but our team can help! Call (832) 400-9760 or I can help you schedule a visit."
3. Keep responses concise (2-4 sentences max). This is a chat, not an essay.
4. Be warm, helpful, and honest -- like a trusted neighbor.
5. If the customer mentions diagnostics/issues, acknowledge them honestly.
6. All vehicles are sold AS-IS. Be upfront about this when relevant.
7. Guide toward action: scheduling a visit, calling, or asking more questions.
8. NEVER discuss other dealerships, competitors, or vehicles not in our inventory.
9. NEVER make up financing terms. Say "We offer in-house financing. Our team can discuss specific terms when you visit."

${buildPCPGuidance(profile)}`;
}
```

### Graceful Fallback Pattern
```typescript
// components/chat/ChatFallback.tsx
import { Phone, AlertCircle } from 'lucide-react';

export const ChatFallback: React.FC<{ message?: string }> = ({ message }) => (
  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center">
    <AlertCircle className="text-red-400 mx-auto mb-2" size={20} />
    <p className="text-sm text-gray-300 mb-3">
      {message || 'Chat is temporarily unavailable.'}
    </p>
    <a
      href="tel:+18324009760"
      className="inline-flex items-center gap-2 bg-tj-gold text-black px-4 py-2 rounded font-bold text-sm hover:bg-white transition-colors"
    >
      <Phone size={14} />
      Call (832) 400-9760
    </a>
  </div>
);

// For Retell fallback in retellService.ts, the pattern already exists:
// return { success: false, error: 'Call service not configured. Please call us directly at (832) 400-9760' }
```

### Retell Service Update for Rental + Spanish
```typescript
// Updated retellService.ts - add rental inquiry context
export async function triggerOutboundCall(payload: VehicleInquiryPayload): Promise<RetellCallResponse> {
  // ... existing validation ...

  // NEW: Detect if this is a rental inquiry
  const isRentalInquiry = payload.inquiry_source === 'rental_inquiry';

  const dynamicVars: Record<string, string> = {
    customer_name: payload.customer_name,
    phone_number: payload.phone_number,
    email: payload.email || '',
    vehicle_year: payload.vehicle_year,
    vehicle_make: payload.vehicle_make,
    vehicle_model: payload.vehicle_model,
    vehicle_full: payload.vehicle_full,
    vehicle_price: payload.vehicle_price,
    vehicle_condition: payload.vehicle_condition,
    vehicle_status: payload.vehicle_status,
    inquiry_source: payload.inquiry_source,
    // NEW: Rental-specific context
    is_rental: isRentalInquiry ? 'yes' : 'no',
    daily_rate: payload.daily_rate || '',
    weekly_rate: payload.weekly_rate || '',
  };

  // ... rest of API call with dynamicVars ...
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@google/generative-ai` SDK | `@google/genai` SDK | Aug 2025 (old deprecated) | Project already uses new SDK. No migration needed. |
| Retell V1 API | Retell V2 API | Feb 2025 | Project already uses V2 (`/v2/create-phone-call`). No migration needed. |
| `ChatSession` object (old SDK) | `ai.chats.create()` (new SDK) | 2025 | New SDK pattern for chat. Also supports direct `generateContentStream` with full history array which is better for stateless Edge Functions. |
| Single-language Retell agents | Multilingual mode with language detection | 2025 | Can enable language auto-detection so agent handles Spanish callers automatically |
| `ai.interactions` API | Available in @google/genai >=1.33.0 | Late 2025 | Server-managed conversation history via `previous_interaction_id`. Beta/preview. NOT recommended for this phase -- `generateContentStream` with client-managed history is simpler and stable. |

**Deprecated/outdated:**
- `@google/generative-ai` package: Fully deprecated, support ended Aug 31, 2025. The project correctly uses `@google/genai`.
- Retell V1 API: Deprecated Feb 5, 2025. The project correctly uses V2.

## Open Questions

Things that couldn't be fully resolved:

1. **Supabase Edge Function streaming support**
   - What we know: Supabase Edge Functions run on Deno Deploy, which supports `ReadableStream` responses. Other projects have implemented streaming from Edge Functions successfully.
   - What's unclear: Whether Supabase's proxy layer (between client and Deno runtime) buffers the stream or passes it through in real-time. Some reports suggest there may be buffering.
   - Recommendation: Implement streaming first (better UX). If Supabase buffers, fall back to returning the complete response as JSON. Test early in development.

2. **Gemini Rate Limits for Chat**
   - What we know: Gemini 2.5 Flash has generous free-tier limits. The existing admin features use it sparingly.
   - What's unclear: What the actual rate limits are per minute for a public chat widget that could get moderate traffic.
   - Recommendation: Implement rate limiting in the Edge Function (max 3 messages per minute per session, max 30 per hour). Track usage. Start with `gemini-2.5-flash` which is cost-effective.

3. **Retell Agent Update Approach**
   - What we know: Retell agents can be updated via the dashboard or API. Dynamic variables are already passed per call. Spanish can be enabled via `language` field + prompt instruction.
   - What's unclear: Whether it's better to create a separate Retell agent for rental inquiries vs. updating the existing agent prompt to handle both purchase and rental flows.
   - Recommendation: Start by updating the existing agent's prompt with conditional logic based on the `is_rental` dynamic variable. Only create a separate agent if the prompts become too complex.

4. **Chat History Persistence Strategy**
   - What we know: localStorage works for same-session continuity. Supabase could store histories for CRM value.
   - What's unclear: Privacy implications of storing chat conversations. Whether CCPA/TCPA requires consent before storing AI chat transcripts.
   - Recommendation: Phase 17 uses localStorage only. Persist to Supabase in a future phase with explicit user consent. This keeps the scope manageable.

## Sources

### Primary (HIGH confidence)
- `@google/genai` SDK - [npm package](https://www.npmjs.com/package/@google/genai), [GitHub](https://github.com/googleapis/js-genai)
- [Google Gemini Text Generation Docs](https://ai.google.dev/gemini-api/docs/text-generation) - system instructions, chat, streaming
- [Retell AI Dynamic Variables](https://docs.retellai.com/build/dynamic-variables) - per-call variables, defaults
- [Retell AI Language Configuration](https://docs.retellai.com/agent/language) - Spanish support, multilingual mode
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions) - architecture, securing functions
- Existing codebase: `geminiService.ts`, `retellService.ts`, `trackingService.ts`, `supabase/functions/` -- examined directly

### Secondary (MEDIUM confidence)
- [PCP Model (Chase Hughes)](https://www.betterquestions.co/perception-context-and-permission/) - Perception, Context, Permission framework definition
- [PCP Model Application](https://medium.com/@ambreenmasud/the-pcp-model-how-perception-context-permission-shape-human-behavior-6735dfd5dfc9) - PCP in influence/sales context
- [Retell AI Multilingual Support Blog](https://www.retellai.com/blog/how-to-use-ai-phone-agents-for-multilingual-communication) - Spanish language setup details
- [Supabase Edge Functions as AI Proxy](https://supabase.com/docs/guides/functions/auth) - securing edge functions, secret management

### Tertiary (LOW confidence)
- Chat widget UX patterns - synthesized from [Ably blog](https://ably.com/blog/how-to-build-a-live-chat-widget-in-react-creation) and [Flowbite chat bubbles](https://flowbite.com/docs/components/chat-bubble/). Patterns are standard but specific implementation adapted for this project.
- Profile identification keyword lists - custom-designed based on the dealership's target demographics (Houston, BHPH, $3K-$8K). These should be tested and refined with real user data.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project. @google/genai chat API verified via official docs.
- Architecture (Edge Function proxy): HIGH - Follows existing codebase patterns (3 Edge Functions already deployed). Gemini streaming API confirmed.
- Profile identification: MEDIUM - Keyword-based approach is proven but specific keyword lists are custom and untested. The four profile categories (Provider/Skeptic/First-Timer/Struggler) are business-defined.
- PCP closing sequence: MEDIUM - Framework is well-documented (Chase Hughes) but implementation as AI system prompt instructions is novel. Requires iterative prompt tuning.
- Retell updates: MEDIUM - API endpoints confirmed. Dashboard configuration cannot be verified without account access. Spanish language support confirmed in docs.
- Pitfalls: HIGH - Based on direct codebase analysis (API key exposure confirmed in code), official SDK documentation (token limits, history management), and standard web development patterns.

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (stable -- core libraries unlikely to change)
