'use client'

import { useRenovationMobile } from '@/components/renovation/use-renovation-mobile'
import { FilesDesktop } from '@/components/renovation/views/FilesDesktop'
import { FilesMobile } from '@/components/renovation/views/FilesMobile'

export default function RenovationFilesPage() {
  const isMobile = useRenovationMobile()
  return isMobile ? <FilesMobile /> : <FilesDesktop />
}
