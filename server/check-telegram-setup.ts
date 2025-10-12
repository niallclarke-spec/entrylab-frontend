#!/usr/bin/env tsx
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';

// Load environment variables
dotenv.config();

console.log('\n🔍 Telegram Setup Diagnostic\n');

// Check 1: Environment Variables
console.log('1️⃣ Checking environment variables...');
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID;

if (!botToken) {
  console.log('❌ TELEGRAM_BOT_TOKEN is NOT set');
} else {
  console.log(`✅ TELEGRAM_BOT_TOKEN is set (${botToken.substring(0, 10)}...)`);
}

if (!channelId) {
  console.log('❌ TELEGRAM_CHANNEL_ID is NOT set');
} else {
  console.log(`✅ TELEGRAM_CHANNEL_ID is set (${channelId})`);
}

// Check 2: Try to initialize bot
if (botToken && channelId) {
  console.log('\n2️⃣ Testing bot initialization...');
  try {
    const bot = new TelegramBot(botToken, { polling: false });
    console.log('✅ Bot initialized successfully');

    // Check 3: Test sending a message
    console.log('\n3️⃣ Testing message send...');
    bot.sendMessage(channelId, '🧪 *Test Message from Production*\n\nIf you see this, Telegram is working!', {
      parse_mode: 'Markdown'
    }).then(() => {
      console.log('✅ Test message sent successfully!');
      console.log('\n✨ Telegram setup is complete and working!');
      process.exit(0);
    }).catch((error: any) => {
      console.log('❌ Failed to send test message:', error.message);
      if (error.message.includes('chat not found')) {
        console.log('\n💡 Solution: Make sure the bot is added to the Telegram channel/chat');
      }
      process.exit(1);
    });
  } catch (error: any) {
    console.log('❌ Failed to initialize bot:', error.message);
    process.exit(1);
  }
} else {
  console.log('\n❌ Cannot test bot - missing credentials');
  console.log('\n📝 To fix:');
  if (!botToken) {
    console.log('   1. Add TELEGRAM_BOT_TOKEN to your .env file or environment');
  }
  if (!channelId) {
    console.log('   2. Add TELEGRAM_CHANNEL_ID to your .env file or environment');
  }
  process.exit(1);
}
