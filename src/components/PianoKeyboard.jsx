import { useState } from 'react'
import * as Tone from 'tone'

const BLACK_KEYS = [1, 3, 6, 8, 10]

function PianoKeyboard({ activeNotes = [], onNotePlay, onNoteStop, onKeyClick }) {
  const [synth] = useState(() => {
    if (typeof window !== 'undefined') {
      return new Tone.PolySynth(Tone.Synth).toDestination()
    }
    return null
  })

  const handleKeyClick = async (midiNote) => {
    if (!synth) return
    
    try {
      if (Tone.context.state !== 'running') {
        await Tone.start()
      }
      
      const freq = Tone.Frequency(midiNote, 'midi').toFrequency()
      synth.triggerAttackRelease(freq, '8n')
      
      if (onKeyClick) {
        onKeyClick(midiNote)
      }
      
      if (onNotePlay) {
        onNotePlay(midiNote)
      }
      
      setTimeout(() => {
        if (onNoteStop) {
          onNoteStop(midiNote)
        }
      }, 200)
    } catch (error) {
      console.error('Error playing note:', error)
    }
  }

  const isKeyActive = (midiNote) => {
    return activeNotes.includes(midiNote)
  }

  const isBlackKey = (midiNote) => {
    return BLACK_KEYS.includes(midiNote % 12)
  }

  const getKeyLabel = (midiNote) => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const note = midiNote % 12
    const octave = Math.floor(midiNote / 12) - 1
    
    if (note === 0) { // C note
      return `${noteNames[note]}${octave}`
    }
    return ''
  }

  const DISPLAY_START = 21
  const DISPLAY_END = 108
  const displayKeys = []

  for (let midi = DISPLAY_START; midi <= DISPLAY_END; midi++) {
    displayKeys.push(midi)
  }

  const whiteKeysCount = displayKeys.filter(k => !isBlackKey(k)).length
  const totalWidth = whiteKeysCount * 40

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '150px',
      backgroundColor: '#2d2d2d',
      padding: '10px 0',
      overflowX: 'auto',
      overflowY: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        height: '100%',
        position: 'relative',
        minWidth: `${totalWidth}px`,
        justifyContent: 'flex-start'
      }}>
        {displayKeys.map(midi => {
          if (isBlackKey(midi)) return null
          
          const isActive = isKeyActive(midi)
          const label = getKeyLabel(midi)
          
          return (
            <div
              key={`white-${midi}`}
              onClick={() => handleKeyClick(midi)}
              style={{
                position: 'relative',
                width: '40px',
                height: '130px',
                backgroundColor: isActive ? '#4fd1c7' : '#ffffff',
                border: '1px solid #ccc',
                borderRight: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: '5px',
                fontSize: '10px',
                color: isActive ? '#fff' : '#333',
                userSelect: 'none',
                transition: 'background-color 0.1s',
                boxSizing: 'border-box'
              }}
              onMouseDown={() => handleKeyClick(midi)}
            >
              {label}
            </div>
          )
        })}
        
        {displayKeys.map(midi => {
          if (!isBlackKey(midi)) return null
          
          const isActive = isKeyActive(midi)
          const whiteKeyIndex = displayKeys.filter(k => !isBlackKey(k) && k < midi).length
          const position = whiteKeyIndex * 40 - 12
          
          return (
            <div
              key={`black-${midi}`}
              onClick={() => handleKeyClick(midi)}
              style={{
                position: 'absolute',
                left: `${position}px`,
                width: '24px',
                height: '80px',
                backgroundColor: isActive ? '#2dd4bf' : '#1a1a1a',
                border: '1px solid #000',
                cursor: 'pointer',
                zIndex: 2,
                userSelect: 'none',
                transition: 'background-color 0.1s',
                boxSizing: 'border-box'
              }}
              onMouseDown={() => handleKeyClick(midi)}
            />
          )
        })}
      </div>
    </div>
  )
}

export default PianoKeyboard

