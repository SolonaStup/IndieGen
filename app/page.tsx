'use client'

import { useEffect, useRef } from 'react'
import InteractiveWaves from '@/app/components/ui/InteractiveWaves'

/* ------------------------------------------------------------------ *
 * INDIEGEN — landing page
 * Dark game-studio "forge" aesthetic, built on the existing design
 * tokens (orange #f5a524 accent on near-black). All motion is CSS;
 * only scroll-reveal + cursor tracking use a tiny bit of JS.
 * ------------------------------------------------------------------ */

const GITHUB_URL = 'https://github.com/SolonaStup/IndieGen'
const TWITTER_URL = 'https://x.com/IndieGenSol'

function SocialLinks({ size = 18 }: { size?: number }) {
  const cls =
    'grid h-9 w-9 place-items-center rounded-md border border-[var(--border)] text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-border)] hover:text-[var(--text)]'
  return (
    <div className="flex items-center gap-2">
      <a href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label="GitHub" className={cls}>
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.21 3.44 9.63 8.21 11.19.6.11.82-.25.82-.55 0-.27-.01-1.17-.02-2.12-3.34.71-4.04-1.58-4.04-1.58-.55-1.37-1.34-1.74-1.34-1.74-1.09-.74.08-.72.08-.72 1.21.08 1.84 1.23 1.84 1.23 1.07 1.81 2.81 1.29 3.5.99.11-.77.42-1.29.76-1.59-2.67-.3-5.47-1.32-5.47-5.86 0-1.29.47-2.35 1.23-3.18-.12-.3-.53-1.51.12-3.15 0 0 1-.32 3.3 1.21a11.5 11.5 0 0 1 6 0c2.29-1.53 3.29-1.21 3.29-1.21.65 1.64.24 2.85.12 3.15.77.83 1.23 1.89 1.23 3.18 0 4.55-2.81 5.55-5.49 5.85.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .31.21.69.83.57A12.01 12.01 0 0 0 24 12.29C24 5.78 18.63.5 12 .5z" />
        </svg>
      </a>
      <a href={TWITTER_URL} target="_blank" rel="noreferrer" aria-label="Twitter / X" className={cls}>
        <svg width={size - 2} height={size - 2} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
        </svg>
      </a>
    </div>
  )
}

const CAPABILITIES = [
  {
    kind: 'slime' as const,
    tag: '2D / SPRITES',
    title: 'Animated sprites',
    body: 'Full animation sets — idle, walk, run, attack, hurt, death — on one coherent character. Two-pass pose mapping keeps identity locked across every frame.',
    meta: '6 body plans · up to 12 frames',
  },
  {
    kind: 'tiles' as const,
    tag: '2D / TILES',
    title: 'Autotile tilesets',
    body: '13-tile autotile sets generated in a single pass, with corner reconciliation and an AI art-director QA review baked in.',
    meta: 'atlas + per-tile PNG + manifest',
  },
  {
    kind: 'parallax' as const,
    tag: '2D / SCENE',
    title: 'Parallax backgrounds',
    body: 'Multi-layer sidescroller backdrops with per-layer depth and scroll speed. Auto-extend to any width, then heal the loop seam.',
    meta: 'sky · far · mid · near',
  },
  {
    kind: 'scatter' as const,
    tag: '2D / PROPS',
    title: 'Prop libraries',
    body: 'Growing sets of distinct decoration sprites with an art-director ideation pipeline. Each batch is deduped against the last.',
    meta: 'packed transparent atlas',
  },
  {
    kind: 'cube' as const,
    tag: '3D / MODELS',
    title: 'Low-poly 3D',
    body: 'Game-ready geometry with UV-unwrapped PBR textures, normal maps, and a rig with IK targets. Drop straight into your engine.',
    meta: 'GLB · FBX · OBJ  — soon',
    soon: true,
  },
  {
    kind: 'stack' as const,
    tag: 'PACKS',
    title: 'Full asset packs',
    body: 'Bundle 2D and 3D into one coherent set sharing a single art direction — characters, tiles, scenery and UI in one download.',
    meta: 'one ZIP, engine-ready',
  },
]

const PIPELINE = [
  { n: '01', t: 'Describe', d: 'Pick a body plan and style, or just type what you want in plain language.' },
  { n: '02', t: 'Anchor', d: 'Pass 1 generates the character anchor — the canonical look that everything else inherits.' },
  { n: '03', t: 'Paint frames', d: 'Pass 2 paints every keyframe onto a consistent pose map, so the character never drifts.' },
  { n: '04', t: 'Export', d: 'Download spritesheets, frames and a JSON manifest — or push straight to Unity, Godot or Unreal.' },
]

