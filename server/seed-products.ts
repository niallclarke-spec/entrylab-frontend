import { getUncachableStripeClient } from './stripeClient';

/**
 * Seed Stripe products and prices
 * Run this script to create:
 * - EntryLab Forex Signals Premium (Monthly: $49, Yearly: $319)
 */
async function seedProducts() {
  const stripe = await getUncachableStripeClient();

  console.log('Creating EntryLab Forex Signals products...');

  // Check if product already exists
  const existingProducts = await stripe.products.search({
    query: "name:'EntryLab Forex Signals Premium'",
  });

  let product;
  if (existingProducts.data.length > 0) {
    product = existingProducts.data[0];
    console.log(`Product already exists: ${product.id}`);
  } else {
    // Create the product
    product = await stripe.products.create({
      name: 'EntryLab Forex Signals Premium',
      description: 'Premium forex trading signals for XAU/USD (Gold) with daily analysis, entry/exit points, and risk management guidance.',
      metadata: {
        category: 'signals',
        telegram_channel: 'private',
      },
    });
    console.log(`Created product: ${product.id}`);
  }

  // Check if prices already exist
  const existingPrices = await stripe.prices.list({
    product: product.id,
  });

  let monthlyPrice, yearlyPrice;

  // Find existing prices
  const existingMonthly = existingPrices.data.find(
    p => p.recurring?.interval === 'month' && p.unit_amount === 4900
  );
  const existingYearly = existingPrices.data.find(
    p => p.recurring?.interval === 'year' && p.unit_amount === 31900
  );

  // Create monthly price if it doesn't exist
  if (existingMonthly) {
    monthlyPrice = existingMonthly;
    console.log(`Monthly price already exists: ${monthlyPrice.id}`);
  } else {
    monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 4900, // $49.00
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        interval: 'monthly',
      },
    });
    console.log(`Created monthly price: ${monthlyPrice.id} - $49/month`);
  }

  // Create yearly price if it doesn't exist
  if (existingYearly) {
    yearlyPrice = existingYearly;
    console.log(`Yearly price already exists: ${yearlyPrice.id}`);
  } else {
    yearlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 31900, // $319.00 (saves $269/year = 46% off)
      currency: 'usd',
      recurring: {
        interval: 'year',
      },
      metadata: {
        interval: 'yearly',
        savings: '269',
        discount_percentage: '46',
      },
    });
    console.log(`Created yearly price: ${yearlyPrice.id} - $319/year (save $269)`);
  }

  console.log('\n✅ Products and prices ready!');
  console.log('\nPrice IDs to use in your app:');
  console.log(`Monthly: ${monthlyPrice.id}`);
  console.log(`Yearly: ${yearlyPrice.id}`);
  console.log('\nAdd these to your environment variables or use them in checkout sessions.');

  process.exit(0);
}

seedProducts().catch((error) => {
  console.error('Error seeding products:', error);
  process.exit(1);
});
