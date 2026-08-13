/** Picture taken from the workbook, with a fallback to the drawn animation. */
import { useState } from 'react'
import ExerciseAnimation from './ExerciseAnimation'
import { useApp } from '../lib/store'
import type { Exercise } from '../types'

interface Props {
  exercise: Exercise
  size?: 'thumb' | 'big'
  /** Shows the photo / animation switch, only useful on the big size. */
  toggle?: boolean
}

export default function ExerciseMedia({ exercise, size = 'thumb', toggle = false }: Props) {
  const { imageUrl } = useApp()
  const url = imageUrl(exercise.imageId)
  const [mode, setMode] = useState<'photo' | 'anim'>(url ? 'photo' : 'anim')
  const showPhoto = url && mode === 'photo'

  return (
    <div className={`media ${size} ${showPhoto ? 'photo' : ''}`}>
      {showPhoto ? (
        <img src={url} alt={exercise.name} loading="lazy" />
      ) : (
        <div style={{ width: '100%', height: '100%', padding: size === 'thumb' ? 4 : 14 }}>
          <ExerciseAnimation pattern={exercise.pattern} />
        </div>
      )}
      {toggle && url && (
        <div className="media-toggle">
          <button className={mode === 'photo' ? 'active' : ''} onClick={() => setMode('photo')}>
            Foto
          </button>
          <button className={mode === 'anim' ? 'active' : ''} onClick={() => setMode('anim')}>
            Anim
          </button>
        </div>
      )}
    </div>
  )
}
