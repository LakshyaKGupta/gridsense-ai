import { useEffect, useRef } from 'react'

export default function Cursor() {
  const dotRef  = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const mouse   = useRef({ x: 0, y: 0 })
  const ringPos = useRef({ x: 0, y: 0 })
  const rafRef  = useRef<number>(0)

  useEffect(() => {
    const dot  = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY
      // Dot follows instantly — pure GPU transform, no layout
      dot.style.transform = `translate3d(${e.clientX - 4}px,${e.clientY - 4}px,0)`
    }

    const lerp = () => {
      ringPos.current.x += (mouse.current.x - ringPos.current.x) * 0.1
      ringPos.current.y += (mouse.current.y - ringPos.current.y) * 0.1
      // Ring follows with lag — pure GPU transform
      ringRef.current!.style.transform =
        `translate3d(${ringPos.current.x - 18}px,${ringPos.current.y - 18}px,0)`
      rafRef.current = requestAnimationFrame(lerp)
    }

    const onEnter = () => document.body.classList.add('cursor-hover')
    const onLeave = () => document.body.classList.remove('cursor-hover')

    document.addEventListener('mousemove', onMove, { passive: true })
    rafRef.current = requestAnimationFrame(lerp)

    document.querySelectorAll('a,button,.hw-card,.uc-card,.mc,.trust-logo')
      .forEach(el => {
        el.addEventListener('mouseenter', onEnter)
        el.addEventListener('mouseleave', onLeave)
      })

    return () => {
      document.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <>
      <div id="cursor-dot"  ref={dotRef}  />
      <div id="cursor-ring" ref={ringRef} />
    </>
  )
}
