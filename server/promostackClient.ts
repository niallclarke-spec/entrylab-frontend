interface PromostackGrantResponse {
  success: boolean;
  inviteLink?: string;
  message?: string;
}

interface PromostackRevokeResponse {
  success: boolean;
  message?: string;
}

interface GrantAccessParams {
  email: string;
  name?: string;
  planType?: string;
  amountPaid?: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

interface FreeUserParams {
  email: string;
  name?: string;
  source?: string;
}

export class PromostackClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    const apiKey = process.env.PROMOSTACK_API_KEY;
    if (!apiKey) {
      throw new Error('PROMOSTACK_API_KEY is not set');
    }
    this.apiKey = apiKey;
    
    // Production URL for PromoStack
    this.baseUrl = process.env.PROMOSTACK_API_URL || 'https://dash.promostack.io';
  }

  async grantAccess(params: GrantAccessParams): Promise<string | null> {
    const { email, name, planType, amountPaid, stripeCustomerId, stripeSubscriptionId } = params;
    
    try {
      const response = await fetch(`${this.baseUrl}/api/telegram/grant-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify({
          email,
          name: name || '',
          planType: planType || 'Premium Forex Signals',
          amountPaid: amountPaid || 49,
          stripeCustomerId: stripeCustomerId,
          stripeSubscriptionId: stripeSubscriptionId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`PromoStack grant access failed: ${response.status} ${errorText}`);
        return null;
      }

      const data: PromostackGrantResponse = await response.json();
      
      if (data.success && data.inviteLink) {
        console.log(`PromoStack: Access granted for ${email}, invite link: ${data.inviteLink}`);
        return data.inviteLink;
      }

      console.log(`PromoStack: Grant access response for ${email}:`, data);
      return null;
    } catch (error: any) {
      console.error('PromoStack grant access error:', error.message);
      return null;
    }
  }

  async revokeAccess(email: string, reason: string = 'subscription_cancelled'): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/telegram/revoke-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify({
          email,
          reason
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

  async checkAccess(email: string): Promise<{ hasAccess: boolean; status?: string; telegramUserId?: string } | null> {
    try {
      const encodedEmail = encodeURIComponent(email);
      const response = await fetch(`${this.baseUrl}/api/telegram/check-access/${encodedEmail}`, {
        headers: {
          'X-API-Key': this.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`PromoStack check access failed: ${response.status} ${errorText}`);
        return null;
      }

      return await response.json();
    } catch (error: any) {
      console.error('PromoStack check access error:', error.message);
      return null;
    }
  }

  async addFreeUser(params: FreeUserParams): Promise<boolean> {
    const { email, name, source } = params;
    
    try {
      const response = await fetch(`${this.baseUrl}/api/telegram/grant-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify({
          email,
          name: name || '',
          planType: 'Free Gold Signals',
          amountPaid: 0,
          stripeCustomerId: 'free_user',
          stripeSubscriptionId: 'free_signup'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`PromoStack add free user failed: ${response.status} ${errorText}`);
        return false;
      }

      const data: PromostackGrantResponse = await response.json();
      
      if (data.success) {
        console.log(`PromoStack: Free user added - ${email}`);
        return true;
      }

      console.log(`PromoStack: Add free user response for ${email}:`, data);
      return false;
    } catch (error: any) {
      console.error('PromoStack add free user error:', error.message);
      return false;
    }
  }
}

export const promostackClient = new PromostackClient();
