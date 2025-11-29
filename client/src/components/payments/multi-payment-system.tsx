import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  CreditCard, 
  Wallet, 
  DollarSign, 
  Heart, 
  Crown,
  Sparkles,
  Check,
  Shield,
  Zap,
  Gift,
  TrendingUp,
  Users,
  Star
} from "lucide-react";
import { SiStripe, SiPaypal, SiApple, SiGooglepay } from "react-icons/si";

interface MultiPaymentSystemProps {
  recipientId: string;
  recipientName: string;
  type: 'tip' | 'subscription' | 'purchase' | 'donation';
  amount?: number;
  productId?: string;
  onSuccess?: (transactionId: string) => void;
  onCancel?: () => void;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: any;
  available: boolean;
  processingFee: string;
  description: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'stripe',
    name: 'Card Payment',
    icon: SiStripe,
    available: true,
    processingFee: '2.9% + $0.30',
    description: 'Credit/Debit cards via Stripe'
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: SiPaypal,
    available: true,
    processingFee: '2.9% + $0.30',
    description: 'PayPal balance or linked cards'
  },
  {
    id: 'apple_pay',
    name: 'Apple Pay',
    icon: SiApple,
    available: true,
    processingFee: '2.9% + $0.30',
    description: 'Quick payment with Apple Pay'
  },
  {
    id: 'google_pay',
    name: 'Google Pay',
    icon: SiGooglepay,
    available: true,
    processingFee: '2.9% + $0.30',
    description: 'Quick payment with Google Pay'
  },
];

const tipAmounts = [5, 10, 25, 50, 100, 250];

const subscriptionTiers = [
  {
    id: 'basic',
    name: 'Basic Fan',
    price: 4.99,
    period: 'month',
    features: ['Ad-free listening', 'Chat badge', 'Exclusive emotes'],
    color: 'from-blue-500 to-blue-600',
    icon: Heart,
  },
  {
    id: 'supporter',
    name: 'Supporter',
    price: 9.99,
    period: 'month',
    features: ['All Basic features', 'Priority song requests', 'Early access to sets', 'Direct messages'],
    color: 'from-purple-500 to-purple-600',
    icon: Star,
    popular: true,
  },
  {
    id: 'vip',
    name: 'VIP Member',
    price: 24.99,
    period: 'month',
    features: ['All Supporter features', 'Behind-the-scenes content', 'Meet & greet access', 'Exclusive merch discounts', 'Custom shoutouts'],
    color: 'from-yellow-500 to-orange-500',
    icon: Crown,
  },
];

