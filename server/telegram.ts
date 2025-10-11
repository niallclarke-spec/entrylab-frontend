import TelegramBot from 'node-telegram-bot-api';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID!;

let bot: TelegramBot | null = null;

export function initTelegramBot() {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
    console.warn('Telegram bot credentials not configured. Telegram notifications disabled.');
    return null;
  }

  try {
    bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });
    console.log('Telegram bot initialized successfully');
    return bot;
  } catch (error) {
    console.error('Failed to initialize Telegram bot:', error);
    return null;
  }
}

export async function sendReviewNotification(reviewData: {
  postId: number;
  brokerName: string;
  rating: number;
  author: string;
  excerpt: string;
  reviewLink: string;
}) {
  if (!bot) {
    console.warn('Telegram bot not initialized. Cannot send notification.');
    return;
  }

  // Telegram has a 4096 character limit, so we'll show up to 1000 chars of review
  const reviewContent = reviewData.excerpt.length > 1000 
    ? reviewData.excerpt.substring(0, 1000) + '...' 
    : reviewData.excerpt;

  const message = `
🔔 *New Review Submitted!*

📊 *Broker:* ${escapeMarkdown(reviewData.brokerName)}
⭐ *Rating:* ${reviewData.rating}/5
👤 *Author:* ${escapeMarkdown(reviewData.author)}

📝 *Review:*
${escapeMarkdown(reviewContent)}

🔗 [View in WordPress](${reviewData.reviewLink})

*Commands:*
\`/approve_${reviewData.postId}\` - Publish this review
\`/reject_${reviewData.postId}\` - Delete review
\`/view_${reviewData.postId}\` - See full review details
  `.trim();

  try {
    await bot.sendMessage(TELEGRAM_CHANNEL_ID, message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: false,
    });
    console.log(`Review notification sent for post ${reviewData.postId}`);
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
}

export async function sendTelegramMessage(text: string, parseMode: 'Markdown' | 'HTML' = 'Markdown') {
  if (!bot) {
    console.warn('Telegram bot not initialized. Cannot send message.');
    return;
  }

  try {
    await bot.sendMessage(TELEGRAM_CHANNEL_ID, text, {
      parse_mode: parseMode,
    });
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
  }
}

// Escape special characters for Telegram Markdown
function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

export function getTelegramBot() {
  return bot;
}
