import { useEffect, useRef, useState } from 'react'
import { Midi } from '@tonejs/midi'

const NOTE_HEIGHT = 12
const PIXELS_PER_SECOND = 200
const TOTAL_KEYS = 88
const START_NOTE = 21

function PianoRoll({ midiData, currentTime, onNoteClick }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [notes, setNotes] = useState([])
  const [duration, setDuration] = useState(0)
  const [parseError, setParseError] = useState(null)

  useEffect(() => {
    if (!midiData) {
      setNotes([])
      setDuration(0)
      setParseError(null)
      return
    }

    try {
      const midi = new Midi(midiData)
      const allNotes = []
      
      console.log('MIDI file parsed:', {
        tracks: midi.tracks?.length || 0,
        duration: midi.duration,
        header: midi.header
      })
      
      if (!midi.tracks || midi.tracks.length === 0) {
        console.warn('MIDI file has no tracks')
        setParseError('MIDI file contains no tracks. This may be an invalid or corrupted MIDI file.')
        setNotes([])
        setDuration(10)
        return
      }
      
      const midiDuration = (midi.duration && midi.duration > 0) ? midi.duration : 10
      setDuration(midiDuration)

      midi.tracks.forEach((track, trackIndex) => {
        if (track && track.notes) {
          console.log(`Track ${trackIndex}: ${track.notes.length} notes`)
          track.notes.forEach(note => {
            allNotes.push({
              midi: note.midi,
              time: note.time,
              duration: note.duration,
              velocity: note.velocity,
            })
          })
        }
      })

      console.log(`Total notes collected: ${allNotes.length}`)
      setNotes(allNotes)
      setParseError(null)
    } catch (error) {
      console.error('Error parsing MIDI:', error)
      setParseError(error.message)
      setNotes([])
      setDuration(10)
    }
  }, [midiData])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || duration === 0) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, width, height)

    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1

    for (let i = 0; i <= TOTAL_KEYS; i++) {
      const y = (TOTAL_KEYS - i) * NOTE_HEIGHT
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    const timeStep = 0.5
    for (let t = 0; t <= duration; t += timeStep) {
      const x = t * PIXELS_PER_SECOND
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    notes.forEach(note => {
      const noteIndex = note.midi - START_NOTE
      if (noteIndex < 0 || noteIndex >= TOTAL_KEYS) return

      const y = (TOTAL_KEYS - noteIndex - 1) * NOTE_HEIGHT
      const x = note.time * PIXELS_PER_SECOND
      const width = note.duration * PIXELS_PER_SECOND

      const alpha = Math.min(0.9, 0.5 + note.velocity / 2)
      ctx.fillStyle = `rgba(66, 153, 225, ${alpha})`

      ctx.fillRect(x, y + 1, Math.max(2, width), NOTE_HEIGHT - 2)
      
      if (width > 4) {
        ctx.strokeStyle = `rgba(66, 153, 225, ${alpha * 0.8})`
        ctx.lineWidth = 1
        ctx.strokeRect(x, y + 1, Math.max(2, width), NOTE_HEIGHT - 2)
      }
    })

    if (currentTime !== null && currentTime !== undefined) {
      const indicatorX = currentTime * PIXELS_PER_SECOND
      ctx.strokeStyle = '#4fd1c7'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(indicatorX, 0)
      ctx.lineTo(indicatorX, height)
      ctx.stroke()
    }
  }, [notes, duration, currentTime])

  useEffect(() => {
    if (!containerRef.current || currentTime === null || currentTime === undefined) return

    const container = containerRef.current
    const indicatorX = currentTime * PIXELS_PER_SECOND
    
    const containerWidth = container.clientWidth
    const scrollLeft = container.scrollLeft
    
    const visibleStart = scrollLeft
    const visibleEnd = scrollLeft + containerWidth
    
    const padding = containerWidth * 0.2
    
    // Scroll if indicator is outside visible area (with padding)
    if (indicatorX < visibleStart + padding) {
      container.scrollLeft = Math.max(0, indicatorX - padding)
    } else if (indicatorX > visibleEnd - padding) {
      container.scrollLeft = indicatorX + padding - containerWidth
    }
  }, [currentTime])

  if (!midiData) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        color: '#666'
      }}>
        Upload a MIDI file to view the piano roll
      </div>
    )
  }

  if (parseError) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        color: '#ff4444',
        flexDirection: 'column',
        gap: '10px',
        padding: '20px'
      }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Error parsing MIDI file</div>
        <div style={{ fontSize: '14px', color: '#999' }}>{parseError}</div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          Please try a different MIDI file
        </div>
      </div>
    )
  }

  const canvasWidth = Math.max(800, duration * PIXELS_PER_SECOND + 100)
  const canvasHeight = TOTAL_KEYS * NOTE_HEIGHT

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%', 
        height: '100%', 
        overflow: 'auto',
        backgroundColor: '#1a1a1a',
        position: 'relative'
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{ display: 'block' }}
        onClick={(e) => {
          if (onNoteClick) {
            const rect = canvasRef.current.getBoundingClientRect()
            const x = e.clientX - rect.left
            const time = x / PIXELS_PER_SECOND
            onNoteClick(time)
          }
        }}
      />
      {notes.length === 0 && duration > 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#999',
          fontSize: '14px',
          pointerEvents: 'none'
        }}>
          MIDI file loaded but contains no notes
        </div>
      )}
    </div>
  )
}

export default PianoRoll

