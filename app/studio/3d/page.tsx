'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { Logo } from '@/app/components/TopBar'
import { CreditWallet } from '@/app/components/CreditWallet'
import { useCredits } from '@/app/components/CreditProvider'
import { MODEL3D_USD, estimate3DUsd } from '@/app/lib/credits'
import { Icons } from '@/app/components/icons'

interface Model3D {
  modelUrl: string
  thumbnailUrl?: string
  formats: { glb?: string; fbx?: string; obj?: string }
  mock: boolean
}

const EXAMPLES = [
  'a low-poly treasure chest, game asset, wooden with iron bands',
  'a cute cartoon mushroom house, stylized',
  'a sci-fi laser pistol, clean hard-surface',
  'a stylized health potion bottle with cork',
  'a low-poly oak tree, hand-painted style',
]

const PRICE_LABEL = `$${MODEL3D_USD.MIN}–$${MODEL3D_USD.MAX}`

export default function Model3DStudio() {
  const { open: openWallet } = useAppKit()
  const { isConnected, address } = useAppKitAccount()
  const { authed, pay } = useCredits()

  const [prompt, setPrompt] = useState('')
  const [artStyle, setArtStyle] = useState<'realistic' | 'sculpture'>('realistic')
  const [loading, setLoading] = useState(false)
  const [model, setModel] = useState<Model3D | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [live, setLive] = useState<boolean | null>(null)
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    fetch('/api/generate-3d')
      .then((r) => r.json())
      .then((d) => setLive(Boolean(d.live)))
      .catch(() => setLive(false))
  }, [])

  const startTimer = () => {
    setElapsed(0)
    elapsedRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
  }
  const stopTimer = () => {
    if (elapsedRef.current) clearInterval(elapsedRef.current)
  }

  const generate = async () => {
    setError(null)
    if (!prompt.trim()) {
      setError('Describe the model you want.')
      return
    }
    if (!isConnected || !address) {
      setError('Connect a wallet to generate.')
      openWallet()
      return
    }
    setLoading(true)
    setModel(null)

    // pay() checks /api/price fresh: returns null when free, txSignature when paid.
    let txSignature: string | null = null
    try {
      txSignature = await pay(estimate3DUsd(prompt.trim()))
    } catch (e) {
      setLoading(false)
      setError(e instanceof Error ? e.message : 'Payment was cancelled.')
      return
    }

    startTimer()
    try {
      const res = await fetch('/api/generate-3d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), artStyle, txSignature }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Generation failed.')
        return
      }
      setModel(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed.')
    } finally {
      setLoading(false)
      stopTimer()
    }
  }

  return (
    <main className="flex h-screen flex-col">
      <Script
        type="module"
        src="https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js"
        strategy="afterInteractive"
      />

      {/* header */}
      <header
        className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b px-4 sm:px-6"
        style={{ borderColor: 'var(--border)' }}
      >
        <Logo />
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 sm:flex">
          <a href="/studio" className="btn btn-ghost text-[13px]">← 2D Studio</a>
          <span className="rounded-full bg-[var(--accent-bg)] px-3 py-1 text-[12px] font-semibold text-[var(--accent)]">
            3D Studio
          </span>
        </div>
        <CreditWallet />
      </header>

      {/* mock-mode banner */}
      {live === false && (
        <div className="flex items-center justify-center gap-2 border-b border-[var(--accent-border)] bg-[var(--accent-bg)] py-2 text-[12px] text-[var(--accent)]">
          <Icons.Sparkle size={13} />
          Mock mode — showing sample models. Add <code className="font-mono">MESHY_API_KEY</code> to .env.local for real generation.
        </div>
      )}

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[360px_1fr]">
        {/* left: controls */}
        <aside className="flex flex-col gap-5 overflow-y-auto border-r border-[var(--border)] p-5">
          <div>
            <label className="mb-2 block text-[12px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Describe your model
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="a low-poly treasure chest, wooden with iron bands…"
              className="field resize-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-[12px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Art style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['realistic', 'sculpture'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setArtStyle(s)}
                  className={`btn ${artStyle === s ? 'btn-primary' : 'btn-secondary'} capitalize`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[12px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Examples
            </label>
            <div className="flex flex-col gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setPrompt(ex)}
                  className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left text-[12px] text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-border)] hover:text-[var(--text)]"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto">
            {error && (
              <p className="mb-2 text-[12px] text-[var(--danger)]">{error}</p>
            )}
            <button
              onClick={generate}
              disabled={loading}
              className="btn btn-primary w-full py-3 text-[14px]"
            >
              {loading ? (
                <><Icons.Spinner size={16} /> Generating… {elapsed}s</>
              ) : (
                <>Generate 3D model · {PRICE_LABEL}</>
              )}
            </button>
            <p className="mt-2 text-center text-[11px] text-[var(--text-muted)]">
              {isConnected
                ? authed
                  ? 'Free during beta · priced by complexity at launch'
                  : 'Sign in with your wallet to generate'
                : 'Connect a wallet to generate'}
            </p>
          </div>
        </aside>

        {/* right: viewer */}
        <section className="relative flex items-center justify-center overflow-hidden bg-[var(--bg)]">
          <div className="lp-grid pointer-events-none absolute inset-0 opacity-30" />
          {loading ? (
            <div className="relative z-10 flex flex-col items-center gap-3 text-center">
              <Icons.Spinner size={32} />
              <p className="text-[14px] text-[var(--text-secondary)]">Sculpting geometry… {elapsed}s</p>
              <p className="text-[12px] text-[var(--text-muted)]">Text-to-3D usually takes 30–60s</p>
            </div>
          ) : model ? (
            <div className="relative z-10 flex h-full w-full flex-col">
              <model-viewer
                src={model.modelUrl}
                alt="Generated 3D model"
                camera-controls
                auto-rotate
                shadow-intensity="1"
                exposure="1"
                style={{ width: '100%', height: '100%', background: 'transparent' }}
              />
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                {model.mock && (
                  <span className="rounded-full bg-[var(--accent-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--accent)]">sample</span>
                )}
                <span className="text-[12px] text-[var(--text-muted)]">Export:</span>
                {(['glb', 'fbx', 'obj'] as const).map((fmt) => {
                  const url = model.formats[fmt]
                  return url ? (
                    <a key={fmt} href={url} download className="btn btn-secondary px-3 py-1.5 text-[12px] uppercase">
                      {fmt}
                    </a>
                  ) : (
                    <span key={fmt} className="px-3 py-1.5 text-[12px] uppercase text-[var(--text-muted)] opacity-40">{fmt}</span>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="relative z-10 flex flex-col items-center gap-3 text-center text-[var(--text-muted)]">
              <div className="lp-logo-float">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="" className="h-16 w-16 object-contain opacity-60" />
              </div>
              <p className="text-[15px] text-[var(--text-secondary)]">Describe a model and generate</p>
              <p className="text-[12px]">Drag to orbit · scroll to zoom once it loads</p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
