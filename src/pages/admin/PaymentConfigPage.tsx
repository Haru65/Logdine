import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CreditCard, Landmark, WalletCards } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePaymentConfig, useSavePaymentConfig } from '@/hooks/useRestaurant';
import { cn } from '@/lib/utils';
import type { PaymentConfig, PaymentProvider } from '@/types';

const PROVIDERS: Array<{ id: PaymentProvider; label: string }> = [
  { id: 'paytm', label: 'Paytm' },
  { id: 'razorpay', label: 'Razorpay' },
];

function asBool(value: boolean | number | undefined): boolean {
  return value === true || value === 1;
}

function accountName(account: PaymentConfig): string {
  return account.account_label || account.accountLabel || 'Primary account';
}

export default function PaymentConfigPage() {
  const [provider, setProvider] = useState<PaymentProvider>('paytm');

  return (
    <div className="container py-6 lg:py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 font-serif text-3xl font-bold tracking-tight">
          <CreditCard className="size-6 text-primary" />
          Payment Gateway
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose the active payment account configured by Superadmin.
        </p>
      </div>

      <Tabs value={provider} onValueChange={(value) => setProvider(value as PaymentProvider)}>
        <TabsList>
          {PROVIDERS.map((item) => (
            <TabsTrigger key={item.id} value={item.id}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {PROVIDERS.map((item) => (
          <TabsContent key={item.id} value={item.id}>
            <PaymentAccountSelector provider={item.id} label={item.label} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function PaymentAccountSelector({ provider, label }: { provider: PaymentProvider; label: string }) {
  const { data } = usePaymentConfig(provider);
  const save = useSavePaymentConfig();
  const accounts = useMemo(() => data?.accounts ?? (data ? [data] : []), [data]);
  const defaultAccount = accounts.find((account) => asBool(account.is_default)) ?? accounts[0];
  const [selectedId, setSelectedId] = useState(defaultAccount?.id ?? '');

  useEffect(() => {
    setSelectedId(defaultAccount?.id ?? '');
  }, [defaultAccount?.id]);

  const selected = accounts.find((account) => account.id === selectedId);
  const isSelectedDefault = selected ? asBool(selected.is_default) && asBool(selected.is_active) : false;

  return (
    <Card>
      <CardHeader className="gap-1">
        <CardTitle className="flex items-center gap-2 text-lg">
          {provider === 'paytm' ? <WalletCards className="size-5 text-primary" /> : <Landmark className="size-5 text-primary" />}
          {label} account
        </CardTitle>
      </CardHeader>
      <CardContent className="max-w-3xl space-y-4">
        {accounts.length === 0 ? (
          <Alert variant="warning">
            <AlertTitle>No {label} account configured</AlertTitle>
            <AlertDescription>Add {label} credentials from the Superadmin business payment settings.</AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="grid gap-3">
              {accounts.map((account) => {
                const active = asBool(account.is_active);
                const isDefault = asBool(account.is_default);
                const checked = selectedId === account.id;

                return (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => account.id && setSelectedId(account.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                      checked ? 'border-primary bg-primary/10' : 'border-border bg-background hover:bg-accent',
                    )}
                  >
                    <span
                      className={cn(
                        'grid size-5 shrink-0 place-items-center rounded-full border',
                        checked ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40',
                      )}
                    >
                      {checked && <CheckCircle2 className="size-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{accountName(account)}</span>
                        {isDefault && <Badge variant="soft">Selected</Badge>}
                        <Badge variant={active ? 'success' : 'warning'}>{active ? 'Active' : 'Inactive'}</Badge>
                      </span>
                      <span className="mt-1 block truncate text-sm text-muted-foreground">
                        {provider === 'paytm' ? 'MID' : 'Key ID'}: {account.key_id || 'Not set'}
                        {provider === 'paytm' && account.website ? ` · ${account.website}` : ''}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <Button
              loading={save.isPending}
              disabled={!selected || isSelectedDefault}
              onClick={() => {
                if (!selected) return;
                save.mutate({
                  id: selected.id,
                  accountId: selected.id,
                  provider,
                  key_id: selected.key_id,
                  website: selected.website,
                  is_active: true,
                  isActive: true,
                  is_default: true,
                  isDefault: true,
                });
              }}
            >
              Use selected {label} account
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
