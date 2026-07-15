import { useEffect, useState } from 'react';
import { Banknote, Plus, Settings as SettingsIcon, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth.store';
import {
  usePaymentSettings,
  useSavePaymentSettings,
  useSaveTaxConfig,
  useTaxConfig,
  useUpdateRestaurantInfo,
} from '@/hooks/useRestaurant';
import type { TaxType } from '@/types';

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
          Restaurant profile, payments, taxes, email, and integrations.
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="h-auto w-full max-w-2xl flex-wrap justify-start">
          <TabsTrigger value="profile" className="flex-none px-3 sm:flex-1">Profile</TabsTrigger>
          <TabsTrigger value="payments" className="flex-none px-3 sm:flex-1">Payments</TabsTrigger>
          <TabsTrigger value="tax" className="flex-none px-3 sm:flex-1">Tax</TabsTrigger>
          <TabsTrigger value="email" className="flex-none px-3 sm:flex-1">Email</TabsTrigger>
          <TabsTrigger value="integrations" className="flex-none px-3 sm:flex-1">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSettingsCard user={user} />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentSettingsCard />
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
  const { data, isLoading, isError, refetch } = useTaxConfig();
  const save = useSaveTaxConfig();
  const [taxes, setTaxes] = useState<TaxType[]>([]);
  const [gstin, setGstin] = useState('');

  useEffect(() => {
    if (!data) return;
    setTaxes(data.taxTypes ?? []);
    setGstin(data.gstin ?? '');
  }, [data]);

  const activeTaxTotal = taxes
    .filter((tax) => tax.isActive)
    .reduce((sum, tax) => sum + Number(tax.percentage || 0), 0);
  const canSave = taxes.every((tax) =>
    tax.name.trim().length > 0 &&
    Number.isFinite(Number(tax.percentage)) &&
    Number(tax.percentage) >= 0 &&
    Number(tax.percentage) <= 100,
  ) && activeTaxTotal <= 100;

  const updateTax = (id: string, updates: Partial<TaxType>) => {
    setTaxes((current) => current.map((tax) => tax.id === id ? { ...tax, ...updates } : tax));
  };

  const addTax = () => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `tax-${Date.now()}`;
    setTaxes((current) => [...current, { id, name: '', percentage: 0, isActive: true }]);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Tax Settings</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Configure taxes applied to QR checkout and order totals.</p>
          </div>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={isLoading || isError} onClick={addTax}>
            <Plus className="size-4" /> Add tax
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Loading saved tax settings…
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <p className="text-destructive">Could not load tax settings. No changes can be saved until the current configuration is available.</p>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        ) : taxes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No taxes configured. Checkout totals will not include tax.
          </div>
        ) : (
          <div className="space-y-3">
            {taxes.map((tax) => (
              <div key={tax.id} className="grid items-end gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_140px_auto_auto]">
                <Field
                  label="Tax name"
                  value={tax.name}
                  placeholder="GST, Service tax..."
                  maxLength={80}
                  onChange={(event) => updateTax(tax.id, { name: event.target.value })}
                />
                <Field
                  label="Rate (%)"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={tax.percentage}
                  onChange={(event) => updateTax(tax.id, { percentage: Number(event.target.value) })}
                />
                <label className="flex h-10 items-center gap-2 whitespace-nowrap text-sm">
                  <input
                    type="checkbox"
                    checked={tax.isActive}
                    onChange={(event) => updateTax(tax.id, { isActive: event.target.checked })}
                    className="size-4 accent-primary"
                  />
                  Active
                </label>
                <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${tax.name || 'tax'}`} onClick={() => setTaxes((current) => current.filter((item) => item.id !== tax.id))}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="GSTIN (optional)" value={gstin} placeholder="29ABCDE1234F1Z5" onChange={(event) => setGstin(event.target.value.toUpperCase())} />
          <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Total active tax rate</span>
            <p className="mt-0.5 font-mono text-lg font-bold">{activeTaxTotal.toFixed(2)}%</p>
          </div>
        </div>

        {activeTaxTotal > 100 && <p className="text-sm text-destructive">Total active tax rate cannot exceed 100%.</p>}

        <div className="flex justify-end">
          <Button
            disabled={!canSave || isLoading || isError}
            loading={save.isPending}
            onClick={() =>
              save.mutate({
                taxTypes: taxes.map((tax) => ({ ...tax, name: tax.name.trim(), percentage: Number(Number(tax.percentage).toFixed(2)) })),
                totalTaxTypes: taxes.length,
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

function PaymentSettingsCard() {
  const { data, isLoading, isError, refetch } = usePaymentSettings();
  const save = useSavePaymentSettings();
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (data) setEnabled(data.payAtCounterEnabled);
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Banknote className="size-5 text-primary" /> Payment Methods</CardTitle>
        <p className="text-sm text-muted-foreground">Choose which payment methods customers can use while ordering from a table QR code.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <p className="text-destructive">Could not load payment settings. The saved Pay at Counter value has not been changed.</p>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        )}
        <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
          <span>
            <span className="block text-sm font-semibold">Pay at Counter</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">Allow customers to place an order now and pay staff at the counter.</span>
          </span>
          <input type="checkbox" checked={enabled} disabled={isLoading || isError} onChange={(event) => setEnabled(event.target.checked)} className="size-5 shrink-0 accent-primary" />
        </label>
        {!enabled && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">Customers will need an active online payment method to complete QR checkout.</p>}
        <div className="flex justify-end">
          <Button loading={save.isPending} disabled={isLoading || isError || !data} onClick={() => save.mutate({ payAtCounterEnabled: enabled })}>Save payment settings</Button>
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
