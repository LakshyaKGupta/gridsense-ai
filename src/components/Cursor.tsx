import { useEffect, useRef } from 'react'

export default function Cursor() {
  const dot  = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const pos  = useRef({ x: 0, y: 0 })
  const rpos = useRef({ x: 0, y: 0 })
  const raf  = useRef<number>(0)

  useEffect(() => {
    const move = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY }
      if (dot.current) {
        dot.current.style.left = `${e.clientX}px`
        dot.current.style.top  = `${e.clientY}px`
      }
    }

    const lerp = () => {
      rpos.current.x += (pos.current.x - rpos.current.x) * 0.12
      rpos.current.y += (pos.current.y - rpos.current.y) * 0.12
      if (ring.current) {
        ring.current.style.left = `${rpos.current.x}px`
        ring.current.style.top  = `${rpos.current.y}px`
      }
      raf.current = requestAnimationFrame(lerp)
    }

    const onEnter = () => document.body.classList.add('cursor-hover')
    const onLeave = () => document.body.classList.remove('cursor-hover')

    document.addEventListener('mousemove', move)
    raf.current = requestAnimationFrame(lerp)

    const interactives = document.querySelectorAll('a,button,.hw-card,.uc-card,.mc,.trust-logo')
    interactives.forEach(el => {
      el.addEventListener('mouseenter', onEnter)
      el.addEventListener('mouseleave', onLeave)
    })

    return () => {
      document.removeEventListener('mousemove', move)
      cancelAnimationFrame(raf.current)
    }
  }, [])

  return (
    <>
      <div id="cursor-dot"  ref={dot}  />
      <div id="cursor-ring" ref={ring} />
    </>
  )
}
