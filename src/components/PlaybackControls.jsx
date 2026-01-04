function PlaybackControls({ 
  isPlaying, 
  currentTime, 
  duration, 
  onPlay, 
  onPause, 
  onStop,
  onSeek,
  playbackRate,
  onPlaybackRateChange
}) {

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleProgressClick = (e) => {
    if (!duration || !onSeek) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newTime = percentage * duration
    onSeek(newTime)
  }

  const handleRateChange = (delta) => {
    if (onPlaybackRateChange) {
      const newRate = Math.max(0.25, Math.min(2.0, playbackRate + delta))
      onPlaybackRateChange(newRate)
    }
  }

  return (
    <div style={{
      backgroundColor: '#14b8a6',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      color: 'white'
    }}>
      {onStop && (
        <button
          onClick={onStop}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '18px'
          }}
        >
          ⏹
        </button>
      )}
      
      <button
        onClick={() => isPlaying ? onPause() : onPlay()}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '5px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '20px'
        }}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <div
        onClick={handleProgressClick}
        style={{
          flex: 1,
          height: '6px',
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '3px',
          cursor: 'pointer',
          position: 'relative',
          margin: '0 10px'
        }}
      >
        <div
          style={{
            width: `${duration ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0}%`,
            height: '100%',
            backgroundColor: 'white',
            borderRadius: '3px'
          }}
        />
      </div>

      <div style={{ minWidth: '80px', fontSize: '14px' }}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => handleRateChange(-0.25)}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            color: 'white',
            width: '24px',
            height: '24px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          −
        </button>
        <span style={{ minWidth: '40px', textAlign: 'center', fontSize: '14px' }}>
          {playbackRate}x
        </span>
        <button
          onClick={() => handleRateChange(0.25)}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            color: 'white',
            width: '24px',
            height: '24px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}

export default PlaybackControls

