import type { Metadata } from 'next'
import { getProjectById } from '@/lib/renovation'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string }>
}): Promise<Metadata> {
  const { projectId } = await params

  let projectName = 'Renovation'
  try {
    const project = await getProjectById(projectId)
    if (project?.name) projectName = project.name
  } catch {
    // fall back to default name on any fetch error
  }

  const title = `${projectName} - Gant`
  const description = 'View-only renovation roadmap'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default function PublicRoadmapLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
