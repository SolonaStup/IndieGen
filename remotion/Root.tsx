import React from 'react'
import { Composition } from 'remotion'
import { VIDEO } from './theme'
import { IndiegenPromo, TOTAL_FRAMES } from './Video'

export const RemotionRoot: React.FC = () => (
  <Composition
    id="IndiegenPromo"
    component={IndiegenPromo}
    durationInFrames={TOTAL_FRAMES}
    fps={VIDEO.fps}
    width={VIDEO.width}
    height={VIDEO.height}
  />
)
