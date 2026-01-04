import { useState, useEffect, useRef } from 'react'
import { Midi } from '@tonejs/midi'
import * as Tone from 'tone'
import PianoRoll from './components/PianoRoll'
import PianoKeyboard from './components/PianoKeyboard'
import PlaybackControls from './components/PlaybackControls'
import { supabase } from './lib/supabase'
import './App.css'

function App() {
  const [midiData, setMidiData] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1.0)
  const [activeNotes, setActiveNotes] = useState([])
  const [clickedKeys, setClickedKeys] = useState([])
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  
  const scheduledNotesRef = useRef([])
  const synthRef = useRef(null)
  const midiRef = useRef(null)
  const animationFrameRef = useRef(null)
  const isPlayingRef = useRef(false)
  const partRef = useRef(null)
  const transportStartTimeRef = useRef(0)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = new Tone.PolySynth(Tone.Synth).toDestination()
    }
    return () => {
      if (partRef.current) {
        partRef.current.stop()
        partRef.current.dispose()
      }
      Tone.Transport.stop()
      Tone.Transport.cancel()
      if (synthRef.current) {
        synthRef.current.dispose()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  useEffect(() => {
    loadUploadedFiles()
  }, [])

  const loadUploadedFiles = async () => {
    if (!supabase) return
    
    try {
      const { data, error } = await supabase
        .from('midi_files')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setUploadedFiles(data || [])
    } catch (error) {
      console.error('Error loading files:', error)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file || !file.name.endsWith('.mid')) {
      alert('Please upload a MIDI file (.mid)')
      return
    }

    setIsLoading(true)
    const arrayBuffer = await file.arrayBuffer()
    
    try {
      const midi = new Midi(arrayBuffer)
      setMidiData(arrayBuffer)
      setDuration(midi.duration)
      setCurrentTime(0)
      
      if (supabase) {
        const fileName = `${Date.now()}_${file.name}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('midi-files')
          .upload(fileName, file, {
            contentType: 'audio/midi'
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('midi-files')
          .getPublicUrl(fileName)

        const { error: dbError } = await supabase
          .from('midi_files')
          .insert({
            name: file.name,
            file_name: fileName,
            file_url: publicUrl,
            duration: midi.duration
          })

        if (dbError) throw dbError

        loadUploadedFiles()
      }
    } catch (error) {
      console.error('Error processing MIDI file:', error)
      alert('Error processing MIDI file: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMidiFile = async (fileData) => {
    setIsLoading(true)
    try {
      if (supabase && fileData.file_url) {
        const response = await fetch(fileData.file_url)
        const arrayBuffer = await response.arrayBuffer()
        const midi = new Midi(arrayBuffer)
        setMidiData(arrayBuffer)
        setDuration(midi.duration)
        setCurrentTime(0)
      }
    } catch (error) {
      console.error('Error loading MIDI file:', error)
      alert('Error loading MIDI file: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteMidiFile = async (fileData, e) => {
    e.stopPropagation()
    
    if (!window.confirm(`Are you sure you want to delete "${fileData.name}"?`)) {
      return
    }

    if (!supabase) {
      alert('Supabase is not configured')
      return
    }

    try {
      const { error: dbError } = await supabase
        .from('midi_files')
        .delete()
        .eq('id', fileData.id)

      if (dbError) {
        console.error('Database delete error:', dbError)
        throw new Error(`Failed to delete from database: ${dbError.message}`)
      }

      const { error: storageError } = await supabase.storage
        .from('midi-files')
        .remove([fileData.file_name])

      if (storageError) {
        console.error('Storage delete error:', storageError)
        console.warn('File deleted from database but storage delete failed:', storageError.message)
      }

      loadUploadedFiles()

      if (midiData) {
        setMidiData(null)
        setDuration(0)
        setCurrentTime(0)
        setActiveNotes([])
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      alert('Error deleting file: ' + (error.message || error))
    }
  }

  const stopPlayback = () => {
    Tone.Transport.stop()
    Tone.Transport.cancel()
    
    if (partRef.current) {
      partRef.current.stop()
      partRef.current.dispose()
      partRef.current = null
    }
    
    if (synthRef.current) {
      synthRef.current.releaseAll()
    }
    
    scheduledNotesRef.current = []
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }

  const startPlayback = async () => {
    if (!midiData || !synthRef.current) return

    try {
      await Tone.start()
      
      stopPlayback()

      const midi = new Midi(midiData)
      midiRef.current = midi
      const startOffset = currentTime

      scheduledNotesRef.current = []
      
      Tone.Transport.stop()
      Tone.Transport.cancel()
      Tone.Transport.bpm.value = 120 * playbackRate

      const notesToSchedule = []
      midi.tracks.forEach(track => {
        track.notes.forEach(note => {
          if (note.time >= startOffset) {
            const adjustedTime = (note.time - startOffset) / playbackRate
            notesToSchedule.push({
              time: adjustedTime,
              midi: note.midi,
              duration: note.duration / playbackRate,
              velocity: note.velocity
            })
          }
        })
      })

      partRef.current = new Tone.Part((time, note) => {
        const freq = Tone.Frequency(note.midi, 'midi').toFrequency()
        synthRef.current.triggerAttackRelease(freq, note.duration, time, note.velocity)
      }, notesToSchedule)

      partRef.current.start(0)
      Tone.Transport.start()
      transportStartTimeRef.current = Tone.Transport.seconds

      setIsPlaying(true)
      isPlayingRef.current = true
      
      const updateTime = () => {
        if (!isPlayingRef.current) {
          animationFrameRef.current = null
          return
        }
        
        const transportElapsed = (Tone.Transport.seconds - transportStartTimeRef.current) * playbackRate
        const elapsed = startOffset + transportElapsed
        const clampedTime = Math.min(elapsed, duration)
        setCurrentTime(clampedTime)
        
        if (midiRef.current) {
          const currentActiveNotes = []
          midiRef.current.tracks.forEach(track => {
            track.notes.forEach(note => {
              if (clampedTime >= note.time && clampedTime <= note.time + note.duration) {
                currentActiveNotes.push(note.midi)
              }
            })
          })
          setActiveNotes(currentActiveNotes)
        }
        
        if (clampedTime < duration && isPlayingRef.current) {
          animationFrameRef.current = requestAnimationFrame(updateTime)
        } else {
          setIsPlaying(false)
          isPlayingRef.current = false
          setCurrentTime(0)
          setActiveNotes([])
          stopPlayback()
          animationFrameRef.current = null
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(updateTime)
    } catch (error) {
      console.error('Error starting playback:', error)
      setIsPlaying(false)
    }
  }

  const handlePlay = async () => {
    if (currentTime >= duration) {
      setCurrentTime(0)
    }
    await startPlayback()
  }

  const handlePause = () => {
    stopPlayback()
    setIsPlaying(false)
    isPlayingRef.current = false
  }

  const handleSeek = (time) => {
    const newTime = Math.max(0, Math.min(time, duration))
    setCurrentTime(newTime)
    if (isPlaying) {
      stopPlayback()
      startPlayback()
    }
  }

  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate)
    if (isPlaying) {
      stopPlayback()
      startPlayback()
    }
  }

  const handleStop = () => {
    stopPlayback()
    setIsPlaying(false)
    isPlayingRef.current = false
    setCurrentTime(0)
    setActiveNotes([])
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Piano Roll</h1>
        <div className="header-actions">
          <label className="upload-button">
            <input
              type="file"
              accept=".mid"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            Upload MIDI
          </label>
        </div>
      </header>

      <div className="app-main">
        {uploadedFiles.length > 0 && (
          <div className="file-list">
            <h3>Uploaded Files</h3>
            <ul>
              {uploadedFiles.map(file => (
                <li
                  key={file.id}
                  onClick={() => loadMidiFile(file)}
                  className="file-list-item"
                >
                  <span className="file-name">{file.name}</span>
                  <button
                    onClick={(e) => deleteMidiFile(file, e)}
                    className="delete-button"
                    title="Delete file"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="main-content">
          {isLoading && (
            <div className="loading">Loading...</div>
          )}
          
          <div className="piano-roll-container">
            <PianoRoll 
              midiData={midiData}
              currentTime={currentTime}
            />
          </div>

          <PianoKeyboard 
            activeNotes={[...activeNotes, ...clickedKeys]}
            onKeyClick={(midiNote) => {
              setClickedKeys([midiNote])
              setTimeout(() => {
                setClickedKeys([])
              }, 200)
            }}
          />

          <PlaybackControls
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onPlay={handlePlay}
            onPause={handlePause}
            onStop={handleStop}
            onSeek={handleSeek}
            playbackRate={playbackRate}
            onPlaybackRateChange={handlePlaybackRateChange}
          />
        </div>
      </div>
    </div>
  )
}

export default App
