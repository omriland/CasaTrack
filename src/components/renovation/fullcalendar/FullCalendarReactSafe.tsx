/**
 * Drop-in replacement for `@fullcalendar/react` that never uses `flushSync` for
 * custom-rendering updates on React 18+. React 19 forbids flushSync during many
 * lifecycle paths; upstream sets `isUpdating` false before Preact async callbacks
 * run, so flushSync still fires and warns/crashes.
 *
 * Based on @fullcalendar/react 6.1.x — only the scheduling branch changed.
 */
import { Calendar } from '@fullcalendar/core'
import type { CalendarOptions } from '@fullcalendar/core'
import { CustomRenderingStore } from '@fullcalendar/core/internal'
import React, { Component, type RefObject, createRef, PureComponent } from 'react'
import { createPortal, flushSync } from 'react-dom'

const reactMajorVersion = parseInt(String(React.version).split('.')[0], 10)
const syncRenderingByDefault = reactMajorVersion < 18
/** On React 18+, avoid flushSync entirely for the Preact→React bridge (React 19 strict). */
const avoidFlushSyncForCustomRender = reactMajorVersion >= 18

type CustomRendering = {
  id: string
  containerEl: HTMLElement
  generatorMeta: ((props: unknown) => React.ReactNode) | React.ReactNode
  renderProps: unknown
}

type FullCalendarState = { customRenderingMap: Map<string, CustomRendering> }

export default class FullCalendarReactSafe extends Component<CalendarOptions, FullCalendarState> {
  static act = runNow

  private elRef: RefObject<HTMLDivElement | null> = createRef()
  private calendar!: Calendar
  private handleCustomRendering!: (this: unknown, ...args: unknown[]) => void
  private resizeId?: number
  private isUpdating = false
  private isUnmounting = false

  constructor(props: CalendarOptions) {
    super(props)
    this.state = { customRenderingMap: new Map() }
  }

  private requestResize = () => {
    if (!this.isUnmounting) {
      this.cancelResize()
      this.resizeId = requestAnimationFrame(() => {
        this.doResize()
      })
    }
  }

  override render() {
    const customRenderingNodes: React.ReactNode[] = []
    for (const customRendering of this.state.customRenderingMap.values()) {
      customRenderingNodes.push(
        <CustomRenderingComponent key={customRendering.id} customRendering={customRendering} />
      )
    }
    return <div ref={this.elRef}>{customRenderingNodes}</div>
  }

  override componentDidMount() {
    this.isUnmounting = false
    const customRenderingStore = new CustomRenderingStore()
    this.handleCustomRendering = customRenderingStore.handle.bind(
      customRenderingStore
    ) as typeof this.handleCustomRendering
    this.calendar = new Calendar(
      this.elRef.current!,
      Object.assign({}, this.props, {
        handleCustomRendering: this.handleCustomRendering,
      }) as CalendarOptions
    )
    this.calendar.render()

    this.calendar.on('_beforeprint', () => {
      if (avoidFlushSyncForCustomRender) {
        runNow(() => {})
        return
      }
      flushSync(() => {})
    })

    let lastRequestTimestamp: number | undefined
    customRenderingStore.subscribe((customRenderingMap: Map<string, CustomRendering>) => {
      const requestTimestamp = Date.now()
      const isMounting = lastRequestTimestamp === undefined
      const runFunc =
        syncRenderingByDefault ||
        avoidFlushSyncForCustomRender ||
        isMounting ||
        this.isUpdating ||
        this.isUnmounting ||
        requestTimestamp - (lastRequestTimestamp ?? 0) < 100
          ? runNow
          : flushSync
      runFunc(() => {
        this.setState({ customRenderingMap }, () => {
          lastRequestTimestamp = requestTimestamp
          if (isMounting) {
            this.doResize()
          } else {
            this.requestResize()
          }
        })
      })
    })
  }

  override componentDidUpdate() {
    this.isUpdating = true
    this.calendar.resetOptions(
      Object.assign({}, this.props, {
        handleCustomRendering: this.handleCustomRendering,
      }) as CalendarOptions
    )
    this.isUpdating = false
  }

  override componentWillUnmount() {
    this.isUnmounting = true
    this.cancelResize()
    this.calendar.destroy()
  }

  private doResize() {
    this.calendar.updateSize()
  }

  private cancelResize() {
    if (this.resizeId !== undefined) {
      cancelAnimationFrame(this.resizeId)
      this.resizeId = undefined
    }
  }

  getApi() {
    return this.calendar
  }
}

class CustomRenderingComponent extends PureComponent<{ customRendering: CustomRendering }> {
  override render() {
    const { customRendering } = this.props
    const { generatorMeta } = customRendering
    const vnode =
      typeof generatorMeta === 'function'
        ? generatorMeta(customRendering.renderProps)
        : generatorMeta
    return createPortal(vnode as React.ReactNode, customRendering.containerEl)
  }
}

function runNow(f: () => void) {
  f()
}
