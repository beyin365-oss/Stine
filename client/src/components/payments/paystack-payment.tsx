import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export function PaystackPayment({ amount, onSuccess }: { amount: number; onSuccess: (ref: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handlePaystackPayment = async () => {
    if (!email) {
      alert('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      // Get Paystack public key
      const keyRes = await fetch('/api/paystack/public-key');
      const { publicKey } = await keyRes.json();

      // Initialize payment
      const initRes = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          amount,
          reference: `STN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        })
      });
      const initData = await initRes.json();

      if (!initData.status) throw new Error(initData.message);

      // Load Paystack script
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.onload = () => {
        const PaystackPop = window.PaystackPop;
        PaystackPop.resumeTransaction(initData.data.reference);
      };
      document.body.appendChild(script);
    } catch (error) {
      console.error('Paystack error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className='geometric-clip'>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span>Pay with Paystack (NGN)</span>
          <Badge className='bg-blue-600 hover:bg-blue-700'>Naira</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div>
          <label className='text-sm font-medium mb-2 block'>Email Address</label>
          <Input
            type='email'
            placeholder='your@email.com'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            data-testid='input-paystack-email'
          />
        </div>
        <div>
          <p className='text-sm text-muted-foreground mb-2'>Amount</p>
          <p className='text-2xl font-bold'>₦{amount.toLocaleString()}</p>
        </div>
        <Button
          onClick={handlePaystackPayment}
          disabled={loading || !email}
          className='w-full'
          data-testid='button-paystack-pay'
        >
          {loading ? (
            <>
              <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              Processing...
            </>
          ) : (
            `Pay ₦${amount.toLocaleString()}`
          )}
        </Button>
        <p className='text-xs text-muted-foreground text-center'>
          Secured by Paystack • Pay with Card, Bank Transfer, or USSD
        </p>
      </CardContent>
    </Card>
  );
}
