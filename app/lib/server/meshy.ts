/**
 * Meshy text-to-3D provider (server-only). Creates a task, polls until the
 * model is ready, and returns the asset URLs.
 *
 * When MESHY_API_KEY is absent we run in MOCK mode: after a short delay we
 * return a known-good sample GLB so the whole studio (viewer, credits, export)
 * is testable without a paid key. Drop a key in .env.local to go live.
 *
 * Docs: https://docs.meshy.ai  (Text to 3D v2)
 */

const MESHY_BASE = 'https://api.meshy.ai/openapi/v2'

/** Public sample model shown in MOCK mode. */
const MOCK_MODELS = [
  'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
  'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb',
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Duck/glTF-Binary/Duck.glb',
]

export interface Model3DResult {
  modelUrl: string
  thumbnailUrl?: string
  formats: { glb?: string; fbx?: string; obj?: string }
  mock: boolean
  taskId?: string
}

export type ArtStyle3D = 'realistic' | 'sculpture'

export interface Generate3DParams {
  prompt: string
  artStyle?: ArtStyle3D
  /** target topology — 'quad' is friendlier for rigging. */
  topology?: 'quad' | 'triangle'
  /** approximate polycount budget. */
  targetPolycount?: number
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function isMeshyConfigured(): boolean {
  return Boolean(process.env.MESHY_API_KEY?.trim())
}

/** Generate a 3D model. Resolves once the GLB is ready (or throws). */
export async function generate3D(params: Generate3DParams): Promise<Model3DResult> {
  const key = process.env.MESHY_API_KEY?.trim()

  // ---- MOCK mode ---------------------------------------------------------
  if (!key) {
    await sleep(1500) // simulate generation latency
    // vary the sample by prompt length so repeated calls differ a little
    const pick = MOCK_MODELS[params.prompt.length % MOCK_MODELS.length]
    return {
      modelUrl: pick,
      formats: { glb: pick },
      mock: true,
    }
  }

  // ---- LIVE mode (Meshy) -------------------------------------------------
  const headers = {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }

  // 1) create a preview task
  const createRes = await fetch(`${MESHY_BASE}/text-to-3d`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      mode: 'preview',
      prompt: params.prompt,
      art_style: params.artStyle ?? 'realistic',
      topology: params.topology ?? 'quad',
      target_polycount: params.targetPolycount ?? 30000,
      should_remesh: true,
    }),
  })
  if (!createRes.ok) {
    throw new Error(`Meshy create failed: ${createRes.status} ${await createRes.text()}`)
  }
  const { result: taskId } = await createRes.json()

  // 2) poll until done (preview ~30–60s)
  const deadline = Date.now() + 5 * 60 * 1000
  while (Date.now() < deadline) {
    await sleep(4000)
    const pollRes = await fetch(`${MESHY_BASE}/text-to-3d/${taskId}`, { headers })
    if (!pollRes.ok) continue
    const task = await pollRes.json()
    if (task.status === 'SUCCEEDED') {
      const urls = task.model_urls ?? {}
      return {
        modelUrl: urls.glb,
        thumbnailUrl: task.thumbnail_url,
        formats: { glb: urls.glb, fbx: urls.fbx, obj: urls.obj },
        mock: false,
        taskId,
      }
    }
    if (task.status === 'FAILED') {
      throw new Error(`Meshy task failed: ${task.task_error?.message ?? 'unknown'}`)
    }
  }
  throw new Error('Meshy task timed out')
}
