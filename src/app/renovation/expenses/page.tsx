'use client'

import { useRenovationMobile } from '@/components/renovation/use-renovation-mobile'
import { ExpensesDesktop } from '@/components/renovation/views/ExpensesDesktop'
import { ExpensesMobile } from '@/components/renovation/views/ExpensesMobile'

export default function ExpensesPage() {
  const isMobile = useRenovationMobile()
  return isMobile ? <ExpensesMobile /> : <ExpensesDesktop />
}
