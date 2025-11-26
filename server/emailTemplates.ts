export function getWelcomeEmailHtml(inviteLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to EntryLab Signals</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 600px;">
          <tr>
            <td style="padding: 40px;">
              <!-- Header -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 30px;">
                    <div style="font-size: 24px; font-weight: bold; color: #8b5cf6; margin-bottom: 10px;">EntryLab</div>
                    <h1 style="color: #1a1a1a; font-size: 28px; margin: 0; font-weight: 600;">Welcome to Premium Signals!</h1>
                  </td>
                </tr>
              </table>
              
              <!-- Content -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="color: #333333; font-size: 16px; line-height: 1.6;">
                    <p style="margin: 0 0 20px 0; text-align: center;">Your subscription is now active! You have exclusive access to our private Telegram channel where we share:</p>
                  </td>
                </tr>
              </table>
              
              <!-- Benefits List -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="text-align: left;">
                      <tr>
                        <td style="padding: 8px 0; color: #333333; font-size: 16px;">&#10003; Real-time forex trading signals</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #333333; font-size: 16px;">&#10003; Market analysis and insights</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #333333; font-size: 16px;">&#10003; Entry and exit strategies</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #333333; font-size: 16px;">&#10003; Risk management guidance</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Info Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 25px 0;">
                <tr>
                  <td style="background-color: #f9fafb; border-left: 4px solid #8b5cf6; padding: 16px; border-radius: 4px;">
                    <p style="margin: 0; color: #333333; font-size: 15px;"><strong>Important:</strong> Click the button below to join our private Telegram channel. This link is unique to your subscription.</p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${inviteLink}" style="height:50px;v-text-anchor:middle;width:220px;" arcsize="12%" stroke="f" fillcolor="#8b5cf6">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">Join Private Channel</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${inviteLink}" target="_blank" rel="noopener" style="display: inline-block; background-color: #8b5cf6; color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: 600; font-size: 16px; mso-hide: all;">Join Private Channel</a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
              
              <!-- Fallback Link Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 450px;">
                      <tr>
                        <td style="background-color: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 8px; padding: 20px; text-align: center;">
                          <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 13px; font-weight: 500;">If the button doesn't work, copy this link:</p>
                          <p style="margin: 0; padding: 12px 16px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; font-family: monospace; font-size: 14px; color: #8b5cf6; word-break: break-all;">${inviteLink}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Footer -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                <tr>
                  <td align="center" style="color: #6b7280; font-size: 14px;">
                    <p style="margin: 0 0 8px 0;">Questions? Reply to this email or contact support@entrylab.io</p>
                    <p style="margin: 0 0 16px 0;">&copy; 2024 EntryLab. All rights reserved.</p>
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">EntryLab Trading Intelligence | Dublin, Ireland</p>
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
  <title>Subscription Cancelled</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 600px;">
          <tr>
            <td style="padding: 40px;">
              <!-- Header -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 30px;">
                    <div style="font-size: 24px; font-weight: bold; color: #8b5cf6; margin-bottom: 10px;">EntryLab</div>
                    <h1 style="color: #1a1a1a; font-size: 28px; margin: 0; font-weight: 600;">We're Sorry to See You Go</h1>
                  </td>
                </tr>
              </table>
              
              <!-- Content -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="color: #333333; font-size: 16px; line-height: 1.6; text-align: center;">
                    <p style="margin: 0 0 20px 0;">Your EntryLab Signals subscription has been cancelled, and your access to the private Telegram channel has been revoked.</p>
                  </td>
                </tr>
              </table>
              
              <!-- Warning Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 25px 0;">
                <tr>
                  <td style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px;">
                    <p style="margin: 0; color: #333333; font-size: 15px;"><strong>Note:</strong> You will no longer receive trading signals or have access to our premium content.</p>
                  </td>
                </tr>
              </table>
              
              <!-- Resubscribe Message -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="color: #333333; font-size: 16px; line-height: 1.6; text-align: center;">
                    <p style="margin: 0 0 20px 0;">We'd love to have you back! You can resubscribe at any time to regain access to:</p>
                  </td>
                </tr>
              </table>
              
              <!-- Benefits List -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="text-align: left;">
                      <tr>
                        <td style="padding: 8px 0; color: #333333; font-size: 16px;">&#10003; Real-time forex trading signals</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #333333; font-size: 16px;">&#10003; Expert market analysis</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #333333; font-size: 16px;">&#10003; Exclusive trading strategies</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #333333; font-size: 16px;">&#10003; Private community support</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://entrylab.io/signals" style="height:50px;v-text-anchor:middle;width:220px;" arcsize="12%" stroke="f" fillcolor="#8b5cf6">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">Resubscribe Now</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="https://entrylab.io/signals" target="_blank" rel="noopener" style="display: inline-block; background-color: #8b5cf6; color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: 600; font-size: 16px; mso-hide: all;">Resubscribe Now</a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
              
              <!-- Feedback -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="color: #666666; font-size: 14px;">
                    <p style="margin: 0;">Have feedback? We'd love to hear from you at support@entrylab.io</p>
                  </td>
                </tr>
              </table>
              
              <!-- Footer -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                <tr>
                  <td align="center" style="color: #6b7280; font-size: 14px;">
                    <p style="margin: 0 0 8px 0;">Thank you for being part of EntryLab</p>
                    <p style="margin: 0 0 16px 0;">&copy; 2024 EntryLab. All rights reserved.</p>
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">EntryLab Trading Intelligence | Dublin, Ireland</p>
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
