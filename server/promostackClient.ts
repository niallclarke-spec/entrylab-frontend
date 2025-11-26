interface PromostackGrantResponse {
  success: boolean;
  invite_link?: string;
  message?: string;
}

interface PromostackRevokeResponse {
  success: boolean;
  message?: string;
}

export class PromostackClient {
  private apiKey: string;
  private baseUrl: string = 'https://dash.promostack.io/api';

  constructor() {
    const apiKey = process.env.PROMOSTACK_API_KEY;
    if (!apiKey) {
      throw new Error('PROMOSTACK_API_KEY is not set');
    }
    this.apiKey = apiKey;
  }

  async grantAccess(email: string, telegramUserId?: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/grant-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          email,
          telegram_user_id: telegramUserId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`PromoStack grant access failed: ${response.status} ${errorText}`);
        return null;
      }

      const data: PromostackGrantResponse = await response.json();
      
      if (data.success && data.invite_link) {
        console.log(`PromoStack: Access granted for ${email}, invite link: ${data.invite_link}`);
        return data.invite_link;
      }

      console.log(`PromoStack: Grant access response for ${email}:`, data);
      return null;
    } catch (error: any) {
      console.error('PromoStack grant access error:', error.message);
      return null;
    }
  }

  async revokeAccess(email: string, telegramUserId?: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/revoke-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          email,
          telegram_user_id: telegramUserId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`PromoStack revoke access failed: ${response.status} ${errorText}`);
        return false;
      }

      const data: PromostackRevokeResponse = await response.json();
      
      if (data.success) {
        console.log(`PromoStack: Access revoked for ${email}`);
        return true;
      }

      console.log(`PromoStack: Revoke access response for ${email}:`, data);
      return false;
    } catch (error: any) {
      console.error('PromoStack revoke access error:', error.message);
      return false;
    }
  }
}

export const promostackClient = new PromostackClient();
