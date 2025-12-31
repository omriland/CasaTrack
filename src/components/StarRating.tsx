'use client'

import { useState } from 'react'

interface StarRatingProps {
  rating: number | null | undefined // 0-5 or null
  onRatingChange?: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  className?: string
}

export default function StarRating({
  rating = null,
  onRatingChange,
  size = 'md',
  interactive = false,
  className = '',
}: StarRatingProps) {
  const currentRating = rating ?? 0
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const handleClick = (value: number) => {
    if (interactive && onRatingChange) {
      // Toggle: if clicking the same rating, set to 0
      onRatingChange(value === currentRating ? 0 : value)
    }
  }

  const handleMouseEnter = (value: number) => {
    if (interactive) {
      setHoverRating(value)
    }
  }

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(null)
    }
  }

  // Use hover rating for preview, fallback to current rating
  const displayRating = hoverRating ?? currentRating

  return (
    <div 
      className={`flex items-center gap-0.5 ${className}`}
      onMouseLeave={handleMouseLeave}
      dir="ltr"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= displayRating
        const isHovered = hoverRating !== null && star <= hoverRating
        
        return (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            disabled={!interactive}
            className={`${sizeClasses[size]} ${
              interactive ? 'cursor-pointer transition-all duration-150' : 'cursor-default'
            } ${isHovered ? 'scale-110' : ''} ${!interactive ? 'pointer-events-none' : ''}`}
            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          >
            <svg
              className={`${sizeClasses[size]} transition-colors duration-150 ${
                isFilled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-300'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        )
      })}
    </div>
  )
}
