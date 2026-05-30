import { useEffect, useState } from 'react';
import { Bike, Clipboard, PlugZap } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore, selectTenantId } from '@/store/auth.store';
import { useIntegrationConfig, useSaveIntegrationConfig } from '@/hooks/useRestaurant';
import type { IntegrationProvider } from '@/types';

export default function IntegrationConfigPage() {
  const [provider, setProvider] = useState<IntegrationProvider>('zomato');

  return (
    <div className="container py-6 lg:py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 font-serif text-3xl font-bold tracking-tight">
          <PlugZap className="size-6 text-primary" />
          Delivery Integrations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure Zomato and Swiggy order sync.</p>
      </div>

      <Tabs value={provider} onValueChange={(value) => setProvider(value as IntegrationProvider)}>
        <TabsList>
          <TabsTrigger value="zomato">Zomato</TabsTrigger>
          <TabsTrigger value="swiggy">Swiggy</TabsTrigger>
        </TabsList>
        <TabsContent value="zomato">
          <IntegrationForm provider="zomato" />
        </TabsContent>
        <TabsContent value="swiggy">
          <IntegrationForm provider="swiggy" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function IntegrationForm({ provider }: { provider: IntegrationProvider }) {
  const tenantId = useAuthStore(selectTenantId);
  const { data } = useIntegrationConfig(provider);
  const save = useSaveIntegrationConfig();
  const [apiKey, setApiKey] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [soapieUrl, setSoapieUrl] = useState('');
  const [active, setActive] = useState(false);

  const generatedWebhook = tenantId ? `${window.location.origin}/api/webhooks/${provider}/${tenantId}` : '';

  useEffect(() => {
    setApiKey(data?.api_key ?? '');
    setWebhookUrl(data?.webhook_url ?? generatedWebhook);
    setSoapieUrl(data?.soapie_url ?? '');
    setActive(Boolean(data?.is_active));
  }, [data, generatedWebhook]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg capitalize">
          <Bike className="size-5 text-primary" />
          {provider} setup
        </CardTitle>
      </CardHeader>
      <CardContent className="max-w-2xl space-y-4">
        <Alert>
          <AlertDescription>Use the webhook URL in your {provider} partner dashboard.</AlertDescription>
        </Alert>
        <div className="space-y-1.5">
          <Label>API key</Label>
          <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Webhook URL</Label>
          <div className="flex gap-2">
            <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} />
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText(webhookUrl);
                toast.success('Webhook copied');
              }}
            >
              <Clipboard className="size-4" />
            </Button>
          </div>
        </div>
        {provider === 'swiggy' && (
          <div className="space-y-1.5">
            <Label>SOAPIE URL</Label>
            <Input value={soapieUrl} onChange={(e) => setSoapieUrl(e.target.value)} />
          </div>
        )}
        <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
          <span>Active</span>
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-4 accent-primary" />
        </label>
        <Button
          loading={save.isPending}
          onClick={() =>
            save.mutate({
              provider,
              data: {
                api_key: apiKey,
                webhook_url: webhookUrl,
                soapie_url: soapieUrl,
                is_active: active,
              },
            })
          }
        >
          Save integration
        </Button>
      </CardContent>
    </Card>
  );
}
