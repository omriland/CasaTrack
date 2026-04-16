'use client'

import { useRenovationMobile } from '@/components/renovation/use-renovation-mobile'
import { FilesDesktop } from '@/components/renovation/views/FilesDesktop'
import { FilesDropboxDesktop } from '@/components/renovation/views/FilesDropboxDesktop'
import { FilesDropboxMobile } from '@/components/renovation/views/FilesDropboxMobile'
import { FilesMobile } from '@/components/renovation/views/FilesMobile'

const useDropbox = process.env.NEXT_PUBLIC_RENOVATION_FILES_STORAGE === 'dropbox'

export default function RenovationFilesPage() {
  const isMobile = useRenovationMobile()
  if (useDropbox) {
    return isMobile
      ? <FilesDropboxMobile configured={true} />
      : <FilesDropboxDesktop configured={true} />
  }
  return isMobile ? <FilesMobile /> : <FilesDesktop />
}
