'use client'

import { useRenovationMobile } from '@/components/renovation/use-renovation-mobile'
import { TasksDesktop } from '@/components/renovation/views/TasksDesktop'
import { TasksMobile } from '@/components/renovation/views/TasksMobile'

export default function TasksPage() {
  const isMobile = useRenovationMobile()
  return isMobile ? <TasksMobile /> : <TasksDesktop />
}
