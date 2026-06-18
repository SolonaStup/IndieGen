import { loadFont } from '@remotion/google-fonts/Inter'

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
})

export const FONT = fontFamily

/** INDIEGEN brand palette (matches the app's design tokens). */
export const C = {
  bg: '#0b0c10',
  bg2: '#14161d',
  surface: '#1a1d26',
  surface2: '#232732',
  border: 'rgba(255,255,255,0.09)',
  borderStrong: 'rgba(255,255,255,0.16)',
  accent: '#f5a524',
  accent2: '#ffba4d',
  orange: '#ff7a18',
  text: '#f3f4f7',
  sub: '#a4a6b3',
  muted: '#6b6e7a',
  green: '#4ade80',
}

export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
}
