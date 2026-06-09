import { useEffect, useState } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth.store';
import { useSaveTaxConfig, useTaxConfig } from '@/hooks/useRestaurant';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="container py-6 lg:py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 font-serif text-3xl font-bold tracking-tight">
          <SettingsIcon className="size-6 text-primary" />
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Restaurant profile, taxes, email, and integrations.
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="tax">Tax</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Restaurant Profile</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="Restaurant name" defaultValue={user?.tenant?.name} />
              <Field label="Slug" defaultValue={user?.tenant?.slug} disabled />
              <Field label="Phone" placeholder="+91 98765 43210" />
              <Field label="Email" type="email" defaultValue={user?.email} />
              <div className="md:col-span-2">
                <Label>Address</Label>
                <Input className="mt-1.5" placeholder="Street, city, postcode" />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button>Save changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <TaxSettingsCard />
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Email Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {['New order received', 'Daily summary', 'Low stock alerts', 'Customer feedback'].map((label) => (
                <label key={label} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                  <span className="text-sm font-medium">{label}</span>
                  <input type="checkbox" defaultChecked className="size-4 accent-primary" />
                </label>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="grid gap-3 md:grid-cols-2">
            <IntegrationCard
              name="Razorpay"
              description="Accept UPI, cards & wallets."
              connected
            />
            <IntegrationCard name="Paytm" description="Indian payments gateway." />
            <IntegrationCard name="Google Pay" description="Generate QR for instant pay." connected />
            <IntegrationCard name="Zomato" description="Sync orders from Zomato." />
            <IntegrationCard name="Swiggy" description="Sync orders from Swiggy." />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TaxSettingsCard() {
  const { data } = useTaxConfig();
  const save = useSaveTaxConfig();
  const gst = data?.taxTypes?.find((tax) => tax.id === 'gst') ?? data?.taxTypes?.[0];
  const [rate, setRate] = useState('0');
  const [gstin, setGstin] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!data) return;
    setRate(String(gst?.percentage ?? 0));
    setGstin(data.gstin ?? '');
    setActive(gst?.isActive ?? true);
  }, [data, gst?.isActive, gst?.percentage]);

  const numericRate = Number(rate);
  const canSave = Number.isFinite(numericRate) && numericRate >= 0 && numericRate <= 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tax Configuration</CardTitle>
        <p className="text-sm text-muted-foreground">GST settings applied to customer checkout and order totals.</p>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <Field
          label="GST rate (%)"
          type="number"
          min={0}
          max={100}
          step="0.01"
          value={rate}
          onChange={(event) => setRate(event.target.value)}
        />
        <Field
          label="GSTIN"
          value={gstin}
          placeholder="29ABCDE1234F1Z5"
          onChange={(event) => setGstin(event.target.value.toUpperCase())}
        />
        <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
          <span>Apply GST at checkout</span>
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
            className="size-4 accent-primary"
          />
        </label>
        <div className="flex items-center justify-end">
          <Button
            disabled={!canSave}
            loading={save.isPending}
            onClick={() =>
              save.mutate({
                taxTypes: [
                  {
                    id: 'gst',
                    name: 'GST',
                    percentage: Number(numericRate.toFixed(2)),
                    isActive: active,
                  },
                ],
                totalTaxTypes: 1,
                gstin: gstin.trim(),
              })
            }
          >
            Save tax settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <Label>{label}</Label>
      <Input className="mt-1.5" {...props} />
    </div>
  );
}

function IntegrationCard({
  name,
  description,
  connected,
}: {
  name: string;
  description: string;
  connected?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="grid size-12 place-items-center rounded-xl bg-primary/10 font-serif text-lg font-bold text-primary">
          {name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{name}</p>
            {connected && <Badge variant="success">Connected</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Button variant={connected ? 'outline' : 'default'} size="sm">
          {connected ? 'Manage' : 'Connect'}
        </Button>
      </CardContent>
    </Card>
  );
}
