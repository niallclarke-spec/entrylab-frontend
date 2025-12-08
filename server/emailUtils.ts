import { getUncachableResendClient } from './resendClient';

export interface EmailData {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  error?: string;
}

export async function sendEmailWithRetry(
  emailData: EmailData,
  maxRetries: number = 3
): Promise<EmailResult> {
  const { client } = await getUncachableResendClient();
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await client.emails.send(emailData);
      
      if (result.error) {
        const err = result.error as any;
        if (err.name === 'rate_limit_exceeded' || err.statusCode === 429) {
          const backoffMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          console.log(`Rate limited sending to ${emailData.to}. Waiting ${backoffMs}ms before retry ${attempt + 1}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
        return { success: false, error: err.message || JSON.stringify(result.error) };
      }
      
      return { success: true };
    } catch (error: any) {
      if (attempt === maxRetries - 1) {
        return { success: false, error: error.message };
      }
      const backoffMs = Math.pow(2, attempt) * 1000;
      console.log(`Email send error, retrying in ${backoffMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
  
  return { success: false, error: 'Max retries exceeded' };
}
