import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    let customer: Stripe.Customer;

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];

      // Check for active subscription
      const subs = await stripe.subscriptions.list({ customer: customer.id, status: "active", limit: 1 });
      if (subs.data.length > 0) {
        return NextResponse.json({ error: "You already have an active subscription" }, { status: 400 });
      }
    } else {
      customer = await stripe.customers.create({ email });
    }

    // Find the premium signals price (or use a hardcoded price ID)
    const prices = await stripe.prices.list({ active: true, limit: 10 });
    const premiumPrice = prices.data.find(p => p.unit_amount && p.unit_amount >= 2900 && p.recurring);

    if (!premiumPrice) {
      return NextResponse.json({ error: "No active subscription plan found" }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ["card"],
      line_items: [{ price: premiumPrice.id, quantity: 1 }],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscribe?cancelled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("[Stripe Checkout]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
