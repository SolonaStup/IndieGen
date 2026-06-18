import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { C } from './theme'
import {
  Ambiance,
  CubeAsset,
  GridBg,
  Logo,
  ParallaxAsset,
  Reveal,
  SlimeAsset,
  TileAsset,
  WavesBg,
  base,
  gradientText,
} from './components'

const fade = (frame: number, dur: number, fIn = 14, fOut = 16) =>
  interpolate(frame, [0, fIn, dur - fOut, dur], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

const Stage: React.FC<{ dur: number; children: React.ReactNode; bg?: number }> = ({ dur, children, bg = 1 }) => {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={{ background: C.bg, opacity: fade(frame, dur) }}>
      <WavesBg opacity={0.9 * bg} />
      <GridBg opacity={0.35 * bg} />
      <Ambiance />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', ...base }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  )
}

/* 1 — INTRO ---------------------------------------------------------------- */
export const Intro: React.FC<{ dur: number }> = ({ dur }) => (
  <Stage dur={dur}>
    <Logo size={240} />
    <Reveal delay={14} style={{ marginTop: 36 }}>
      <div style={{ fontSize: 132, fontWeight: 700, ...gradientText }}>INDIEGEN</div>
    </Reveal>
    <Reveal delay={26}>
      <div style={{ fontSize: 40, color: C.sub, fontWeight: 500, marginTop: 6 }}>
        AI Game Asset Studio
      </div>
    </Reveal>
    <Reveal delay={36}>
      <div
        style={{
          marginTop: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 24,
          color: C.sub,
          border: `1px solid ${C.border}`,
          background: C.surface,
          padding: '10px 22px',
          borderRadius: 999,
        }}
      >
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: C.green }} />
        powered by $INDIEGEN on Solana
      </div>
    </Reveal>
  </Stage>
)

