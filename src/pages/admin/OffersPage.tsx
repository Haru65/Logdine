import { Plus, Tag, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { restaurantService } from '@/services/restaurant.service';
import { useAuthStore, selectTenantId } from '@/store/auth.store';
import { qk } from '@/api/queryClient';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Offer } from '@/types';

const mockOffers: Offer[] = [
  {
    id: '1',
    tenant_id: '',
    code: 'WELCOME20',
    title: '20% off your first order',
    description: 'New customers only',
    type: 'percentage',
    value: 20,
    min_order_value: 300,
    starts_at: '2026-05-01',
    ends_at: '2026-06-30',
    is_active: true,
  },
  {
    id: '2',
    tenant_id: '',
    code: 'HAPPYHR',
    title: 'Happy Hour ₹100 off',
    description: 'Weekdays 3pm – 6pm',
    type: 'flat',
    value: 100,
    min_order_value: 500,
    is_active: true,
  },
];

export default function OffersPage() {
  const tenantId = useAuthStore(selectTenantId);
  const { data, isLoading } = useQuery({
    queryKey: tenantId ? qk.offers(tenantId) : ['offers', 'none'],
    queryFn: () => restaurantService.getOffers(tenantId!),
    enabled: !!tenantId,
  });

  const offers = data?.length ? data : mockOffers;

  return (
    <div className="container py-6 lg:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-3xl font-bold tracking-tight">
            <Tag className="size-6 text-primary" />
            Offers & Promotions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Coupons, discounts, and happy hours.</p>
        </div>
        <Button className="gap-1.5">
          <Plus className="size-4" /> Create offer
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((o) => (
            <OfferCard key={o.id} offer={o} />
          ))}
        </div>
      )}
    </div>
  );
}

function OfferCard({ offer }: { offer: Offer }) {
  const valueLabel =
    offer.type === 'percentage' ? `${offer.value}% OFF` : `${formatCurrency(offer.value)} OFF`;

  return (
    <Card className="group relative overflow-hidden">
      <div className="absolute -right-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-primary/15" />
      <CardContent className="relative space-y-3 p-5">
        <div className="flex items-start justify-between">
          <Badge variant={offer.is_active ? 'success' : 'secondary'}>
            {offer.is_active ? 'Active' : 'Paused'}
          </Badge>
          <Sparkles className="size-4 text-primary/60" />
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {offer.code}
          </p>
          <p className="mt-0.5 font-serif text-2xl font-bold tracking-tight">{valueLabel}</p>
        </div>
        <p className="text-sm font-medium">{offer.title}</p>
        {offer.description && <p className="text-xs text-muted-foreground">{offer.description}</p>}
        <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-3 text-xs">
          {offer.min_order_value !== undefined && (
            <div>
              <p className="text-muted-foreground">Min order</p>
              <p className="font-semibold">{formatCurrency(offer.min_order_value)}</p>
            </div>
          )}
          {offer.ends_at && (
            <div>
              <p className="text-muted-foreground">Valid till</p>
              <p className="font-semibold">{formatDate(offer.ends_at)}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
