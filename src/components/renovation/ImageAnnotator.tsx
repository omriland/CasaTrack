'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Stage, Layer, Image as KonvaImage, Line, Rect, Text } from 'react-konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { useConfirm } from '@/providers/ConfirmProvider'

export interface AnnotationShape {
  id: string
  type: 'line' | 'rect' | 'text'
  x?: number
  y?: number
  points?: number[]
  width?: number
  height?: number
  text?: string
  color: string
}

interface ImageAnnotatorProps {
  imageUrl: string
  initialAnnotations: AnnotationShape[]
  onSave: (annotations: AnnotationShape[], isUploading: boolean) => Promise<void>
  onCancel: () => void
}

type ToolType = 'pen' | 'rect' | 'text'

export function ImageAnnotator({ imageUrl, initialAnnotations, onSave, onCancel }: ImageAnnotatorProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [shapes, setShapes] = useState<AnnotationShape[]>(initialAnnotations || [])
  const [stageSize, setStageSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [activeTool, setActiveTool] = useState<ToolType>('pen')
  const [activeColor, setActiveColor] = useState('#ef4444') // red default
  const [isDrawing, setIsDrawing] = useState(false)
  const [saving, setSaving] = useState(false)
  const confirmAction = useConfirm()
  
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        })
      }
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    let isMounted = true
    const img = new window.Image()
    img.crossOrigin = 'Anonymous'
    img.src = imageUrl
    img.onload = () => {
      if (isMounted) setImage(img)
    }
    return () => { isMounted = false }
  }, [imageUrl])

  // Calculate scale and offset to fit image in container
  const scale = image 
    ? Math.min(
        (stageSize.width - 40) / image.width,
        (stageSize.height - 120) / image.height 
      )
    : 1

  const offsetX = image ? (stageSize.width - image.width * scale) / 2 : 0
  const offsetY = image ? (stageSize.height - image.height * scale) / 2 : 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getRelativePointerPosition = (stage: any) => {
    const pointerPosition = stage.getPointerPosition()
    if (!pointerPosition) return { x: 0, y: 0 }
    return {
      x: (pointerPosition.x - offsetX) / scale,
      y: (pointerPosition.y - offsetY) / scale,
    }
  }

  const handlePointerDown = (e: KonvaEventObject<PointerEvent>) => {
    // Prevent activating tools if we are clicking on an existing shape (like dragging text)
    if (e.target !== e.target.getStage() && e.target.name() !== 'backgroundImage') {
      return
    }

    if (activeTool === 'text') {
      const pos = getRelativePointerPosition(e.target.getStage())
      const text = window.prompt('Enter text:')
      if (text) {
        setShapes([...shapes, {
          id: Date.now().toString(),
          type: 'text',
          x: pos.x,
          y: pos.y,
          text,
          color: activeColor
        }])
      }
      return
    }

    setIsDrawing(true)
    const pos = getRelativePointerPosition(e.target.getStage())
    const id = Date.now().toString()

    if (activeTool === 'pen') {
      setShapes([...shapes, { id, type: 'line', points: [pos.x, pos.y], color: activeColor }])
    } else if (activeTool === 'rect') {
      setShapes([...shapes, { id, type: 'rect', x: pos.x, y: pos.y, width: 0, height: 0, color: activeColor }])
    }
  }

  const handlePointerMove = (e: KonvaEventObject<PointerEvent>) => {
    if (!isDrawing) return

    const pos = getRelativePointerPosition(e.target.getStage())
    
    setShapes(prev => {
      const last = prev[prev.length - 1]
      if (!last) return prev

      const next = [...prev]
      if (last.type === 'line' && last.points) {
        next[next.length - 1] = { ...last, points: last.points.concat([pos.x, pos.y]) }
      } else if (last.type === 'rect') {
        next[next.length - 1] = { 
          ...last, 
          width: pos.x - (last.x || 0), 
          height: pos.y - (last.y || 0) 
        }
      }
      return next
    })
  }

  const handlePointerUp = () => {
    setIsDrawing(false)
  }

  const handleUndo = () => {
    setShapes(shapes.slice(0, -1))
  }

  const handleClear = async () => {
    if (await confirmAction('Clear all annotations?')) {
      setShapes([])
    }
  }

  const handleSaveClick = async () => {
    setSaving(true)
    try {
      await onSave(shapes, true)
    } finally {
      setSaving(false)
    }
  }

  const colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#ffffff', '#000000']

  return (
    <div className="fixed inset-0 z-[20000] bg-black/95 flex flex-col items-center animate-fade-in pointer-events-auto">
      {/* Top Toolbar */}
      <div className="w-full h-16 bg-black border-b border-white/10 flex items-center justify-between px-4 sm:px-6 z-10 shrink-0">
        <div className="flex items-center gap-2">
          {/* Tool Selector */}
          <div className="flex items-center bg-white/10 rounded-lg p-1">
            <button 
              onClick={() => setActiveTool('pen')}
              className={`w-9 h-9 rounded-md flex items-center justify-center transition-all ${activeTool === 'pen' ? 'bg-indigo-500 text-white shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
              title="Draw (Pen)"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button 
              onClick={() => setActiveTool('rect')}
              className={`w-9 h-9 rounded-md flex items-center justify-center transition-all ${activeTool === 'rect' ? 'bg-indigo-500 text-white shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
              title="Rectangle"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="4" y="4" width="16" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button 
              onClick={() => setActiveTool('text')}
              className={`w-9 h-9 rounded-md flex items-center justify-center transition-all ${activeTool === 'text' ? 'bg-indigo-500 text-white shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
              title="Add Text"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7V4h16v3M9 20h6M12 4v16" />
              </svg>
            </button>
          </div>

          <div className="w-px h-6 bg-white/20 mx-2" />

          {/* Color Picker */}
          <div className="hidden sm:flex items-center gap-2 overflow-x-visible min-w-[280px]">
            {colors.map(color => (
              <button
                key={color}
                onClick={() => setActiveColor(color)}
                className={`w-9 h-9 shrink-0 rounded-full shadow-sm border-2 transition-all ${activeColor === color ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-110'}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={handleUndo} disabled={shapes.length === 0} className="w-9 h-9 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30" title="Undo Last">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
          </button>
          <button onClick={handleClear} disabled={shapes.length === 0} className="w-9 h-9 flex items-center justify-center rounded-lg text-white/60 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-30" title="Clear All">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
          
          <div className="w-px h-6 bg-white/20 mx-1 sm:mx-2" />
          
          <button onClick={onCancel} className="px-3 py-1.5 sm:px-4 sm:py-2 text-[14px] font-bold text-white/60 hover:text-white transition-colors">
            Cancel
          </button>
          <button disabled={saving} onClick={handleSaveClick} className="px-5 py-1.5 sm:px-6 sm:py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-[14px] font-bold shadow-lg transition-colors active:scale-95 flex items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save'}
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 w-full relative" ref={containerRef}>
        {!image && (
          <div className="absolute inset-0 flex items-center justify-center text-white/50">
            <div className="w-8 h-8 border-4 border-white/20 border-t-white/80 rounded-full animate-spin" />
          </div>
        )}
        {image && (
          <Stage
            width={stageSize.width}
            height={stageSize.height}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="cursor-crosshair touching-none"
          >
            <Layer x={offsetX} y={offsetY} scaleX={scale} scaleY={scale}>
              <KonvaImage image={image} name="backgroundImage" />
              {shapes.map((shape) => {
                if (shape.type === 'line' && shape.points) {
                  return (
                    <Line
                      key={shape.id}
                      points={shape.points}
                      stroke={shape.color}
                      strokeWidth={6 / scale}
                      tension={0.5}
                      lineCap="round"
                      lineJoin="round"
                    />
                  )
                }
                if (shape.type === 'rect') {
                  return (
                    <Rect
                      key={shape.id}
                      x={shape.x}
                      y={shape.y}
                      width={shape.width}
                      height={shape.height}
                      stroke={shape.color}
                      strokeWidth={4 / scale}
                    />
                  )
                }
                if (shape.type === 'text') {
                  return (
                    <Text
                      key={shape.id}
                      x={shape.x}
                      y={shape.y}
                      text={shape.text}
                      fill={shape.color}
                      fontSize={Math.max(20, 36 / scale)}
                      fontFamily="system-ui, -apple-system, sans-serif"
                      fontStyle="bold"
                      shadowColor="black"
                      shadowBlur={2}
                      shadowOffsetX={1}
                      shadowOffsetY={1}
                      padding={4}
                      draggable
                      onDragEnd={(e) => {
                        setShapes(shapes.map(s => 
                          s.id === shape.id 
                            ? { ...s, x: e.target.x(), y: e.target.y() } 
                            : s
                        ))
                      }}
                      onMouseEnter={(e) => {
                        const stage = e.target.getStage()
                        if (stage) stage.container().style.cursor = 'move'
                      }}
                      onMouseLeave={(e) => {
                        const stage = e.target.getStage()
                        if (stage) stage.container().style.cursor = 'crosshair'
                      }}
                    />
                  )
                }
                return null
              })}
            </Layer>
          </Stage>
        )}
      </div>

      {/* Mobile color picker */}
      <div className="sm:hidden absolute bottom-6 left-1/2 -translate-x-1/2 w-[340px] bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-full flex justify-between shadow-2xl pointer-events-auto z-10">
        {colors.map(color => (
          <button
            key={color}
            onClick={() => setActiveColor(color)}
            className={`w-10 h-10 shrink-0 rounded-full shadow-sm border-2 transition-all ${activeColor === color ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  )
}
