import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PaymentStatusPage() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId') || '';
  const status = (params.get('status') || 'pending').toLowerCase();

  const isSuccess = status === 'completed' || status === 'success' || status === 'paid';
  const isPending = status === 'pending';
  const Icon = isSuccess ? CheckCircle2 : isPending ? Clock : XCircle;
  const title = isSuccess ? 'Payment successful' : isPending ? 'Payment pending' : 'Payment failed';
  const message = isSuccess
    ? 'Your payment was processed and your order is being confirmed.'
    : isPending
      ? 'Paytm is still processing this payment. Please check again shortly.'
      : 'We could not confirm this payment. Please try again or contact the cafe.';

  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <Card className="w-full max-w-md space-y-5 p-6 text-center">
        <Icon className={`mx-auto size-14 ${isSuccess ? 'text-green-600' : isPending ? 'text-amber-600' : 'text-red-600'}`} />
        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
          {orderId && <p className="text-xs text-muted-foreground">Order ID: {orderId}</p>}
        </div>
        <Button asChild className="w-full">
          <Link to="/">Go to dashboard</Link>
        </Button>
      </Card>
    </div>
  );
}
