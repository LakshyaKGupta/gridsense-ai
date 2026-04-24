import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Video plays once, pauses on last frame for 4s, then fades and replays
export default function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null)
  const [visible, setVisible] = useState(true)
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    const vid = ref.current
    if (!vid) return
    vid.muted = true
    vid.playsInline = true
    vid.loop = false
    vid.play().catch(() => {})

    const onEnd = () => {
      // Hold on last frame for 4s, then fade out and restart
      setTimeout(() => {
        setOpacity(0)
        setTimeout(() => {
          vid.currentTime = 0
          vid.play()
          setOpacity(1)
        }, 900)
      }, 4000)
    }

    vid.addEventListener('ended', onEnd)
    return () => vid.removeEventListener('ended', onEnd)
  }, [])

  return (
    <video
      ref={ref}
      id="hero-video"
      src="/hero.mp4"
      muted
      playsInline
      className="hero-video"
      style={{ opacity, transition: 'opacity 0.9s ease' }}
    />
  )
}
