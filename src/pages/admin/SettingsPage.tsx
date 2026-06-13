import { useEffect, useState } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth.store';
import { useSaveTaxConfig, useTaxConfig, useUpdateRestaurantInfo } from '@/hooks/useRestaurant';

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
          <ProfileSettingsCard user={user} />
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

function ProfileSettingsCard({ user }: { user: ReturnType<typeof useAuthStore.getState>['user'] }) {
  const saveProfile = useUpdateRestaurantInfo();
  const tenant = user?.tenant;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    setName(tenant?.name ?? '');
    setPhone(tenant?.contact_phone ?? '');
    setEmail(tenant?.contact_email ?? user?.email ?? '');
    setAddress(tenant?.address ?? '');
    setLogoUrl(tenant?.logo_url ?? tenant?.logoUrl ?? tenant?.logo ?? '');
  }, [tenant, user?.email]);

  const canSave = name.trim().length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Restaurant Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSave) return;
            saveProfile.mutate({
              name: name.trim(),
              contact_phone: phone.trim(),
              contact_email: email.trim(),
              address: address.trim(),
              logo_url: logoUrl.trim(),
            });
          }}
        >
          <Field label="Restaurant name" value={name} onChange={(event) => setName(event.target.value)} />
          <Field label="Slug" value={tenant?.slug ?? ''} disabled />
          <Field label="Phone" value={phone} placeholder="+91 98765 43210" onChange={(event) => setPhone(event.target.value)} />
          <Field label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <div className="md:col-span-2">
            <Label>Address</Label>
            <Input
              className="mt-1.5"
              value={address}
              placeholder="Street, city, postcode"
              onChange={(event) => setAddress(event.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Logo URL</Label>
            <Input
              className="mt-1.5"
              value={logoUrl}
              placeholder="https://..."
              onChange={(event) => setLogoUrl(event.target.value)}
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" loading={saveProfile.isPending} disabled={!canSave}>
              Save changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
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