/* 2 — PROBLEM -------------------------------------------------------------- */
export const Problem: React.FC<{ dur: number }> = ({ dur }) => {
  const pains = [
    ['$500–5,000', 'per freelance asset pack'],
    ['weeks', 'of revisions & back-and-forth'],
    ['Photoshop · Spine · Blender', 'skills most teams don’t have'],
  ]
  return (
    <Stage dur={dur} bg={0.6}>
      <Reveal>
        <div style={{ fontSize: 64, fontWeight: 700, textAlign: 'center' }}>
          Game art is the <span style={gradientText}>bottleneck</span>
        </div>
      </Reveal>
      <div style={{ display: 'flex', gap: 28, marginTop: 60 }}>
        {pains.map((p, i) => (
          <Reveal key={i} delay={16 + i * 10}>
            <div
              style={{
                width: 380,
                padding: '34px 30px',
                borderRadius: 20,
                background: C.surface,
                border: `1px solid ${C.border}`,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 40, fontWeight: 700, color: C.accent }}>{p[0]}</div>
              <div style={{ fontSize: 24, color: C.sub, marginTop: 12, lineHeight: 1.4 }}>{p[1]}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </Stage>
  )
}

/* 3 — CAPABILITIES --------------------------------------------------------- */
export const Capabilities: React.FC<{ dur: number }> = ({ dur }) => {
  const { fps } = useVideoConfig()
  const frame = useCurrentFrame()
  const cards = [
    { label: 'Animated sprites', tag: '2D', el: <SlimeAsset size={130} /> },
    { label: 'Autotile sets', tag: 'TILES', el: <TileAsset size={130} /> },
    { label: 'Parallax scenes', tag: 'SCENE', el: <ParallaxAsset size={190} /> },
    { label: 'Low-poly 3D', tag: '3D', el: <CubeAsset size={120} /> },
  ]
  return (
    <Stage dur={dur} bg={0.8}>
      <Reveal>
        <div style={{ fontSize: 60, fontWeight: 700, textAlign: 'center', marginBottom: 56 }}>
          The whole pipeline, <span style={gradientText}>in one tab</span>
        </div>
      </Reveal>
      <div style={{ display: 'flex', gap: 28 }}>
        {cards.map((c, i) => {
          const s = spring({ frame: frame - (18 + i * 9), fps, config: { damping: 14 } })
          return (
            <div
              key={i}
              style={{
                opacity: s,
                transform: `translateY(${interpolate(s, [0, 1], [50, 0])}px)`,
                width: 320,
                height: 360,
                borderRadius: 24,
                background: C.surface,
                border: `1px solid ${C.border}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 26,
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 18,
                  left: 22,
                  fontSize: 16,
                  letterSpacing: '0.12em',
                  color: C.accent,
                  fontWeight: 600,
                }}
              >
                {c.tag}
              </div>
              <div style={{ height: 200, display: 'grid', placeItems: 'center' }}>{c.el}</div>
              <div style={{ fontSize: 28, fontWeight: 600 }}>{c.label}</div>
            </div>
          )
        })}
      </div>
    </Stage>
  )
}

/* 4 — PIPELINE ------------------------------------------------------------- */
export const Pipeline: React.FC<{ dur: number }> = ({ dur }) => {
  const { fps } = useVideoConfig()
  const frame = useCurrentFrame()
  const steps = [
    ['01', 'Describe', 'a body plan, a style, or plain words'],
    ['02', 'Anchor', 'one canonical character is locked'],
    ['03', 'Paint frames', 'every keyframe stays coherent'],
    ['04', 'Export', 'PNG sheets, GLB — Unity / Godot / Unreal'],
  ]
  return (
    <Stage dur={dur} bg={0.7}>
      <Reveal>
        <div style={{ fontSize: 60, fontWeight: 700, textAlign: 'center', marginBottom: 56 }}>
          From prompt to <span style={gradientText}>game-ready</span>
        </div>
      </Reveal>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
        {steps.map((s, i) => {
          const sp = spring({ frame: frame - (16 + i * 12), fps, config: { damping: 16 } })
          return (
            <React.Fragment key={i}>
              <div
                style={{
                  opacity: sp,
                  transform: `scale(${interpolate(sp, [0, 1], [0.85, 1])})`,
                  width: 300,
                  padding: '34px 28px',
                  borderRadius: 20,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                }}
              >
                <div style={{ fontSize: 44, fontWeight: 700, color: C.accent, opacity: 0.5 }}>{s[0]}</div>
                <div style={{ fontSize: 30, fontWeight: 600, marginTop: 18 }}>{s[1]}</div>
                <div style={{ fontSize: 21, color: C.sub, marginTop: 10, lineHeight: 1.45 }}>{s[2]}</div>
              </div>
              {i < steps.length - 1 && (
                <div style={{ alignSelf: 'center', color: C.accent, fontSize: 40, opacity: sp, padding: '0 10px' }}>›</div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </Stage>
  )
}

/* 5 — TOKEN ---------------------------------------------------------------- */
export const Token: React.FC<{ dur: number }> = ({ dur }) => {
  const prices = [
    ['Sprite + anim', '10'],
    ['Tileset', '25'],
    ['3D model', '50'],
    ['Full pack', '250'],
  ]
  return (
    <Stage dur={dur} bg={0.7}>
      <Reveal>
        <div style={{ fontSize: 116, fontWeight: 700, ...gradientText }}>$INDIEGEN</div>
      </Reveal>
      <Reveal delay={14}>
        <div style={{ fontSize: 40, color: C.text, fontWeight: 600, marginTop: 4 }}>
          Pay per asset. No subscription.
        </div>
      </Reveal>
      <Reveal delay={24}>
        <div style={{ fontSize: 24, color: C.sub, marginTop: 14 }}>
          Sub-cent fees · 400ms finality · buy with any token via Jupiter
        </div>
      </Reveal>
      <div style={{ display: 'flex', gap: 18, marginTop: 50 }}>
        {prices.map((p, i) => (
          <Reveal key={i} delay={34 + i * 8}>
            <div
              style={{
                padding: '20px 30px',
                borderRadius: 16,
                background: C.surface,
                border: `1px solid ${C.border}`,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 22, color: C.sub }}>{p[0]}</div>
              <div style={{ fontSize: 38, fontWeight: 700, color: C.accent, marginTop: 6 }}>{p[1]}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </Stage>
  )
}

/* 6 — OUTRO ---------------------------------------------------------------- */
export const Outro: React.FC<{ dur: number }> = ({ dur }) => (
  <Stage dur={dur}>
    <Logo size={170} />
    <Reveal delay={12} style={{ marginTop: 30 }}>
      <div style={{ fontSize: 66, fontWeight: 700, textAlign: 'center', maxWidth: 1200, lineHeight: 1.1 }}>
        Ship your game’s art in{' '}
        <span style={gradientText}>minutes, not months</span>
      </div>
    </Reveal>
    <Reveal delay={26}>
      <div
        style={{
          marginTop: 40,
          fontSize: 30,
          fontWeight: 600,
          color: '#1a1404',
          background: C.accent,
          padding: '16px 40px',
          borderRadius: 12,
        }}
      >
        Launch the Studio →
      </div>
    </Reveal>
    <Reveal delay={36}>
      <div style={{ marginTop: 26, fontSize: 26, color: C.muted, letterSpacing: '0.04em' }}>indiegen.studio</div>
    </Reveal>
  </Stage>
)
