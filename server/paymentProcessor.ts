import { getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';
import { InsertTransaction } from '@shared/schema';

const PLATFORM_FEE_RATE = {
  tip: 0.15,        // 15% for tips
  subscription: 0.20, // 20% for subscriptions
  merchandise: 0.25,  // 25% for marketplace
};

export async function processStripePayment(
  userId: string,
  recipientId: string | null,
  amount: number,
  type: 'tip' | 'subscription' | 'merchandise',
  paymentMethodId: string
) {
  const stripe = await getUncachableStripeClient();
  const platformFeeRate = PLATFORM_FEE_RATE[type] || 0.15;
  const platformFee = parseFloat((amount * platformFeeRate).toFixed(2));
  const netAmount = amount - platformFee;

  try {
    const charge = await stripe.charges.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      source: paymentMethodId,
      description: `STINE ${type} payment`,
      metadata: {
        userId,
        recipientId: recipientId || 'platform',
        type,
      }
    });

    const transaction: InsertTransaction = {
      userId,
      recipientId: recipientId || undefined,
      type,
      amount: amount.toString(),
      platformFee: platformFee.toString(),
      netAmount: netAmount.toString(),
      paymentMethod: 'stripe',
      status: 'completed',
      stripeChargeId: charge.id,
      description: `${type} payment - ${charge.id}`,
      metadata: { chargeId: charge.id }
    };

    await storage.createTransaction(transaction);
    return { success: true, charge, transaction };
  } catch (error: any) {
    console.error('Stripe payment error:', error);
    throw error;
  }
}

export async function processPayPalPayment(
  userId: string,
  recipientId: string | null,
  amount: number,
  type: 'tip' | 'subscription' | 'merchandise',
  paypalOrderId: string
) {
  const platformFeeRate = PLATFORM_FEE_RATE[type] || 0.15;
  const platformFee = parseFloat((amount * platformFeeRate).toFixed(2));
  const netAmount = amount - platformFee;

  try {
    const transaction: InsertTransaction = {
      userId,
      recipientId: recipientId || undefined,
      type,
      amount: amount.toString(),
      platformFee: platformFee.toString(),
      netAmount: netAmount.toString(),
      paymentMethod: 'paypal',
      status: 'completed',
      paypalOrderId,
      description: `${type} payment - ${paypalOrderId}`,
      metadata: { orderId: paypalOrderId }
    };

    await storage.createTransaction(transaction);
    return { success: true, transaction };
  } catch (error: any) {
    console.error('PayPal payment error:', error);
    throw error;
  }
}

export async function getTransactionHistory(userId: string, limit = 50) {
  return storage.getUserTransactions(userId, limit);
}

export async function getPlatformRevenue() {
  return storage.getPlatformRevenue();
}

export async function initiatePayout(userId: string, amount: number, method: string) {
  if (amount < 10) {
    throw new Error('Minimum payout amount is $10');
  }

  return storage.createPayout({
    userId,
    amount: amount.toString(),
    method,
    status: 'pending'
  });
}
