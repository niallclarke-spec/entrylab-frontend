import { getStripeSync } from './stripeClient';
import { db } from './db';
import { signalUsers, subscriptions, webhookEvents } from '@shared/schema';
import { eq } from 'drizzle-orm';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string, uuid: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature, uuid);

    // Parse the event to handle custom logic
    const event = JSON.parse(payload.toString());
    
    // Log the webhook event
    await db.insert(webhookEvents).values({
      eventType: event.type,
      stripeEventId: event.id,
      payload: event,
      processed: false,
    });

    // Handle specific events
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event);
          break;
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event);
          break;
      }

      // Mark as processed
      await db.update(webhookEvents)
        .set({ processed: true })
        .where(eq(webhookEvents.stripeEventId, event.id));

    } catch (error: any) {
      console.error('Error processing webhook:', error);
      
      // Update with error
      await db.update(webhookEvents)
        .set({ 
          processed: false,
          errorMessage: error.message 
        })
        .where(eq(webhookEvents.stripeEventId, event.id));
    }
  }

  private static async handleCheckoutCompleted(event: any) {
    const session = event.data.object;
    const email = session.customer_email || session.customer_details?.email;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    if (!email) return;

    // Find or create user
    let [user] = await db.select()
      .from(signalUsers)
      .where(eq(signalUsers.email, email));

    if (!user) {
      [user] = await db.insert(signalUsers)
        .values({ 
          email,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
        })
        .returning();
    } else {
      [user] = await db.update(signalUsers)
        .set({ 
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
        })
        .where(eq(signalUsers.id, user.id))
        .returning();
    }

    console.log(`Checkout completed for ${email}, subscription: ${subscriptionId}`);
    
    // TODO: Call PromoStack API to grant access
    // await grantChannelAccess(user);
  }

  private static async handleSubscriptionCreated(event: any) {
    const subscription = event.data.object;
    const customerId = subscription.customer;
    const subscriptionId = subscription.id;

    // Find user by customer ID
    const [user] = await db.select()
      .from(signalUsers)
      .where(eq(signalUsers.stripeCustomerId, customerId));

    if (!user) {
      console.error(`User not found for customer ${customerId}`);
      return;
    }

    // Create or update subscription record
    await db.insert(subscriptions)
      .values({
        userId: user.id,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        status: subscription.status,
        planType: 'premium',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      })
      .onConflictDoUpdate({
        target: subscriptions.stripeSubscriptionId,
        set: {
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          updatedAt: new Date(),
        }
      });

    console.log(`Subscription created for user ${user.email}`);
  }

  private static async handleSubscriptionUpdated(event: any) {
    const subscription = event.data.object;
    const subscriptionId = subscription.id;

    await db.update(subscriptions)
      .set({
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

    console.log(`Subscription ${subscriptionId} updated to status: ${subscription.status}`);

    // If canceled or past_due, revoke access
    if (subscription.status === 'canceled' || subscription.status === 'past_due') {
      // TODO: Call PromoStack API to revoke access
      console.log(`Revoking access for subscription ${subscriptionId}`);
    }
  }

  private static async handleSubscriptionDeleted(event: any) {
    const subscription = event.data.object;
    const subscriptionId = subscription.id;

    await db.update(subscriptions)
      .set({
        status: 'canceled',
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

    console.log(`Subscription ${subscriptionId} deleted`);
    
    // TODO: Call PromoStack API to revoke access
  }

  private static async handlePaymentFailed(event: any) {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;

    await db.update(subscriptions)
      .set({
        status: 'past_due',
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

    console.log(`Payment failed for subscription ${subscriptionId}`);
    
    // TODO: Call PromoStack API to revoke access
  }

  private static async handlePaymentSucceeded(event: any) {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;

    // Reactivate if was past_due
    await db.update(subscriptions)
      .set({
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

    console.log(`Payment succeeded for subscription ${subscriptionId}`);
    
    // TODO: Call PromoStack API to grant access
  }
}
