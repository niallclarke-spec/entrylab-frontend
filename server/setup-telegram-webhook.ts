import https from 'https';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Force production URL - set TELEGRAM_WEBHOOK_URL env var to override
const WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL || 'https://entrylab.io/api/telegram/webhook';

async function setWebhook() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN not found in environment variables');
    process.exit(1);
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`;
  
  const postData = JSON.stringify({
    url: WEBHOOK_URL,
    allowed_updates: ['message', 'callback_query']
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const result = JSON.parse(data);
        if (result.ok) {
          console.log('✅ Telegram webhook set successfully!');
          console.log(`📍 Webhook URL: ${WEBHOOK_URL}`);
          console.log(`📊 Result:`, result.result);
          resolve(result);
        } else {
          console.error('❌ Failed to set webhook:', result);
          reject(new Error(result.description));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

async function getWebhookInfo() {
  if (!TELEGRAM_BOT_TOKEN) {
    return;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`;
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const result = JSON.parse(data);
        if (result.ok) {
          console.log('\n📌 Current Webhook Info:');
          console.log(JSON.stringify(result.result, null, 2));
          resolve(result);
        } else {
          reject(new Error(result.description));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Run the setup
(async () => {
  try {
    console.log('🤖 Setting up Telegram webhook...\n');
    await setWebhook();
    await getWebhookInfo();
    console.log('\n✨ Setup complete!');
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
})();
