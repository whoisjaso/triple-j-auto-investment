// Telegram Bot helper for Supabase Edge Functions
// Uses Telegram Bot API via fetch() - no SDK needed

interface SendTelegramResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

/**
 * Send a message via the Telegram Bot API.
 *
 * Required Deno env vars:
 *   TELEGRAM_BOT_TOKEN
 *   TELEGRAM_CHAT_ID
 *
 * @param text - Message text (supports HTML or MarkdownV2)
 * @param parseMode - 'HTML' (default) or 'MarkdownV2'
 */
export async function sendTelegram(
  text: string,
  parseMode: 'HTML' | 'MarkdownV2' = 'HTML',
): Promise<SendTelegramResult> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID');

  if (!botToken || !chatId) {
    const missing = [
      !botToken && 'TELEGRAM_BOT_TOKEN',
      !chatId && 'TELEGRAM_CHAT_ID',
    ].filter(Boolean).join(', ');
    console.error(`[telegram] Missing env vars: ${missing}`);
    return { success: false, error: `Missing env vars: ${missing}` };
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();

    if (data.ok) {
      console.log(`[telegram] Message sent, id: ${data.result.message_id}`);
      return { success: true, messageId: data.result.message_id };
    } else {
      console.error(`[telegram] API error: ${data.description}`);
      return { success: false, error: data.description };
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[telegram] Network error: ${errorMsg}`);
    return { success: false, error: `Network error: ${errorMsg}` };
  }
}