const PRICES = [
  ['2D sprite + 8-frame animation', '10'],
  ['Tileset (16 tiles)', '25'],
  ['Parallax background (3 layers)', '20'],
  ['UI kit (buttons, bars, icons)', '30'],
  ['Full 2D character (all anims)', '60'],
  ['3D model + rig + animations', '100'],
  ['Full 2D + 3D asset pack', '250'],
]

const MARQUEE = [
  'Humanoid', 'Quadruped', 'Serpent', 'Flyer', 'Blob', 'Pixel 16px', 'Pixel 32px',
  'Dark Fantasy', 'Chibi', 'Cartoon', 'Idle', 'Walk', 'Run', 'Attack', 'Death',
  'Tilesets', 'Parallax', 'UI Kits', 'Normal Maps', 'Rigging', 'GLB Export',
]

export default function Home() {
  const glowRef = useRef<HTMLDivElement>(null)

  // Cursor-follow ambient glow in the hero + bento spotlight
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${e.clientX - 300}px, ${e.clientY - 300}px)`
      }
      const card = (e.target as HTMLElement)?.closest('.lp-card') as HTMLElement | null
      if (card) {
        const r = card.getBoundingClientRect()
        card.style.setProperty('--mx', `${e.clientX - r.left}px`)
        card.style.setProperty('--my', `${e.clientY - r.top}px`)
      }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // Scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll('.lp-reveal')
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && en.target.classList.add('is-in')),
      { threshold: 0.15 }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      {/* custom interactive background — spans the whole page, behind everything */}
      <InteractiveWaves style={{ position: 'fixed', zIndex: 0 }} />
      {/* cursor glow */}
      <div
        ref={glowRef}
        className="pointer-events-none fixed left-0 top-0 z-0 h-[600px] w-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(245,165,36,0.07), transparent 65%)' }}
      />

      <div className="relative z-10">
        <Nav />
        <Hero />
        <Marquee />
        <Capabilities />
        <Pipeline />
        <Token />
        <CTA />
        <Footer />
      </div>
    </main>
  )
}

/* ----------------------------------------------------------------- */

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(11,12,16,0.7)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <a href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="INDIEGEN" width={30} height={30}
            className="h-[30px] w-[30px] object-contain"
            style={{ filter: 'drop-shadow(0 1px 5px rgba(245,165,36,0.4))' }} />
          <span className="text-[16px] font-semibold tracking-tight">INDIEGEN</span>
        </a>
        <nav className="hidden items-center gap-7 text-[13px] text-[var(--text-secondary)] md:flex">
          <a href="#capabilities" className="transition-colors hover:text-[var(--text)]">Capabilities</a>
          <a href="#pipeline" className="transition-colors hover:text-[var(--text)]">Pipeline</a>
          <a href="#token" className="transition-colors hover:text-[var(--text)]">$INDIEGEN</a>
        </nav>
        <div className="flex items-center gap-3">
          <SocialLinks />
          <a href="/studio" className="btn btn-primary">Launch Studio →</a>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-24 pt-20 md:pt-28">
      {/* faint blueprint grid layered over the global waves for depth */}
      <div className="lp-grid pointer-events-none absolute inset-0 z-0 opacity-40" />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* floating logo + halo */}
        <div className="relative mx-auto mb-10 h-32 w-32">
          <div className="lp-halo absolute inset-0 rounded-full blur-2xl"
            style={{ background: 'radial-gradient(circle, rgba(245,165,36,0.55), transparent 70%)' }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="lp-logo-float relative h-32 w-32 object-contain"
            style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.5))' }} />
        </div>

        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
          Ship your game's art<br className="hidden md:block" />{' '}
          <span className="lp-gradient-text">in minutes, not months</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-[var(--text-secondary)] md:text-[17px]">
          Production-ready 2D sprites, animations, tilesets and low-poly 3D models —
          generated, rigged and export-ready for Unity, Godot and Unreal. No artist, no
          subscription. Buy credits, generate, ship.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <a href="/studio" className="btn btn-primary px-6 py-3 text-[14px]">Open the Studio</a>
          <a href="#capabilities" className="btn btn-secondary px-6 py-3 text-[14px]">See what it makes</a>
        </div>

        {/* live asset deck — each tile shows a different thing the studio makes */}
        <div className="lp-reveal mx-auto mt-16 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
          <AssetTile label="sprite" kind="slime" />
          <AssetTile label="tileset" kind="tiles" />
          <AssetTile label="parallax" kind="parallax" />
          <AssetTile label="3D model" kind="cube" />
        </div>

        {/* engine / format badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] font-mono text-[var(--text-muted)]">
          {['UNITY', 'GODOT', 'UNREAL', 'PNG SHEET', 'GLB', 'FBX', 'ASEPRITE'].map((f) => (
            <span key={f}>{f}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- animated asset mini-visuals (pure CSS, no assets needed) ------- */

type VisualKind = 'slime' | 'tiles' | 'parallax' | 'scatter' | 'cube' | 'stack'

function AssetVisual({ kind }: { kind: VisualKind }) {
  switch (kind) {
    case 'slime': return <VSlime />
    case 'tiles': return <VTiles />
    case 'parallax': return <VParallax />
    case 'scatter': return <VScatter />
    case 'cube': return <VCube />
    case 'stack': return <VStack />
  }
}

/** Framed tile used in the hero deck. */
function AssetTile({ label, kind }: { label: string; kind: VisualKind }) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] transition-colors hover:border-[var(--accent-border)]">
      <div className="checker absolute inset-0 opacity-50" />
      <div className="absolute inset-0 grid place-items-center"><AssetVisual kind={kind} /></div>
      <span className="absolute bottom-1.5 left-2 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{label}</span>
    </div>
  )
}

/** Header strip used on each capability card. */
function CardVisual({ kind }: { kind: VisualKind }) {
  return (
    <div className="relative mb-5 grid h-28 place-items-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elev)]">
      <div className="checker absolute inset-0 opacity-40" />
      <AssetVisual kind={kind} />
    </div>
  )
}

function VSlime() {
  return (
    <div className="relative grid place-items-end" style={{ width: 56, height: 56 }}>
      <div className="av-slime relative" style={{ width: 42, height: 34 }}>
        <div className="absolute inset-0 rounded-[50%_50%_45%_45%]"
          style={{ background: 'radial-gradient(circle at 38% 28%, var(--accent-hover), var(--accent) 62%, #c46a00)' }} />
        {/* eyes — flex-centered so the pair is always symmetric */}
        <div className="absolute inset-x-0 flex items-center justify-center gap-2.5" style={{ top: 12 }}>
          {[0, 1].map((i) => (
            <div key={i} className="av-eye relative h-2.5 w-2.5 rounded-full bg-[#1a1404]">
              <div className="absolute left-[1.5px] top-[1.5px] h-1 w-1 rounded-full bg-white/80" />
            </div>
          ))}
        </div>
      </div>
      <div className="av-shadow absolute bottom-0 left-1/2 h-1.5 w-9 -translate-x-1/2 rounded-full bg-black/50 blur-[1px]" />
    </div>
  )
}

function VCube() {
  const S = 46
  const faces: { t: string }[] = [
    { t: `translateZ(${S / 2}px)` },
    { t: `rotateY(180deg) translateZ(${S / 2}px)` },
    { t: `rotateY(90deg) translateZ(${S / 2}px)` },
    { t: `rotateY(-90deg) translateZ(${S / 2}px)` },
    { t: `rotateX(90deg) translateZ(${S / 2}px)` },
    { t: `rotateX(-90deg) translateZ(${S / 2}px)` },
  ]
  return (
    <div style={{ perspective: 260 }}>
      <div className="av-cube relative" style={{ width: S, height: S }}>
        {faces.map((f, i) => (
          <div key={i} className="av-cube-face" style={{ transform: f.t }} />
        ))}
      </div>
    </div>
  )
}

function VTiles() {
  return (
    <div className="grid grid-cols-4 gap-1.5" style={{ width: 76, height: 76 }}>
      {Array.from({ length: 16 }).map((_, i) => (
        <div key={i} className="av-tile rounded-[3px] border border-[var(--accent-border)]"
          style={{
            background: 'linear-gradient(135deg, rgba(245,165,36,0.32), rgba(245,165,36,0.14))',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
            animationDelay: `${((i % 4) + Math.floor(i / 4)) * 0.14}s`,
          }} />
      ))}
    </div>
  )
}

const HILL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='60'%3E%3Cpath d='M0 60 L0 38 Q40 8 80 38 T160 38 L160 60 Z' fill='%23f5a524'/%3E%3C/svg%3E\")"

function VParallax() {
  return (
    <div className="relative overflow-hidden rounded-md border border-[var(--border)]"
      style={{ width: 96, height: 64, background: 'linear-gradient(180deg, #1c1408, #0d0a06)' }}>
      <div className="absolute h-2 w-2 rounded-full" style={{ left: 16, top: 10, background: 'var(--accent-hover)', boxShadow: '0 0 8px var(--accent)' }} />
      <div className="av-band absolute bottom-0 left-0 right-0 h-8 opacity-30" style={{ backgroundImage: HILL, animationDuration: '7s' }} />
      <div className="av-band absolute bottom-0 left-0 right-0 h-6 opacity-60" style={{ backgroundImage: HILL, animationDuration: '4.5s' }} />
      <div className="av-band absolute bottom-0 left-0 right-0 h-4 opacity-95" style={{ backgroundImage: HILL, animationDuration: '2.6s' }} />
    </div>
  )
}

function VScatter() {
  // balanced, centered composition: a diamond on top, square/circle flanking
  // the central star, and a pill anchoring the bottom — symmetric, not random.
  const shapes = [
    { left: 32, top: 2, r: '0deg', el: <div className="h-4 w-4 rotate-45 rounded-[2px] bg-[var(--accent-hover)]" /> },
    { left: 6, top: 22, r: '-10deg', el: <div className="h-4 w-4 rounded-sm bg-[var(--accent)]" /> },
    { left: 58, top: 22, r: '10deg', el: <div className="h-4 w-4 rounded-full border-2 border-[var(--accent-hover)]" /> },
    { left: 31, top: 20, r: '0deg', el: <Star /> },
    { left: 26, top: 46, r: '0deg', el: <div className="h-3 w-7 rounded-full bg-[var(--accent)]/70" /> },
  ]
  return (
    <div className="relative" style={{ width: 80, height: 62 }}>
      {shapes.map((s, i) => (
        <div key={i} className="av-float absolute" style={{ left: s.left, top: s.top, ['--r' as string]: s.r, animationDuration: `${2.6 + (i % 3) * 0.4}s`, animationDelay: `${i * 0.25}s` }}>
          {s.el}
        </div>
      ))}
    </div>
  )
}

function Star() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent)">
      <path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 20.4l1.5-6.8L2.2 9l6.9-.7z" />
    </svg>
  )
}

function VStack() {
  const layers = [
    { tx: '-14px', ty: '8px', rot: '-12deg', c: 'rgba(245,165,36,0.25)' },
    { tx: '0px', ty: '0px', rot: '0deg', c: 'rgba(245,165,36,0.45)' },
    { tx: '14px', ty: '-8px', rot: '12deg', c: 'rgba(245,165,36,0.8)' },
  ]
  return (
    <div className="relative" style={{ width: 80, height: 64 }}>
      {layers.map((l, i) => (
        <div key={i} className="av-layer absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-lg border"
          style={{
            ['--tx' as string]: l.tx, ['--ty' as string]: l.ty, ['--rot' as string]: l.rot,
            background: l.c, borderColor: 'var(--accent-border)', animationDelay: `${i * 0.3}s`,
          }} />
      ))}
    </div>
  )
}

function Marquee() {
  const items = [...MARQUEE, ...MARQUEE]
  return (
    <div className="lp-marquee relative border-y border-[var(--border)] bg-[var(--bg-elev)]/70 py-4 backdrop-blur-sm">
      <div className="lp-marquee-track gap-3">
        {items.map((t, i) => (
          <span key={i}
            className="whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-[13px] text-[var(--text-secondary)]">
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

function Capabilities() {
  return (
    <section id="capabilities" className="mx-auto max-w-6xl px-5 py-24">
      <div className="lp-reveal mb-14 max-w-2xl">
        <p className="mb-3 font-mono text-[12px] uppercase tracking-widest text-[var(--accent)]">Capabilities</p>
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">The whole asset pipeline, in one tab</h2>
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--text-secondary)]">
          Five studios that turn a prompt into game-ready art — coherent across frames,
          tileable across edges, rigged and ready to export.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CAPABILITIES.map((c, i) => (
          <article key={c.title}
            className="lp-card lp-reveal flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
            style={{ transitionDelay: `${(i % 3) * 60}ms` }}>
            <CardVisual kind={c.kind} />
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--accent)]">{c.tag}</span>
              {c.soon && (
                <span className="rounded-full border border-[var(--border-strong)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">soon</span>
              )}
            </div>
            <h3 className="text-[18px] font-semibold tracking-tight">{c.title}</h3>
            <p className="mt-2 flex-1 text-[14px] leading-relaxed text-[var(--text-secondary)]">{c.body}</p>
            <p className="mt-5 border-t border-[var(--border)] pt-3 font-mono text-[11px] text-[var(--text-muted)]">{c.meta}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function Pipeline() {
  return (
    <section id="pipeline" className="border-y border-[var(--border)] bg-[var(--bg-elev)]/70 px-5 py-24 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl">
        <div className="lp-reveal mb-14 max-w-2xl">
          <p className="mb-3 font-mono text-[12px] uppercase tracking-widest text-[var(--accent)]">How it works</p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Deterministic by design</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--text-secondary)]">
            The gap between an AI image and a game-ready asset is days of manual work.
            A two-pass pose-mapping pipeline closes it — the same character stays coherent
            across every animation set.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)] md:grid-cols-4">
          {PIPELINE.map((s, i) => (
            <div key={s.n}
              className="lp-reveal group relative bg-[var(--surface)] p-7 transition-colors hover:bg-[var(--surface-hover)]"
              style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="mb-6 font-mono text-[28px] font-semibold text-[var(--accent)] opacity-30 transition-opacity group-hover:opacity-100">{s.n}</div>
              <h3 className="text-[16px] font-semibold">{s.t}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Token() {
  return (
    <section id="token" className="mx-auto max-w-6xl px-5 py-24">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="lp-reveal">
          <p className="mb-3 font-mono text-[12px] uppercase tracking-widest text-[var(--accent)]">The token</p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            <span className="lp-gradient-text">$INDIEGEN</span> is the credit system
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--text-secondary)]">
            No subscriptions, no monthly fees. The token <em>is</em> the subscription —
            liquid and tradeable. Buy credits, spend them when you generate, hold or sell
            the rest. Sub-cent fees and 400&nbsp;ms finality on Solana make a real
            microtransaction credit system viable.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              ['Pay per asset', 'or stake 5,000 for 30 days unlimited'],
              ['Style unlocks', 'premium styles gated by balance'],
              ['Priority queue', 'larger holders generate first'],
              ['Governance', 'vote on new presets & styles'],
            ].map(([t, d]) => (
              <div key={t} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="text-[14px] font-semibold">{t}</div>
                <div className="mt-1 text-[12px] leading-snug text-[var(--text-muted)]">{d}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lp-reveal rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-4">
            <span className="text-[14px] font-semibold">Generation costs</span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">credits</span>
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {PRICES.map(([label, cost]) => (
              <li key={label} className="flex items-center justify-between py-3">
                <span className="text-[14px] text-[var(--text-secondary)]">{label}</span>
                <span className="font-mono text-[14px] font-semibold text-[var(--accent)]">{cost}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-bg)] p-4 text-center">
            <div className="text-[13px] text-[var(--text-secondary)]">Stake 5,000 $INDIEGEN</div>
            <div className="text-[15px] font-semibold text-[var(--accent)]">Unlimited generation · 30 days</div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section className="px-5 py-12">
      <div className="lp-reveal relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center">
        <div className="lp-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="lp-logo-float mx-auto mb-6 h-16 w-16 object-contain" />
          <h2 className="mx-auto max-w-xl text-3xl font-semibold tracking-tight md:text-4xl">
            Your next game jam starts with art that's already done
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] text-[var(--text-secondary)]">
            Open the studio and generate your first sprite in under a minute.
          </p>
          <a href="/studio" className="btn btn-primary mt-8 px-7 py-3 text-[14px]">Launch INDIEGEN Studio →</a>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-[var(--border)] px-5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-[13px] text-[var(--text-muted)] sm:flex-row">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="INDIEGEN" className="h-5 w-5 object-contain" />
          <span className="font-semibold text-[var(--text-secondary)]">INDIEGEN</span>
          <span>· AI game asset studio on Solana</span>
        </div>
        <div className="flex items-center gap-5">
          <a href="/studio" className="transition-colors hover:text-[var(--text)]">Studio</a>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="transition-colors hover:text-[var(--text)]">GitHub</a>
          <a href={TWITTER_URL} target="_blank" rel="noreferrer" className="transition-colors hover:text-[var(--text)]">Twitter</a>
          <SocialLinks size={16} />
          <span className="font-mono">© 2026</span>
        </div>
      </div>
    </footer>
  )
}
