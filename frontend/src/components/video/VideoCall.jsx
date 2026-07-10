import { useEffect, useRef } from 'react'

export default function VideoCall({ roomUrl, onLeave }) {
  const containerRef = useRef(null)
  const callFrameRef = useRef(null)

  useEffect(() => {
    if (!roomUrl || !containerRef.current) return

    let cancelled = false

    async function initCall() {
      try {
        const DailyIframe = (await import('@daily-co/daily-js')).default
        if (cancelled) return

        if (callFrameRef.current) {
          callFrameRef.current.destroy()
        }

        const frame = DailyIframe.createFrame(containerRef.current, {
          showLeaveButton: true,
          iframeStyle: {
            width: '100%',
            height: '100%',
            borderRadius: '8px',
          },
        })

        callFrameRef.current = frame

        frame.on('left-meeting', () => {
          onLeave?.()
        })

        frame.join({ url: roomUrl })
      } catch (e) {
        console.error('Erro ao iniciar Daily.co:', e)
      }
    }

    initCall()

    return () => {
      cancelled = true
      if (callFrameRef.current) {
        callFrameRef.current.destroy()
        callFrameRef.current = null
      }
    }
  }, [roomUrl])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: 'calc(100vh - 140px)',
        minHeight: 400,
        borderRadius: 8,
        overflow: 'hidden',
      }}
    />
  )
}
