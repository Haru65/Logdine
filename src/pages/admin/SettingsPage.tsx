import { Settings as SettingsIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth.store';

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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tax Configuration</CardTitle>
              <p className="text-sm text-muted-foreground">GST / VAT settings applied at billing.</p>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="Tax rate (%)" type="number" defaultValue="5" />
              <Field label="GSTIN" placeholder="29ABCDE1234F1Z5" />
              <div className="md:col-span-2 flex justify-end">
                <Button>Save tax settings</Button>
              </div>
            </CardContent>
          </Card>
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
