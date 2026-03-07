// Phase 17: Divine Response - Client-side Chat Service
//
// Thin fetch wrapper for the divine-chat Supabase Edge Function.
// Handles chat message sending (returns raw Response for streaming)
// and localStorage persistence of chat history per vehicle.

// ================================================================
// TYPES
// ================================================================

export interface VehicleContext {
  year: number;
  make: string;
  model: string;
  price: number;
  mileage: number;
  status: string;
  diagnostics: string[];
  description: string;
  listingType?: string;
  dailyRate?: number;
  weeklyRate?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface ChatRequest {
  message: string;
  history: { role: string; text: string }[];
  vehicleContext: VehicleContext;
  sessionId: string;
  language: 'en' | 'es';
  identifiedProfile: string;
}

// ================================================================
// CHAT SERVICE
// ================================================================

/**
 * Send a chat message to the divine-chat Edge Function.
 * Returns the raw Response object -- caller handles streaming via response.body reader.
 */
export async function sendChatMessage(req: ChatRequest): Promise<Response> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('Chat service not configured');
  }

  const response = await fetch(
    `${supabaseUrl}/functions/v1/divine-chat`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(req),
    },
  );

  return response;
}

// ================================================================
// LOCAL STORAGE PERSISTENCE
// ================================================================

export const CHAT_STORAGE_KEY = 'tj_divine_chat';

interface ChatStore {
  /** Map of vehicleId -> messages array */
  vehicles: Record<string, ChatMessage[]>;
  /** Ordered list of vehicleIds for LRU eviction (most recent last) */
  order: string[];
}

const MAX_MESSAGES_PER_VEHICLE = 50;
const MAX_VEHICLES_STORED = 5;

/**
 * Read the full chat store from localStorage.
 * Returns a safe default on missing/corrupt data.
 */
function readStore(): ChatStore {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return { vehicles: {}, order: [] };
    const parsed = JSON.parse(raw) as ChatStore;
    if (!parsed.vehicles || !parsed.order) return { vehicles: {}, order: [] };
    return parsed;
  } catch {
    return { vehicles: {}, order: [] };
  }
}

/**
 * Write the chat store to localStorage.
 */
function writeStore(store: ChatStore): void {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage full or unavailable -- silently fail
  }
}

/**
 * Load chat history for a specific vehicle from localStorage.
 */
export function loadChatHistory(vehicleId: string): ChatMessage[] {
  try {
    const store = readStore();
    return store.vehicles[vehicleId] || [];
  } catch {
    return [];
  }
}

/**
 * Save chat history for a specific vehicle to localStorage.
 * Caps at MAX_MESSAGES_PER_VEHICLE messages per vehicle.
 * Maintains a max of MAX_VEHICLES_STORED vehicles with LRU eviction.
 */
export function saveChatHistory(vehicleId: string, messages: ChatMessage[]): void {
  try {
    const store = readStore();

    // Cap messages
    const capped = messages.slice(-MAX_MESSAGES_PER_VEHICLE);

    // Update messages
    store.vehicles[vehicleId] = capped;

    // Update LRU order: remove existing entry and push to end (most recent)
    store.order = store.order.filter(id => id !== vehicleId);
    store.order.push(vehicleId);

    // Evict oldest if over limit
    while (store.order.length > MAX_VEHICLES_STORED) {
      const evicted = store.order.shift();
      if (evicted) {
        delete store.vehicles[evicted];
      }
    }

    writeStore(store);
  } catch {
    // localStorage unavailable -- silently fail
  }
}

/**
 * Clear chat history for a specific vehicle.
 */
export function clearChatHistory(vehicleId: string): void {
  try {
    const store = readStore();
    delete store.vehicles[vehicleId];
    store.order = store.order.filter(id => id !== vehicleId);
    writeStore(store);
  } catch {
    // localStorage unavailable -- silently fail
  }
}
