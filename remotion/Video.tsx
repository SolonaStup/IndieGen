import React from 'react'
import { AbsoluteFill, Sequence } from 'remotion'
import { C } from './theme'
import { Capabilities, Intro, Outro, Pipeline, Problem, Token } from './scenes'

const OVERLAP = 12 // frames of cross-dissolve between scenes

const SCENES: { Comp: React.FC<{ dur: number }>; dur: number }[] = [
  { Comp: Intro, dur: 120 },
  { Comp: Problem, dur: 105 },
  { Comp: Capabilities, dur: 175 },
  { Comp: Pipeline, dur: 165 },
  { Comp: Token, dur: 135 },
  { Comp: Outro, dur: 135 },
]

const offsets = SCENES.reduce<number[]>((acc, s, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + SCENES[i - 1].dur - OVERLAP)
  return acc
}, [])

export const TOTAL_FRAMES =
  offsets[offsets.length - 1] + SCENES[SCENES.length - 1].dur

export const IndiegenPromo: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    {SCENES.map((s, i) => (
      <Sequence key={i} from={offsets[i]} durationInFrames={s.dur}>
        <s.Comp dur={s.dur} />
      </Sequence>
    ))}
  </AbsoluteFill>
)
