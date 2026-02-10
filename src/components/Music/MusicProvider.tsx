import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type RefObject,
  type ReactNode,
} from 'react';
import droughtnought from '../../data/tracks/2024 - SWORDSMEN - DROUGHTNOUGHT .wav';
import somethingsComing from '../../data/tracks/THE BUTCHER - SOMETHINGS COMING V1.1.1.wav';

type Track = {
  title: string;
  url: string;
};

const tracks: Track[] = [
  {
    title: 'SWORDSMEN - DROUGHTNOUGHT (2024)',
    url: droughtnought,
  },
  {
    title: 'THE BUTCHER - SOMETHINGS COMING V1.1.1',
    url: somethingsComing,
  },
];

const STORAGE_KEY = 'portfolio-music-player';

type StoredPlayerState = {
  volume?: number;
  isMuted?: boolean;
  currentTrackIndex?: number;
  currentTime?: number;
  wasPlaying?: boolean;
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

const readStoredState = (): StoredPlayerState => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredPlayerState) : {};
  } catch {
    return {};
  }
};

type MusicContextValue = {
  tracks: Track[];
  audioRef: RefObject<HTMLAudioElement | null>;
  audioContextRef: RefObject<AudioContext | null>;
  analyserRef: RefObject<AnalyserNode | null>;
  dataArrayRef: RefObject<Uint8Array | null>;
  hasSession: boolean;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  currentTrackIndex: number;
  volume: number;
  isMuted: boolean;
  ensureAudioContext: () => void;
  togglePlayback: () => void;
  stopPlayback: () => void;
  handleSeek: (event: ChangeEvent<HTMLInputElement>) => void;
  handleVolumeChange: (event: ChangeEvent<HTMLInputElement>) => void;
  toggleMute: () => void;
  goToNext: () => void;
  goToPrevious: () => void;
  selectTrack: (index: number) => void;
};

const MusicContext = createContext<MusicContextValue | undefined>(undefined);

type MusicProviderProps = {
  children: ReactNode;
};

