import React from 'react'
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import { C, FONT } from './theme'

/* ------------------------------------------------------------------ *
 * Reusable, frame-driven visual building blocks for the INDIEGEN promo.
 * ------------------------------------------------------------------ */

/** Animated INDIEGEN orange wave field — the brand background. */
export const WavesBg: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const lines = 9
  return (
    <AbsoluteFill style={{ opacity }}>
      <svg width={width} height={height} style={{ position: 'absolute' }}>
        {Array.from({ length: lines }).map((_, i) => {
          const yBase = (height / (lines - 1)) * i
          const pts: string[] = []
          for (let x = 0; x <= width; x += 24) {
            const y =
              yBase +
              Math.sin(x * 0.004 + frame * 0.04 + i * 0.6) * 28 +
              Math.sin(x * 0.011 - frame * 0.02 + i) * 14
            pts.push(`${x},${y.toFixed(1)}`)
          }
          return (
            <polyline
              key={i}
              points={pts.join(' ')}
              fill="none"
              stroke={C.accent}
              strokeWidth={1.5}
              opacity={0.12 + 0.05 * Math.sin(frame * 0.03 + i)}
            />
          )
        })}
      </svg>
    </AbsoluteFill>
  )
}

/** Slowly drifting blueprint grid. */
export const GridBg: React.FC<{ opacity?: number }> = ({ opacity = 0.5 }) => {
  const frame = useCurrentFrame()
  const shift = (frame * 0.4) % 80
  return (
    <AbsoluteFill
      style={{
        opacity,
        backgroundImage: `linear-gradient(${C.accent}22 1px, transparent 1px), linear-gradient(90deg, ${C.accent}22 1px, transparent 1px)`,
        backgroundSize: '80px 80px',
        backgroundPosition: `${shift}px ${shift}px`,
        maskImage: 'radial-gradient(ellipse 75% 70% at 50% 45%, #000 30%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse 75% 70% at 50% 45%, #000 30%, transparent 80%)',
      }}
    />
  )
}