export function MultiPaymentSystem({
  recipientId,
  recipientName,
  type,
  amount: initialAmount,
  productId,
  onSuccess,
  onCancel
}: MultiPaymentSystemProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('stripe');
  const [customAmount, setCustomAmount] = useState(initialAmount?.toString() || '');
  const [selectedTipAmount, setSelectedTipAmount] = useState<number | null>(null);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getFinalAmount = () => {
    if (type === 'tip') {
      return selectedTipAmount || parseFloat(customAmount) || 0;
    }
    if (type === 'subscription' && selectedTier) {
      const tier = subscriptionTiers.find(t => t.id === selectedTier);
      return tier?.price || 0;
    }
    return parseFloat(customAmount) || 0;
  };

  const getPlatformFee = (amount: number) => {
    const feePercentage = 0.15; // 15% platform fee
    return amount * feePercentage;
  };

  const getRecipientAmount = (amount: number) => {
    return amount - getPlatformFee(amount);
  };

  const createPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await apiRequest('POST', '/api/payments/create', paymentData);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast({
          title: "Payment Successful! 🎉",
          description: `Thank you for your ${type}!`,
        });
        onSuccess?.(data.transactionId);
        queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      }
    },
    onError: () => {
      toast({
        title: "Payment Failed",
        description: "Unable to process payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePayment = async () => {
    const amount = getFinalAmount();
    
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    createPaymentMutation.mutate({
      recipientId,
      amount,
      type,
      paymentMethod: selectedPaymentMethod,
      message: message || undefined,
      tierId: selectedTier,
      productId,
    });
  };

  const PaymentMethodSelector = () => (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Payment Method</Label>
      <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
        <div className="grid grid-cols-2 gap-3">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <div
                key={method.id}
                className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                  selectedPaymentMethod === method.id
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-primary/50'
                } ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => method.available && setSelectedPaymentMethod(method.id)}
              >
                <RadioGroupItem
                  value={method.id}
                  id={method.id}
                  className="sr-only"
                  disabled={!method.available}
                />
                <div className="flex items-center space-x-3">
                  <Icon className="w-6 h-6" />
                  <div>
                    <p className="font-medium text-sm">{method.name}</p>
                    <p className="text-xs text-muted-foreground">{method.processingFee}</p>
                  </div>
                </div>
                {selectedPaymentMethod === method.id && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </RadioGroup>
    </div>
  );

  const TipForm = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Heart className="w-12 h-12 mx-auto mb-3 text-pink-500" />
        <h3 className="text-lg font-semibold">Send a Tip to {recipientName}</h3>
        <p className="text-sm text-muted-foreground">Show your appreciation for the music!</p>
      </div>

      <div>
        <Label className="text-sm font-medium mb-3 block">Quick Amounts</Label>
        <div className="grid grid-cols-3 gap-2">
          {tipAmounts.map((amount) => (
            <Button
              key={amount}
              variant={selectedTipAmount === amount ? "default" : "outline"}
              onClick={() => {
                setSelectedTipAmount(amount);
                setCustomAmount('');
              }}
              className="h-12"
              data-testid={`button-tip-${amount}`}
            >
              ${amount}
            </Button>
          ))}
        </div>
      </div>

      <div className="relative">
        <Label className="text-sm font-medium mb-2 block">Or enter custom amount</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="number"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setSelectedTipAmount(null);
            }}
            placeholder="Enter amount"
            className="pl-8"
            data-testid="input-custom-tip"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium mb-2 block">Add a message (optional)</Label>
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Great set! Keep it up!"
          maxLength={200}
          data-testid="input-tip-message"
        />
      </div>

      <PaymentMethodSelector />

      <div className="border-t pt-4">
        <div className="flex justify-between text-sm mb-2">
          <span>Tip Amount</span>
          <span>${getFinalAmount().toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm mb-2 text-muted-foreground">
          <span>Platform Fee (15%)</span>
          <span>${getPlatformFee(getFinalAmount()).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm font-medium text-green-600">
          <span>{recipientName} receives</span>
          <span>${getRecipientAmount(getFinalAmount()).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );

  const SubscriptionForm = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Crown className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
        <h3 className="text-lg font-semibold">Subscribe to {recipientName}</h3>
        <p className="text-sm text-muted-foreground">Get exclusive perks and support your favorite DJ</p>
      </div>

      <div className="space-y-4">
        {subscriptionTiers.map((tier) => {
          const Icon = tier.icon;
          return (
            <div
              key={tier.id}
              className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                selectedTier === tier.id
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-primary/50'
              }`}
              onClick={() => setSelectedTier(tier.id)}
              data-testid={`tier-${tier.id}`}
            >
              {tier.popular && (
                <Badge className="absolute -top-2 left-4 bg-gradient-to-r from-purple-500 to-pink-500">
                  Most Popular
                </Badge>
              )}
              
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${tier.color}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{tier.name}</h4>
                    <p className="text-lg font-bold">
                      ${tier.price}
                      <span className="text-sm text-muted-foreground font-normal">/{tier.period}</span>
                    </p>
                  </div>
                </div>
                
                {selectedTier === tier.id && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </div>
              
              <ul className="mt-4 space-y-2">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-sm">
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <PaymentMethodSelector />
    </div>
  );

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Wallet className="w-5 h-5 mr-2" />
            {type === 'tip' ? 'Send Tip' : type === 'subscription' ? 'Subscribe' : 'Make Payment'}
          </CardTitle>
          <div className="flex items-center space-x-1">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Secure</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {type === 'tip' && <TipForm />}
        {type === 'subscription' && <SubscriptionForm />}
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-3">
        <Button
          onClick={handlePayment}
          disabled={createPaymentMutation.isPending || isProcessing || getFinalAmount() <= 0}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          data-testid="button-submit-payment"
        >
          {createPaymentMutation.isPending || isProcessing ? (
            <>Processing...</>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay ${getFinalAmount().toFixed(2)}
            </>
          )}
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          Payments are processed securely. By proceeding, you agree to our Terms of Service.
        </p>
        
        <div className="flex items-center justify-center space-x-4 pt-2">
          <SiStripe className="w-8 h-4 text-muted-foreground" />
          <SiPaypal className="w-12 h-4 text-muted-foreground" />
          <Shield className="w-4 h-4 text-muted-foreground" />
        </div>
      </CardFooter>
    </Card>
  );
}

export function QuickTipButton({ recipientId, recipientName }: { recipientId: string; recipientName: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-pink-500/10 border-pink-500/50 hover:bg-pink-500/20" data-testid="button-quick-tip">
          <Heart className="w-4 h-4 mr-2 text-pink-500" />
          Send Tip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Send a Tip</DialogTitle>
          <DialogDescription className="sr-only">
            Choose an amount and payment method to send a tip
          </DialogDescription>
        </DialogHeader>
        <MultiPaymentSystem
          recipientId={recipientId}
          recipientName={recipientName}
          type="tip"
          onSuccess={() => setIsOpen(false)}
          onCancel={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function SubscribeButton({ recipientId, recipientName }: { recipientId: string; recipientName: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" data-testid="button-subscribe">
          <Crown className="w-4 h-4 mr-2" />
          Subscribe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Subscribe to {recipientName}</DialogTitle>
          <DialogDescription className="sr-only">
            Choose a subscription tier to support this DJ
          </DialogDescription>
        </DialogHeader>
        <MultiPaymentSystem
          recipientId={recipientId}
          recipientName={recipientName}
          type="subscription"
          onSuccess={() => setIsOpen(false)}
          onCancel={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