export const MusicProvider = ({ children }: MusicProviderProps) => {
  const storedStateRef = useRef<StoredPlayerState>(readStoredState());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const resumeTimeRef = useRef<number | null>(null);
  const resumeOnUserRef = useRef(false);
  const autoPlayNextRef = useRef(false);
  const hasHydratedRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasSession, setHasSession] = useState(() => {
    const stored = storedStateRef.current;
    return !!stored.wasPlaying || (typeof stored.currentTime === 'number' && stored.currentTime > 0);
  });
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(() => {
    const stored = storedStateRef.current;
    if (typeof stored.currentTime === 'number' && stored.currentTime > 0) {
      resumeTimeRef.current = stored.currentTime;
      return stored.currentTime;
    }
    return 0;
  });
  const [currentTrackIndex, setCurrentTrackIndex] = useState(() => {
    const stored = storedStateRef.current;
    if (
      typeof stored.currentTrackIndex === 'number' &&
      stored.currentTrackIndex >= 0 &&
      stored.currentTrackIndex < tracks.length
    ) {
      return stored.currentTrackIndex;
    }
    return 0;
  });
  const [volume, setVolume] = useState(() => {
    const stored = storedStateRef.current;
    if (typeof stored.volume === 'number' && !Number.isNaN(stored.volume)) {
      return clamp(stored.volume, 0, 1);
    }
    return 1;
  });
  const [isMuted, setIsMuted] = useState(() => {
    const stored = storedStateRef.current;
    return typeof stored.isMuted === 'boolean' ? stored.isMuted : false;
  });

  if (storedStateRef.current.wasPlaying) {
    resumeOnUserRef.current = true;
  }

  const ensureAudioContext = useCallback(() => {
    if (!audioRef.current || audioContextRef.current) return;

    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;

    const source = context.createMediaElementSource(audioRef.current);
    source.connect(analyser);
    analyser.connect(context.destination);

    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    audioContextRef.current = context;
    analyserRef.current = analyser;
    sourceRef.current = source;
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const handleMetadata = () => {
      setDuration(audio.duration || 0);
      if (resumeTimeRef.current !== null) {
        const targetTime = Math.min(resumeTimeRef.current, audio.duration || resumeTimeRef.current);
        audio.currentTime = targetTime;
        setCurrentTime(targetTime);
        resumeTimeRef.current = null;
      }
    };
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', handleMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('loadedmetadata', handleMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    audio.src = tracks[currentTrackIndex].url;
    audio.load();

    if (autoPlayNextRef.current || resumeOnUserRef.current) {
      ensureAudioContext();
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }

      audio.play().then(() => {
        resumeOnUserRef.current = false;
        autoPlayNextRef.current = false;
      }).catch(() => {
        // Autoplay may be blocked; wait for a user gesture.
      });
    }
  }, [currentTrackIndex, ensureAudioContext]);

  useEffect(() => {
    hasHydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!resumeOnUserRef.current) return;

    const handleResume = () => {
      resumeOnUserRef.current = false;
      const audio = audioRef.current;
      if (!audio || !audio.paused) return;

      ensureAudioContext();
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }

      audio.play().catch(() => {});
    };

    window.addEventListener('pointerdown', handleResume, { once: true });
    window.addEventListener('keydown', handleResume, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleResume);
      window.removeEventListener('keydown', handleResume);
    };
  }, [ensureAudioContext]);

  useEffect(() => {
    if (!hasHydratedRef.current) return;
    const payload: StoredPlayerState = {
      volume,
      isMuted,
      currentTrackIndex,
      currentTime,
      wasPlaying: isPlaying,
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage write errors.
    }
  }, [volume, isMuted, currentTrackIndex, currentTime, isPlaying]);

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    ensureAudioContext();
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (audio.paused) {
      setHasSession(true);
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [ensureAudioContext]);

  const stopPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
    setHasSession(false);
    resumeTimeRef.current = null;
    resumeOnUserRef.current = false;
    autoPlayNextRef.current = false;
  }, []);

  const handleSeek = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!audioRef.current) return;
      setHasSession(true);
      const time = Number(event.target.value);
      audioRef.current.currentTime = time;
      setCurrentTime(time);

      ensureAudioContext();
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
    },
    [ensureAudioContext]
  );

  const handleVolumeChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const goToNext = useCallback(() => {
    autoPlayNextRef.current = isPlaying || resumeOnUserRef.current;
    setHasSession(true);
    setCurrentTrackIndex(prev => (prev + 1) % tracks.length);
  }, [isPlaying]);

  const goToPrevious = useCallback(() => {
    autoPlayNextRef.current = isPlaying || resumeOnUserRef.current;
    setHasSession(true);
    setCurrentTrackIndex(prev => (prev - 1 + tracks.length) % tracks.length);
  }, [isPlaying]);

  const selectTrack = useCallback((index: number) => {
    autoPlayNextRef.current = isPlaying || resumeOnUserRef.current;
    setHasSession(true);
    setCurrentTrackIndex(index);
  }, [isPlaying]);

  const value = useMemo(
    () => ({
      tracks,
      audioRef,
      audioContextRef,
      analyserRef,
      dataArrayRef,
      hasSession,
      isPlaying,
      duration,
      currentTime,
      currentTrackIndex,
      volume,
      isMuted,
      ensureAudioContext,
      togglePlayback,
      stopPlayback,
      handleSeek,
      handleVolumeChange,
      toggleMute,
      goToNext,
      goToPrevious,
      selectTrack,
    }),
    [
      hasSession,
      isPlaying,
      duration,
      currentTime,
      currentTrackIndex,
      volume,
      isMuted,
      ensureAudioContext,
      togglePlayback,
      stopPlayback,
      handleSeek,
      handleVolumeChange,
      toggleMute,
      goToNext,
      goToPrevious,
      selectTrack,
    ]
  );

  return (
    <MusicContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" />
    </MusicContext.Provider>
  );
};

export const useMusicPlayer = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within MusicProvider');
  }
  return context;
};
