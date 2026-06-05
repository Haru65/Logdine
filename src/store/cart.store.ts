import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, MenuAddon, MenuItem, MenuVariant, OrderType } from '@/types';
import { uid } from '@/lib/utils';

interface CartState {
  type: OrderType;
  tableId: string | null;
  notes: string;
  items: CartItem[];

  /** Compute totals lazily — call from selectors. */
  setType: (t: OrderType) => void;
  setTable: (id: string | null) => void;
  setNotes: (n: string) => void;

  addItem: (item: MenuItem, opts?: { variants?: MenuVariant[]; addons?: MenuAddon[]; notes?: string; quantity?: number }) => void;
  updateQuantity: (uid: string, qty: number) => void;
  removeItem: (uid: string) => void;
  clear: () => void;
}

/**
 * Helper – derive the effective unit price by summing the base price with
 * variant deltas. Addons are billed separately so multi-addon line items
 * remain auditable in the bill.
 */
function unitPrice(item: MenuItem, variants: MenuVariant[]): number {
  return variants[0]?.price ?? item.price;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      type: 'dine_in',
      tableId: null,
      notes: '',
      items: [],

      setType: (type) => set({ type }),
      setTable: (tableId) => set({ tableId }),
      setNotes: (notes) => set({ notes }),

      addItem: (item, opts = {}) => {
        const { variants = [], addons = [], notes, quantity = 1 } = opts;
        // Merge with an existing line item only if variants/addons match.
        const signature = JSON.stringify({
          id: item.id,
          v: variants.map((v) => v.id).sort(),
          a: addons.map((a) => a.id).sort(),
          n: notes ?? '',
        });

        const existing = get().items.find(
          (ci) =>
            JSON.stringify({
              id: ci.menu_item_id,
              v: ci.variants.map((v) => v.id).sort(),
              a: ci.addons.map((a) => a.id).sort(),
              n: ci.notes ?? '',
            }) === signature,
        );

        if (existing) {
          set({
            items: get().items.map((ci) =>
              ci.uid === existing.uid ? { ...ci, quantity: ci.quantity + quantity } : ci,
            ),
          });
          return;
        }

        set({
          items: [
            ...get().items,
            {
              uid: uid('ci'),
              menu_item_id: item.id,
              name: item.name,
              price: unitPrice(item, variants),
              quantity,
              variants,
              addons,
              notes,
              image_url: item.image_url,
            },
          ],
        });
      },

      updateQuantity: (lineUid, qty) => {
        if (qty <= 0) {
          set({ items: get().items.filter((ci) => ci.uid !== lineUid) });
          return;
        }
        set({
          items: get().items.map((ci) => (ci.uid === lineUid ? { ...ci, quantity: qty } : ci)),
        });
      },

      removeItem: (lineUid) => set({ items: get().items.filter((ci) => ci.uid !== lineUid) }),
      clear: () => set({ items: [], notes: '', tableId: null }),
    }),
    {
      name: 'restrohub.cart',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// ----------------- Selectors --------------------------------------------
export const selectSubtotal = (s: CartState) =>
  s.items.reduce((sum, ci) => {
    const addonTotal = ci.addons.reduce((a, x) => a + x.price, 0);
    return sum + (ci.price + addonTotal) * ci.quantity;
  }, 0);

export const selectItemCount = (s: CartState) =>
  s.items.reduce((sum, ci) => sum + ci.quantity, 0);
