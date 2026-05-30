import { useEffect, useState } from 'react';
import { CreditCard, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { usePaymentConfig, useSavePaymentConfig } from '@/hooks/useRestaurant';
import type { PaymentProvider } from '@/types';

export default function PaymentConfigPage() {
  const [provider, setProvider] = useState<PaymentProvider>('razorpay');

  return (
    <div className="container py-6 lg:py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 font-serif text-3xl font-bold tracking-tight">
          <CreditCard className="size-6 text-primary" />
          Payment Gateway
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage Razorpay and Paytm credentials.</p>
      </div>

      <Tabs value={provider} onValueChange={(value) => setProvider(value as PaymentProvider)}>
        <TabsList>
          <TabsTrigger value="razorpay">Razorpay</TabsTrigger>
          <TabsTrigger value="paytm">Paytm</TabsTrigger>
        </TabsList>
        <TabsContent value="razorpay">
          <PaymentForm provider="razorpay" />
        </TabsContent>
        <TabsContent value="paytm">
          <PaymentForm provider="paytm" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PaymentForm({ provider }: { provider: PaymentProvider }) {
  const { data } = usePaymentConfig(provider);
  const save = useSavePaymentConfig();
  const [keyId, setKeyId] = useState('');
  const [keySecret, setKeySecret] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [website, setWebsite] = useState('WEBSTAGING');
  const [active, setActive] = useState(true);

  useEffect(() => {
    setKeyId(data?.key_id ?? '');
    setKeySecret('');
    setWebhookSecret(data?.webhook_secret ?? '');
    setWebsite(data?.website ?? 'WEBSTAGING');
    setActive(data?.is_active === undefined ? true : Boolean(data.is_active));
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg capitalize">{provider} configuration</CardTitle>
      </CardHeader>
      <CardContent className="max-w-2xl space-y-4">
        <Alert>
          <ShieldCheck className="hidden" />
          <AlertTitle>Secrets are masked after saving</AlertTitle>
          <AlertDescription>Enter the secret again when rotating credentials.</AlertDescription>
        </Alert>
        <Field label={provider === 'paytm' ? 'Merchant ID' : 'Key ID'} value={keyId} onChange={setKeyId} />
        <Field label={provider === 'paytm' ? 'Merchant Key' : 'Key Secret'} value={keySecret} onChange={setKeySecret} type="password" placeholder={data?.key_secret || 'Enter secret'} />
        <Field label="Webhook secret" value={webhookSecret} onChange={setWebhookSecret} type="password" />
        {provider === 'paytm' && <Field label="Website" value={website} onChange={setWebsite} />}
        <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
          <span>Active</span>
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-4 accent-primary" />
        </label>
        <Button
          loading={save.isPending}
          disabled={!keyId || (!keySecret && !data?.id)}
          onClick={() =>
            save.mutate({
              provider,
              key_id: keyId,
              key_secret: keySecret,
              webhook_secret: webhookSecret,
              website,
              is_active: active,
            })
          }
        >
          Save {provider}
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