/** Soft radial vignette + warm corners so it never reads pure black. */
export const Ambiance: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${C.accent}14, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(120,100,200,0.10), transparent 60%)`,
    }}
  />
)

/** The glossy asterisk logo, floating with a breathing halo. */
export const Logo: React.FC<{ size?: number; delay?: number }> = ({ size = 220, delay = 0 }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const enter = spring({ frame: frame - delay, fps, config: { damping: 12, mass: 0.8 } })
  const float = Math.sin((frame - delay) * 0.05) * 12
  const haloPulse = 0.5 + 0.25 * Math.sin((frame - delay) * 0.06)
  return (
    <div
      style={{
        transform: `scale(${enter}) translateY(${float}px)`,
        position: 'relative',
        width: size,
        height: size,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: -size * 0.25,
          background: `radial-gradient(circle, ${C.accent}, transparent 65%)`,
          filter: 'blur(40px)',
          opacity: haloPulse,
        }}
      />
      <Img
        src={staticFile('logo.png')}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.55))',
          position: 'relative',
        }}
      />
    </div>
  )
}

/** Word that springs up, optionally with the orange gradient. */
export const Reveal: React.FC<{
  children: React.ReactNode
  delay?: number
  y?: number
  style?: React.CSSProperties
}> = ({ children, delay = 0, y = 40, style }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = spring({ frame: frame - delay, fps, config: { damping: 16, mass: 0.7 } })
  return (
    <div
      style={{
        opacity: s,
        transform: `translateY(${interpolate(s, [0, 1], [y, 0])}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export const gradientText: React.CSSProperties = {
  background: `linear-gradient(100deg, ${C.accent2}, ${C.accent}, ${C.orange})`,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
}

export const base: React.CSSProperties = {
  fontFamily: FONT,
  color: C.text,
  letterSpacing: '-0.02em',
}

/* ---------------- animated asset previews (brand-on-message) ------------- */

export const SlimeAsset: React.FC<{ size?: number }> = ({ size = 120 }) => {
  const frame = useCurrentFrame()
  const t = frame * 0.12
  const squashY = 1 + Math.sin(t) * 0.12
  const squashX = 1 - Math.sin(t) * 0.12
  const lift = Math.max(0, Math.sin(t)) * 22
  const blink = Math.sin(frame * 0.08) > 0.96 ? 0.1 : 1
  return (
    <div style={{ width: size, height: size, position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div
        style={{
          position: 'absolute',
          bottom: 6,
          width: size * 0.55,
          height: 10,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.45)',
          filter: 'blur(3px)',
          transform: `scaleX(${0.7 + 0.3 * (1 - lift / 22)})`,
        }}
      />
      <div
        style={{
          width: size * 0.7,
          height: size * 0.58,
          transform: `translateY(${-lift}px) scale(${squashX}, ${squashY})`,
          borderRadius: '50% 50% 45% 45%',
          background: `radial-gradient(circle at 38% 28%, ${C.accent2}, ${C.accent} 62%, #c46a00)`,
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          gap: size * 0.1,
          paddingTop: size * 0.16,
        }}
      >
        {[0, 1].map((i) => (
          <div key={i} style={{ width: size * 0.09, height: size * 0.09 * blink, borderRadius: '50%', background: '#1a1404' }} />
        ))}
      </div>
    </div>
  )
}

export const CubeAsset: React.FC<{ size?: number }> = ({ size = 120 }) => {
  const frame = useCurrentFrame()
  const rotY = frame * 2.2
  const h = size / 2
  const faces = [
    `translateZ(${h}px)`,
    `rotateY(180deg) translateZ(${h}px)`,
    `rotateY(90deg) translateZ(${h}px)`,
    `rotateY(-90deg) translateZ(${h}px)`,
    `rotateX(90deg) translateZ(${h}px)`,
    `rotateX(-90deg) translateZ(${h}px)`,
  ]
  return (
    <div style={{ width: size, height: size, perspective: size * 5, display: 'grid', placeItems: 'center' }}>
      <div style={{ width: size, height: size, position: 'relative', transformStyle: 'preserve-3d', transform: `rotateX(-22deg) rotateY(${rotY}deg)` }}>
        {faces.map((f, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              border: `2px solid ${C.accent}`,
              background: `${C.accent}14`,
              boxShadow: `inset 0 0 24px ${C.accent}33`,
              transform: f,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export const TileAsset: React.FC<{ size?: number }> = ({ size = 120 }) => {
  const frame = useCurrentFrame()
  return (
    <div style={{ width: size, height: size, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: size * 0.04 }}>
      {Array.from({ length: 16 }).map((_, i) => {
        const wave = Math.sin(frame * 0.12 - ((i % 4) + Math.floor(i / 4)) * 0.5)
        return (
          <div
            key={i}
            style={{
              borderRadius: 4,
              border: `1px solid ${C.accent}66`,
              background: `linear-gradient(135deg, ${C.accent}55, ${C.accent}22)`,
              opacity: 0.55 + 0.45 * (wave * 0.5 + 0.5),
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          />
        )
      })}
    </div>
  )
}

export const ParallaxAsset: React.FC<{ size?: number }> = ({ size = 150 }) => {
  const frame = useCurrentFrame()
  const hill = (fill: string, speed: number, h: number, op: number) => {
    const off = (frame * speed) % 160
    return (
      <svg width={size} height={h} style={{ position: 'absolute', bottom: 0, left: 0, opacity: op }} viewBox={`0 0 ${size} ${h}`}>
        <path
          d={`M${-off} ${h} L${-off} ${h * 0.5} Q${size * 0.25 - off} ${h * 0.1} ${size * 0.5 - off} ${h * 0.5} T${size - off} ${h * 0.5} L${size * 1.5} ${h} Z`}
          fill={fill}
        />
        <path
          d={`M${160 - off} ${h} L${160 - off} ${h * 0.5} Q${size * 0.25 + 160 - off} ${h * 0.1} ${size * 0.5 + 160 - off} ${h * 0.5} T${size + 160 - off} ${h * 0.5} L${size * 1.5 + 160} ${h} Z`}
          fill={fill}
        />
      </svg>
    )
  }
  return (
    <div style={{ width: size, height: size * 0.66, position: 'relative', overflow: 'hidden', borderRadius: 10, background: 'linear-gradient(180deg,#1c1408,#0d0a06)', border: `1px solid ${C.border}` }}>
      <div style={{ position: 'absolute', top: size * 0.12, left: size * 0.18, width: size * 0.1, height: size * 0.1, borderRadius: '50%', background: C.accent2, boxShadow: `0 0 18px ${C.accent}` }} />
      {hill('#7a4a08', 0.8, size * 0.45, 0.4)}
      {hill(C.accent, 1.5, size * 0.32, 0.7)}
      {hill(C.accent2, 2.6, size * 0.2, 1)}
    </div>
  )
}
