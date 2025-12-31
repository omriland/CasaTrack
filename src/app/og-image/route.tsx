import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Purple gradient colors matching the navbar
// oklch(0.4 0.22 280) ≈ #5B2C8F (dark purple)
// oklch(0.5 0.22 280) ≈ #7B4CAF (lighter purple)
const darkPurple = '#5B2C8F'
const lightPurple = '#7B4CAF'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          background: `linear-gradient(135deg, ${darkPurple} 0%, ${lightPurple} 100%)`,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="200"
          height="200"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
