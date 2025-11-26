export function getWelcomeEmailHtml(inviteLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Welcome to EntryLab Signals</title>
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    @media (prefers-color-scheme: dark) {
      .email-body { background-color: #1a1a1a !important; }
      .email-container { background-color: #2d2d2d !important; }
      .text-primary { color: #ffffff !important; }
      .text-secondary { color: #e0e0e0 !important; }
      .text-muted { color: #b0b0b0 !important; }
      .info-box { background-color: #3d3d3d !important; }
      .copy-box-outer { background-color: #3d3d3d !important; border-color: #555555 !important; }
      .copy-box-inner { background-color: #2d2d2d !important; border-color: #444444 !important; }
      .footer-border { border-color: #444444 !important; }
    }
  </style>
</head>
<body class="email-body" style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table class="email-container" role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 600px;">
          <tr>
            <td style="padding: 40px 30px;">
              <!-- Header -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 30px;">
                    <div style="font-size: 28px; font-weight: bold; color: #8b5cf6; margin-bottom: 12px;">EntryLab</div>
                    <h1 class="text-primary" style="color: #1a1a1a; font-size: 32px; margin: 0; font-weight: 600; line-height: 1.3;">Welcome to Premium Signals!</h1>
                  </td>
                </tr>
              </table>
              
              <!-- Content -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td class="text-secondary" style="color: #333333; font-size: 18px; line-height: 1.7;">
                    <p style="margin: 0 0 24px 0; text-align: center;">Your subscription is now active! You have exclusive access to our private Telegram channel where we share:</p>
                  </td>
                </tr>
              </table>
              
              <!-- Benefits List -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="text-align: left;">
                      <tr>
                        <td class="text-secondary" style="padding: 10px 0; color: #333333; font-size: 18px;">&#10003; Real-time forex trading signals</td>
                      </tr>
                      <tr>
                        <td class="text-secondary" style="padding: 10px 0; color: #333333; font-size: 18px;">&#10003; Market analysis and insights</td>
                      </tr>
                      <tr>
                        <td class="text-secondary" style="padding: 10px 0; color: #333333; font-size: 18px;">&#10003; Entry and exit strategies</td>
                      </tr>
                      <tr>
                        <td class="text-secondary" style="padding: 10px 0; color: #333333; font-size: 18px;">&#10003; Risk management guidance</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Info Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0;">
                <tr>
                  <td class="info-box" style="background-color: #f3f0ff; border-left: 4px solid #8b5cf6; padding: 18px; border-radius: 4px;">
                    <p class="text-secondary" style="margin: 0; color: #333333; font-size: 17px; line-height: 1.6;"><strong>Important:</strong> Click the button below to join our private Telegram channel. This link is unique to your subscription.</p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${inviteLink}" target="_blank" rel="noopener" style="display: inline-block; background-color: #8b5cf6; color: #ffffff !important; text-decoration: none; padding: 18px 48px; border-radius: 8px; font-weight: 600; font-size: 18px;">Join Private Channel</a>
                  </td>
                </tr>
              </table>
              
              <!-- Fallback Link Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 480px;">
                      <tr>
                        <td class="copy-box-outer" style="background-color: #f9fafb; border: 2px dashed #d1d5db; border-radius: 10px; padding: 24px; text-align: center;">
                          <p class="text-muted" style="margin: 0 0 14px 0; color: #666666; font-size: 15px; font-weight: 500;">If the button doesn't work, copy this link:</p>
                          <p class="copy-box-inner" style="margin: 0; padding: 14px 18px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; font-family: monospace; font-size: 15px; color: #8b5cf6; word-break: break-all; line-height: 1.5;">${inviteLink}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Footer -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 40px;">
                <tr>
                  <td class="footer-border" style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" class="text-muted" style="color: #666666; font-size: 15px; line-height: 1.7;">
                          <p style="margin: 0 0 10px 0;">Questions? Reply to this email or contact support@entrylab.io</p>
                          <p style="margin: 0 0 18px 0;">&copy; 2024 EntryLab. All rights reserved.</p>
                          <p style="margin: 0; font-size: 14px; color: #888888;">EntryLab Trading Intelligence | Dublin, Ireland</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Subscription Cancelled</title>
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    @media (prefers-color-scheme: dark) {
      .email-body { background-color: #1a1a1a !important; }
      .email-container { background-color: #2d2d2d !important; }
      .text-primary { color: #ffffff !important; }
      .text-secondary { color: #e0e0e0 !important; }
      .text-muted { color: #b0b0b0 !important; }
      .warning-box { background-color: #4a3f2a !important; }
      .footer-border { border-color: #444444 !important; }
    }
  </style>
</head>
<body class="email-body" style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table class="email-container" role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 600px;">
          <tr>
            <td style="padding: 40px 30px;">
              <!-- Header -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 30px;">
                    <div style="font-size: 28px; font-weight: bold; color: #8b5cf6; margin-bottom: 12px;">EntryLab</div>
                    <h1 class="text-primary" style="color: #1a1a1a; font-size: 32px; margin: 0; font-weight: 600; line-height: 1.3;">We're Sorry to See You Go</h1>
                  </td>
                </tr>
              </table>
              
              <!-- Content -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td class="text-secondary" style="color: #333333; font-size: 18px; line-height: 1.7; text-align: center;">
                    <p style="margin: 0 0 24px 0;">Your EntryLab Signals subscription has been cancelled, and your access to the private Telegram channel has been revoked.</p>
                  </td>
                </tr>
              </table>
              
              <!-- Warning Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0;">
                <tr>
                  <td class="warning-box" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 18px; border-radius: 4px;">
                    <p class="text-secondary" style="margin: 0; color: #333333; font-size: 17px; line-height: 1.6;"><strong>Note:</strong> You will no longer receive trading signals or have access to our premium content.</p>
                  </td>
                </tr>
              </table>
              
              <!-- Resubscribe Message -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td class="text-secondary" style="color: #333333; font-size: 18px; line-height: 1.7; text-align: center;">
                    <p style="margin: 0 0 24px 0;">We'd love to have you back! You can resubscribe at any time to regain access to:</p>
                  </td>
                </tr>
              </table>
              
              <!-- Benefits List -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="text-align: left;">
                      <tr>
                        <td class="text-secondary" style="padding: 10px 0; color: #333333; font-size: 18px;">&#10003; Real-time forex trading signals</td>
                      </tr>
                      <tr>
                        <td class="text-secondary" style="padding: 10px 0; color: #333333; font-size: 18px;">&#10003; Expert market analysis</td>
                      </tr>
                      <tr>
                        <td class="text-secondary" style="padding: 10px 0; color: #333333; font-size: 18px;">&#10003; Exclusive trading strategies</td>
                      </tr>
                      <tr>
                        <td class="text-secondary" style="padding: 10px 0; color: #333333; font-size: 18px;">&#10003; Private community support</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="https://entrylab.io/signals" target="_blank" rel="noopener" style="display: inline-block; background-color: #8b5cf6; color: #ffffff !important; text-decoration: none; padding: 18px 48px; border-radius: 8px; font-weight: 600; font-size: 18px;">Resubscribe Now</a>
                  </td>
                </tr>
              </table>
              
              <!-- Feedback -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" class="text-muted" style="color: #666666; font-size: 16px;">
                    <p style="margin: 0;">Have feedback? We'd love to hear from you at support@entrylab.io</p>
                  </td>
                </tr>
              </table>
              
              <!-- Footer -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 40px;">
                <tr>
                  <td class="footer-border" style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" class="text-muted" style="color: #666666; font-size: 15px; line-height: 1.7;">
                          <p style="margin: 0 0 10px 0;">Thank you for being part of EntryLab</p>
                          <p style="margin: 0 0 18px 0;">&copy; 2024 EntryLab. All rights reserved.</p>
                          <p style="margin: 0; font-size: 14px; color: #888888;">EntryLab Trading Intelligence | Dublin, Ireland</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
