/**
 * ShopSuite v3.1 — Business type definitions.
 *
 * Business type adapts some terminology and provides an optional preset
 * catalog (e.g. egg shop gets the legacy 6 egg categories pre-seeded).
 * The system is generic by default — products are always user-defined.
 */

export type BusinessType = {
  id: string;
  label: string;
  description: string;
  // Optional preset products to seed during onboarding if the user opts in.
  presetProducts?: {
    name: string;
    category: string;
    unit: string;
    color: string;
    purchasePrice: number;
    sellingPrice: number;
  }[];
};

export const BUSINESS_TYPES: BusinessType[] = [
  {
    id: 'grocery',
    label: 'Grocery Shop',
    description: 'General groceries, packaged foods, household items',
  },
  {
    id: 'convenience',
    label: 'Convenience Store',
    description: 'Mixed retail with fast-moving items',
  },
  {
    id: 'minimarket',
    label: 'Mini Market',
    description: 'Small supermarket-style shop',
  },
  {
    id: 'snack',
    label: 'Snack Shop',
    description: 'Snacks, drinks, quick bites',
  },
  {
    id: 'hardware',
    label: 'Hardware Shop',
    description: 'Tools, building materials, fittings',
  },
  {
    id: 'clothing',
    label: 'Clothing Shop',
    description: 'Apparel and accessories',
  },
  {
    id: 'electronics',
    label: 'Electronics Shop',
    description: 'Phones, accessories, gadgets',
  },
  {
    id: 'egg',
    label: 'Egg Shop',
    description: 'Egg retail (preset catalog available)',
    presetProducts: [
      { name: 'White Eggs (Large)',  category: 'Eggs', unit: 'pcs', color: '#2563eb', purchasePrice: 0, sellingPrice: 0 },
      { name: 'White Eggs (Medium)', category: 'Eggs', unit: 'pcs', color: '#16a34a', purchasePrice: 0, sellingPrice: 0 },
      { name: 'Red Eggs (Large)',    category: 'Eggs', unit: 'pcs', color: '#dc2626', purchasePrice: 0, sellingPrice: 0 },
      { name: 'Red Eggs (Medium)',   category: 'Eggs', unit: 'pcs', color: '#ea580c', purchasePrice: 0, sellingPrice: 0 },
      { name: 'Happy Hen (Large)',   category: 'Eggs', unit: 'pcs', color: '#9333ea', purchasePrice: 0, sellingPrice: 0 },
      { name: 'Happy Hen (Medium)',  category: 'Eggs', unit: 'pcs', color: '#0891b2', purchasePrice: 0, sellingPrice: 0 },
    ],
  },
  {
    id: 'other',
    label: 'Other Retail',
    description: 'Any other small retail business',
  },
];

export function getBusinessType(id: string): BusinessType | undefined {
  return BUSINESS_TYPES.find((b) => b.id === id);
}
