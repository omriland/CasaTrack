import type { VendorBudgetRowModel } from '@/lib/renovation-vendor-budget'

export type DraftRow = { localKey: string; vendorInput: string; insertAfter: string | null }

export type TableRow =
  | { kind: 'draft'; draft: DraftRow }
  | { kind: 'data'; model: VendorBudgetRowModel }
