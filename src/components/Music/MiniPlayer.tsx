import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  FaCaretUp,
  FaChevronLeft,
  FaChevronRight,
  FaPause,
  FaPlay,
  FaVolumeHigh,
  FaVolumeXmark,
  FaXmark,
} from 'react-icons/fa6';
import { useMusicPlayer } from './MusicProvider';
import './MiniPlayer.scss';

const MiniPlayer = () => {
  const location = useLocation();
  const {
    tracks,
    hasSession,
    isPlaying,
    duration,
    currentTime,
    currentTrackIndex,
    volume,
    isMuted,
    togglePlayback,
    stopPlayback,
    handleSeek,
    handleVolumeChange,
    toggleMute,
    goToNext,
    goToPrevious,
    selectTrack,
  } = useMusicPlayer();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isTrackMenuOpen, setIsTrackMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const isHome = location.pathname === '/';
  const shouldShow = !isHome && hasSession;

  const scrubProgress = useMemo(() => {
    if (!duration) return 0;
    return Math.min(100, Math.max(0, (currentTime / duration) * 100));
  }, [currentTime, duration]);

  const volumeProgress = useMemo(() => {
    const value = isMuted ? 0 : volume;
    return Math.min(100, Math.max(0, value * 100));
  }, [isMuted, volume]);

  useEffect(() => {
    if (!isTrackMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsTrackMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsTrackMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTrackMenuOpen]);

  const formatTime = (time: number) => {
    if (!time || Number.isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSelectTrack = (index: number) => {
    selectTrack(index);
    setIsTrackMenuOpen(false);
  };

  if (!shouldShow) return null;

  return (
    <aside
      className={`mini-player${isCollapsed ? ' mini-player--collapsed' : ''}`}
      aria-label="Music player"
      aria-live="polite"
    >
      <button
        type="button"
        className="mini-player__dock"
        onClick={() => setIsCollapsed(collapsed => !collapsed)}
        aria-label={isCollapsed ? 'Show music player' : 'Hide music player'}
        aria-pressed={isCollapsed}
      />
      <div className="mini-player__header">
        <div className="mini-player__titleRow" ref={menuRef}>
          <span className="mini-player__title" title={tracks[currentTrackIndex].title}>
            {tracks[currentTrackIndex].title}
          </span>
          <button
            type="button"
            className="mini-player__trackToggle"
            onClick={() => setIsTrackMenuOpen(open => !open)}
            aria-haspopup="menu"
            aria-expanded={isTrackMenuOpen}
            aria-label="Choose track"
          >
            <FaCaretUp />
          </button>

          {isTrackMenuOpen && (
            <div className="mini-player__menu" role="menu" aria-label="Track list">
              {tracks.map((track, index) => (
                <button
                  key={track.title}
                  type="button"
                  role="menuitem"
                  className="mini-player__menuItem"
                  onClick={() => handleSelectTrack(index)}
                  aria-current={index === currentTrackIndex}
                >
                  {track.title}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          className="mini-player__hide"
          onClick={() => {
            stopPlayback();
            setIsCollapsed(true);
          }}
          aria-label="Hide music player"
        >
          <FaXmark />
        </button>
      </div>
      <div className="mini-player__controls">
        <button
          type="button"
          className="mini-player__button"
          onClick={goToPrevious}
          aria-label="Previous track"
        >
          <FaChevronLeft />
        </button>
        <button
          type="button"
          className="mini-player__button mini-player__button--primary"
          onClick={togglePlayback}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          aria-pressed={isPlaying}
        >
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
        <button
          type="button"
          className="mini-player__button"
          onClick={goToNext}
          aria-label="Next track"
        >
          <FaChevronRight />
        </button>
      </div>
      <div className="mini-player__meta">
        <span className="mini-player__time">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <div className="mini-player__volume">
          <button
            type="button"
            className="mini-player__volumeBtn"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? <FaVolumeXmark /> : <FaVolumeHigh />}
          </button>
          <input
            className="mini-player__volumeRange"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            aria-label="Volume"
            style={{ ['--progress' as never]: `${volumeProgress}%` }}
          />
        </div>
      </div>
      <input
        className="mini-player__scrub"
        type="range"
        min={0}
        max={duration || 0}
        value={currentTime}
        onChange={handleSeek}
        aria-label="Seek track"
        style={{ ['--progress' as never]: `${scrubProgress}%` }}
      />
    </aside>
  );
};

export default MiniPlayer;
