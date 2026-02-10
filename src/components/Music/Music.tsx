import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { FaCaretDown, FaChevronLeft, FaChevronRight, FaVolumeHigh, FaVolumeXmark, FaPlay, FaPause } from 'react-icons/fa6';
import droughtnought from '../../data/tracks/2024 - SWORDSMEN - DROUGHTNOUGHT .wav';
import somethingsComing from '../../data/tracks/THE BUTCHER - SOMETHINGS COMING V1.1.1.wav';
import './Music.scss';

const BASS_MAX = 250;
const MID_MAX = 2000;

const tracks = [
  {
    title: 'SWORDSMEN - DROUGHTNOUGHT (2024)',
    url: droughtnought,
  },
  {
    title: 'THE BUTCHER - SOMETHINGS COMING V1.1.1',
    url: somethingsComing,
  },
];

const Music = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualContainerRef = useRef<HTMLDivElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const trackMenuRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Store previous frame values for smoothing (Linear Interpolation)
  const prevValuesRef = useRef<{
    mid: number[];
    treble: number[];
    bass: number[];
  }>({
    mid: new Array(72).fill(0),
    treble: new Array(72).fill(0),
    bass: new Array(72).fill(0),
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isTrackMenuOpen, setIsTrackMenuOpen] = useState(false);

  const scrubProgress = useMemo(() => {
    if (!duration) return 0;
    return Math.min(100, Math.max(0, (currentTime / duration) * 100));
  }, [currentTime, duration]);

  const volumeProgress = useMemo(() => {
    const value = isMuted ? 0 : volume;
    return Math.min(100, Math.max(0, value * 100));
  }, [isMuted, volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (!isTrackMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      if (trackMenuRef.current && !trackMenuRef.current.contains(target)) {
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

  const setupAudio = () => {
    if (!audioRef.current || audioContextRef.current) return;

    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;

    const source = context.createMediaElementSource(audioRef.current);
    source.connect(analyser);
    analyser.connect(context.destination);

    const bufferLength = analyser.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufferLength);
    audioContextRef.current = context;
    analyserRef.current = analyser;
    sourceRef.current = source;
  };

  const getPrimaryRgb = () => {
    const primary = getComputedStyle(document.documentElement)
      .getPropertyValue('--primary')
      .trim();

    if (primary.startsWith('#')) {
      const hex = primary.replace('#', '');
      const value = hex.length === 3
        ? hex.split('').map(char => char + char).join('')
        : hex;
      const num = parseInt(value, 16);
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return { r, g, b };
    }

    if (primary.startsWith('rgb')) {
      const values = primary
        .replace(/rgba?\(|\)/g, '')
        .split(',')
        .map(value => parseFloat(value.trim()));
      return { r: values[0] || 255, g: values[1] || 107, b: values[2] || 53 };
    }

    return { r: 255, g: 107, b: 53 };
  };

  const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
  };

  const getGradientColor = (
    c1: { r: number, g: number, b: number },
    c2: { r: number, g: number, b: number },
    mix: number
  ) => {
    const r = Math.round(c1.r + (c2.r - c1.r) * mix);
    const g = Math.round(c1.g + (c2.g - c1.g) * mix);
    const b = Math.round(c1.b + (c2.b - c1.b) * mix);
    return { r, g, b };
  };

  // Brighter, punchier colors
  const CYAN = { r: 6, g: 236, b: 230 }; // Neon Cyan
  const VIOLET = { r: 180, g: 40, b: 255 }; // Electric Violet
  const MAGENTA = { r: 255, g: 0, b: 213 }; // Hot Pink/Magenta
  const HOT_PINK = { r: 255, g: 20, b: 147 }; // Hot Pink for max volume
  const ORANGE = { r: 255, g: 107, b: 53 }; // Orange base
  const IDLE_LINE_ALPHA = 0.35;

  const drawFrame = (): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    const { width: cssWidth, height: cssHeight } = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.floor(cssWidth * dpr)) {
      canvas.width = Math.floor(cssWidth * dpr);
      canvas.height = Math.floor(cssHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const { r, g, b } = getPrimaryRgb();

    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const centerY = cssHeight / 2;
    // Draw center line
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.35)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(cssWidth, centerY);
    ctx.stroke();

    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    if (!analyser || !dataArray) return true;

    // Check if we should be decaying (paused)
    if (audioRef.current?.paused) {
      // Force zero input to allow smooth decay
      dataArray.fill(0);
    } else {
      // TS lib typing can be overly strict about the underlying ArrayBuffer type here.
      analyser.getByteFrequencyData(dataArray as unknown as Uint8Array<ArrayBuffer>);
    }

    const barCount = 72;
    const barWidth = cssWidth / barCount;
    const bufferLength = analyser.frequencyBinCount;
    const nyquist = (audioContextRef.current?.sampleRate || 44100) / 2;

    // 1. Process Bass (Wave) - Linear scatter is fine here
    const bassBins: number[] = [];
    for (let bin = 0; bin < bufferLength; bin++) {
      const frequency = (bin / bufferLength) * nyquist;
      if (frequency <= BASS_MAX) {
        bassBins.push(dataArray[bin] / 255);
      } else {
        // Optimization: Once we pass BASS_MAX, we don't need to loop further for bass
        break; 
      }
    }

    // 2. Process Mids/Highs (Bars) - Gather approach to ensure no gaps
    const TREBLE_MAX_FREQ = 16000; // Cap visibility at 16kHz so bars reach the end
    const startBin = Math.max(1, Math.floor((BASS_MAX / nyquist) * bufferLength));
    const endFreq = Math.min(nyquist, TREBLE_MAX_FREQ);
    const endBin = Math.floor((endFreq / nyquist) * bufferLength);
    
    const minLog = Math.log(startBin);
    const maxLog = Math.log(endBin);
    const logRange = maxLog - minLog;

    const currentMids = new Array(barCount).fill(0);
    const currentTreble = new Array(barCount).fill(0);

    for (let i = 0; i < barCount; i++) {
      // Determine frequency range for this bar using log scale
      const ratioStart = i / barCount;
      const ratioEnd = (i + 1) / barCount;
      
      const logBinStart = minLog + ratioStart * logRange;
      const logBinEnd = minLog + ratioEnd * logRange;
      
      let binStart = Math.exp(logBinStart);
      let binEnd = Math.exp(logBinEnd);
      
      // Ensure we sample at least one bin
      if (binEnd - binStart < 1) {
        binEnd = binStart + 1;
      }
      
      let sum = 0;
      let count = 0;
      
      const startI = Math.floor(binStart);
      const endI = Math.ceil(binEnd);

      for (let j = startI; j < endI; j++) {
        if (j < bufferLength && j >= startBin) {
          sum += dataArray[j] / 255;
          count++;
        }
      }

      const amplitude = count > 0 ? sum / count : 0;
      
      // Determine if this bar represents Mid or Treble frequency
      const centerBin = (binStart + binEnd) / 2;
      const centerFreq = (centerBin / bufferLength) * nyquist;

      if (centerFreq <= MID_MAX) {
        currentMids[i] = amplitude;
      } else {
        currentTreble[i] = amplitude;
      }
    }

    // Smoothing factor (Dynamic: Slower decay when paused for better visuals)
    const isPaused = !!audioRef.current?.paused;
    const SMOOTHING = isPaused ? 0.05 : 0.2;

    // Draw Bass Wave
    if (bassBins.length) {
      const bassHeights = new Array<number>(barCount).fill(0);
      let totalBass = 0;
      for (let i = 0; i < barCount; i += 1) {
        const position = (i / (barCount - 1)) * (bassBins.length - 1);
        const lower = Math.floor(position);
        const upper = Math.min(bassBins.length - 1, lower + 1);
        const blend = position - lower;
        const targetHeight = bassBins[lower] * (1 - blend) + bassBins[upper] * blend;
        
        bassHeights[i] = lerp(prevValuesRef.current.bass[i] || 0, targetHeight, SMOOTHING * (isPaused ? 2 : 2)); 
        prevValuesRef.current.bass[i] = bassHeights[i];
        totalBass += bassHeights[i];
      }

      const avgBass = totalBass / barCount;
      // If paused, drop opacity as amplitude drops to avoid a "hard line".
      // Let it fade all the way out; the idle line is separate.
      const fadeFactor = isPaused ? Math.min(1, avgBass * 10) : 1;
      
      const lineColor = `rgba(${ORANGE.r}, ${ORANGE.g}, ${ORANGE.b}, ${0.9 * fadeFactor})`;
      const fillColor = `rgba(${ORANGE.r}, ${ORANGE.g}, ${ORANGE.b}, ${0.25 * fadeFactor})`;

      ctx.lineWidth = 2;
      ctx.shadowColor = `rgba(${ORANGE.r}, ${ORANGE.g}, ${ORANGE.b}, ${0.35 * fadeFactor})`;
      ctx.shadowBlur = 6;

      ctx.beginPath();
      for (let i = 0; i < barCount; i += 1) {
        const x = i * barWidth + barWidth * 0.5;
        const y = centerY + bassHeights[i] * (cssHeight * 0.28);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle = lineColor;
      ctx.stroke();

      ctx.lineTo(cssWidth, centerY);
      ctx.lineTo(0, centerY);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();

      ctx.shadowBlur = 0;
    }

    // Draw Bars (Mids + Highs)
    for (let i = 0; i < barCount; i += 1) {
      const x = i * barWidth;
      
      // Interpolate
      const mid = lerp(prevValuesRef.current.mid[i] || 0, currentMids[i], SMOOTHING);
      const treble = lerp(prevValuesRef.current.treble[i] || 0, currentTreble[i], SMOOTHING);
      
      prevValuesRef.current.mid[i] = mid;
      prevValuesRef.current.treble[i] = treble;

      // Dynamic color mixing
      const intensityMid = Math.min(1, mid * 2);
      const mRgb = getGradientColor(CYAN, VIOLET, intensityMid);
      ctx.fillStyle = `rgba(${mRgb.r}, ${mRgb.g}, ${mRgb.b}, 0.8)`; // Increased opacity

      const midHeight = mid * (cssHeight * 0.32);
      // Ensure minimal height for visibility if valid
      if (midHeight > 0.5) {
          ctx.fillRect(x + barWidth * 0.1, centerY - midHeight, barWidth * 0.8, midHeight);
      }

      const intensityTreble = Math.min(1, treble * 2);
      // Use Violet -> Magenta for Highs to distinguish them
      const tRgb = getGradientColor(VIOLET, MAGENTA, intensityTreble);
      ctx.fillStyle = `rgba(${tRgb.r}, ${tRgb.g}, ${tRgb.b}, 0.8)`; 
      
      const trebleHeight = treble * (cssHeight * 0.22);
      
      // Split the mid and high: Lift highs slightly off the mid/center
      // Only apply gap if we are actually stacking on top of a mid bar (which shouldn't happen often in this split logic)
      const gap = midHeight > 1 ? 3 : 0;
      
      if (trebleHeight > 0.5) {
        // midHeight will be ~0 for pure treble bars, so they will sit on the center line
        ctx.fillRect(x + barWidth * 0.1, centerY - midHeight - gap - trebleHeight, barWidth * 0.8, trebleHeight);
      }
    }

    if (waveformRef.current) {
      const { mid, treble, bass } = prevValuesRef.current;
      let midSum = 0;
      let trebleSum = 0;
      let bassSum = 0;
      
      for(let k = 0; k < barCount; k++) {
          midSum += mid[k];
          trebleSum += treble[k];
          bassSum += bass[k];
      }
      
      const midAvg = midSum / barCount;
      const trebleAvg = trebleSum / barCount;
      const bassAvg = bassSum / barCount;

      // Calculate reactive shadow colors and sizes
      const midIntensity = Math.min(midAvg * 3.0, 1);
      const trebleIntensity = Math.min(trebleAvg * 3.0, 1);
      const bassIntensity = Math.min(bassAvg * 2.5, 1);

      // Top Left: Teal (Quiet) -> Purple (Loud)
      const tlColor = getGradientColor(CYAN, VIOLET, midIntensity);
      
      // Top Right: Magenta (Quiet) -> Hot Pink (Loud)
      const trColor = getGradientColor(MAGENTA, HOT_PINK, trebleIntensity);

      // Bottom: Orange size based on bass
      const bottomSpread = 10 + (bassIntensity * 30); // Base 10px, adds up to 30px
      const bottomOpacity = 0.15 + (bassIntensity * 0.4); 

      // Apply Box Shadow directly
      waveformRef.current.style.boxShadow = `
        -10px -10px 30px rgba(${tlColor.r}, ${tlColor.g}, ${tlColor.b}, ${0.1 + midIntensity * 0.3}),
        10px -10px 30px rgba(${trColor.r}, ${trColor.g}, ${trColor.b}, ${0.1 + trebleIntensity * 0.3}),
        0px 15px ${bottomSpread}px rgba(${ORANGE.r}, ${ORANGE.g}, ${ORANGE.b}, ${bottomOpacity})
      `;

      // If paused and effectively silent (decayed), stop the loop
      if (audioRef.current?.paused && midAvg < 0.001 && trebleAvg < 0.001 && bassAvg < 0.001) {
        return false;
      }
    }

    return true;
  };

  const clearVisuals = () => {
    // 1. Reset Smooth Buffers
    prevValuesRef.current = {
      mid: new Array(72).fill(0),
      treble: new Array(72).fill(0),
      bass: new Array(72).fill(0),
    };

    // 2. Clear Canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const { width: cssWidth, height: cssHeight } = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        if (canvas.width !== Math.floor(cssWidth * dpr)) {
          canvas.width = Math.floor(cssWidth * dpr);
          canvas.height = Math.floor(cssHeight * dpr);
        }

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssWidth, cssHeight);

        // Draw just the idle line (match the pre-play center line)
        const centerY = cssHeight / 2;
        const { r, g, b } = getPrimaryRgb();
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${IDLE_LINE_ALPHA})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(cssWidth, centerY);
        ctx.stroke();
      }
    }

    // 3. Reset Drop Shadows to "Idle" state
    if (waveformRef.current) {
       // Match the "idle" values implied by the live shadow formula at zero intensity
       // (avoids a visible brightness jump when the decay loop stops).
       waveformRef.current.style.boxShadow = `
        -10px -10px 30px rgba(${CYAN.r}, ${CYAN.g}, ${CYAN.b}, 0.1),
        10px -10px 30px rgba(${MAGENTA.r}, ${MAGENTA.g}, ${MAGENTA.b}, 0.1),
        0px 15px 10px rgba(${ORANGE.r}, ${ORANGE.g}, ${ORANGE.b}, 0.15)
      `;
    }
  };

  const draw = () => {
    const keepDrawing = drawFrame();
    if (keepDrawing) {
      animationRef.current = requestAnimationFrame(draw);
    } else {
      animationRef.current = null;
      clearVisuals(); // Ensure completely clean state
    }
  };

  const stopDrawing = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    clearVisuals();
  };

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    setupAudio();
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (audio.paused) {
      setIsPlaying(true);
      audio.play().catch(() => setIsPlaying(false));
      draw();
    } else {
      setIsPlaying(false);
      audio.pause();
      // Decay naturally
    }
  };

  const handleSeek = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = Number(event.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);

    setupAudio();
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (!isPlaying) {
      // Do nothing visually when seeking while paused, to avoid "decaying bars" effect
      // The user requested: "clear when the track is paused"
    }
  };

  const handleVolumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    if (!time || Number.isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const handleMetadata = () => setDuration(audio.duration || 0);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const handleEnded = () => {
      setIsPlaying(false);
      // Decay naturally
    };

    audio.addEventListener('loadedmetadata', handleMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    stopDrawing();
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    audio.src = tracks[currentTrackIndex].url;
    audio.load();
    drawFrame();
  }, [currentTrackIndex]);

  useEffect(() => {
    return () => {
      stopDrawing();
      analyserRef.current?.disconnect();
      sourceRef.current?.disconnect();
      audioContextRef.current?.close();
    };
  }, []);

  const goToNext = () => {
    setCurrentTrackIndex(prev => (prev + 1) % tracks.length);
  };

  const goToPrevious = () => {
    setCurrentTrackIndex(prev => (prev - 1 + tracks.length) % tracks.length);
  };

  const selectTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setIsTrackMenuOpen(false);
  };

  return (
    <section id="music" className="section music" aria-labelledby="music-title">
      <div className="music__grid">
        <div className="music__content">
          <p className="music__eyebrow">Code and Bass</p>
          <h2 id="music-title">Beats Between Builds</h2>
          <p className="music__intro">
            When I’m not building software, I’m probably out raving or digging for new
            tunes. I mix on the Numark NSFX4 (bedroom sets and the occasional private
            party), and these are the sounds I keep coming back to.
          </p>
          <div className="music__tags">
            <span>Drum and Bass</span>
            <span>Techno</span>
            <span>Hardcore</span>
            <span>Garage</span>
            <span>Trance</span>
          </div>
          <div className="music__note">
            Bass hits below, mids and highs above. Use the carousel or the dropdown to
            pick a track — these are some of my favourite tracks and mixtapes.
          </div>
        </div>

        <div className="music__visual" ref={visualContainerRef}>
          <div className="music__player">
            <div className="music__waveform" ref={waveformRef}>
              <button
                type="button"
                className="music__nav music__nav--prev"
                onClick={goToPrevious}
                aria-label="Previous track"
              >
                <FaChevronLeft />
              </button>
              <canvas ref={canvasRef} className="music__canvas" />
              <button
                type="button"
                className="music__nav music__nav--next"
                onClick={goToNext}
                aria-label="Next track"
              >
                <FaChevronRight />
              </button>
            </div>
            <div className="music__controls" ref={trackMenuRef}>
              <button
                type="button"
                className="music__play"
                onClick={togglePlayback}
                aria-pressed={isPlaying}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>
              <div className="music__time">
                <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                <div className="music__trackRow">
                  <span className="music__track" title={tracks[currentTrackIndex].title}>
                    {tracks[currentTrackIndex].title}
                  </span>
                  <button
                    type="button"
                    className="music__trackToggle"
                    onClick={() => setIsTrackMenuOpen(open => !open)}
                    aria-haspopup="menu"
                    aria-expanded={isTrackMenuOpen}
                    aria-label="Choose track"
                  >
                    <FaCaretDown />
                  </button>
                </div>
              </div>
              <div className="music__volume">
                <button
                  type="button"
                  className="music__volume-btn"
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? <FaVolumeXmark /> : <FaVolumeHigh />}
                </button>
                <div className="music__volume-slider">
                  <input
                    className="music__volume-range"
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    aria-label="Volume"
                    style={{ ['--progress' as any]: `${volumeProgress}%` }}
                  />
                </div>
              </div>
              <input
                className="music__scrub"
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                aria-label="Seek track"
                style={{ ['--progress' as any]: `${scrubProgress}%` }}
              />

              {isTrackMenuOpen && (
                <div className="music__trackMenu" role="menu" aria-label="Track list">
                  {tracks.map((track, index) => (
                    <button
                      key={track.title}
                      type="button"
                      role="menuitem"
                      className="music__trackItem"
                      onClick={() => selectTrack(index)}
                      aria-current={index === currentTrackIndex}
                    >
                      {track.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <audio ref={audioRef} preload="metadata" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Music;
