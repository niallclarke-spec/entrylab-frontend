export function getWelcomeEmailHtml(inviteLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to EntryLab Signals</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #8b5cf6;
      margin-bottom: 10px;
    }
    h1 {
      color: #1a1a1a;
      font-size: 28px;
      margin: 0 0 20px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #8b5cf6;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .cta-button:hover {
      background-color: #7c3aed;
    }
    .info-box {
      background-color: #f9fafb;
      border-left: 4px solid #8b5cf6;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">EntryLab</div>
      <h1>🎉 Welcome to Premium Signals!</h1>
    </div>
    
    <p>Your subscription is now active! You have exclusive access to our private Telegram channel where we share:</p>
    
    <ul>
      <li>Real-time forex trading signals</li>
      <li>Market analysis and insights</li>
      <li>Entry and exit strategies</li>
      <li>Risk management guidance</li>
    </ul>
    
    <div class="info-box">
      <strong>Important:</strong> Click the button below to join our private Telegram channel. This link is unique to your subscription.
    </div>
    
    <div style="text-align: center;">
      <a href="${inviteLink}" class="cta-button">Join Private Channel</a>
    </div>
    
    <p style="margin-top: 30px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #8b5cf6;">${inviteLink}</p>
    
    <div class="footer">
      <p>Questions? Contact us at support@entrylab.io</p>
      <p>© 2024 EntryLab. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function getCancellationEmailHtml(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Cancelled</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #8b5cf6;
      margin-bottom: 10px;
    }
    h1 {
      color: #1a1a1a;
      font-size: 28px;
      margin: 0 0 20px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #8b5cf6;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .info-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">EntryLab</div>
      <h1>We're Sorry to See You Go</h1>
    </div>
    
    <p>Your EntryLab Signals subscription has been cancelled, and your access to the private Telegram channel has been revoked.</p>
    
    <div class="info-box">
      <strong>Note:</strong> You will no longer receive trading signals or have access to our premium content.
    </div>
    
    <p>We'd love to have you back! You can resubscribe at any time to regain access to:</p>
    
    <ul>
      <li>Real-time forex trading signals</li>
      <li>Expert market analysis</li>
      <li>Exclusive trading strategies</li>
      <li>Private community support</li>
    </ul>
    
    <div style="text-align: center;">
      <a href="https://entrylab.io/signals" class="cta-button">Resubscribe Now</a>
    </div>
    
    <p style="margin-top: 30px;">Have feedback or questions? We'd love to hear from you at support@entrylab.io</p>
    
    <div class="footer">
      <p>Thank you for being part of EntryLab</p>
      <p>© 2024 EntryLab. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}
