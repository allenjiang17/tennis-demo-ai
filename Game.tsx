
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AiProfile, CourtSurface, GameStatus, ShotQuality, GameState, Loadout, PlayerStats, ShopItem } from './types';
import { PHYSICS, MESSAGES } from './constants';
import Court from './components/Court';

const AI_COURT_BOUNDS = { MIN_X: -10, MAX_X: 110, MIN_Y: -18, MAX_Y: 90 };
const SERVE_BASE_DURATION = 1000;
const SHOT_BASE_DURATION = 1100;
const DROP_SHOT_BASE_DURATION = 2000;
const VOLLEY_BASE_DURATION = 500;
const PRE_BOUNCE_BEZIER = { x1: 0.18, y1: 0.225, x2: 0.7, y2: 0.85 };
const PRE_BOUNCE_TIMING = `cubic-bezier(${PRE_BOUNCE_BEZIER.x1}, ${PRE_BOUNCE_BEZIER.y1}, ${PRE_BOUNCE_BEZIER.x2}, ${PRE_BOUNCE_BEZIER.y2})`;
const POST_BOUNCE_TIMING = 'linear';
const GROUND_NEUTRAL_ANGLE_DEG = 15;
const VOLLEY_NEUTRAL_ANGLE_DEG = 20;
const cubicBezierEase = (t: number, x1: number, y1: number, x2: number, y2: number) => {
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const sampleCurve = (t0: number, a: number, b: number) => {
    const inv = 1 - t0;
    return 3 * inv * inv * t0 * a + 3 * inv * t0 * t0 * b + t0 * t0 * t0;
  };
  const sampleCurveDerivative = (t0: number, a: number, b: number) => {
    const inv = 1 - t0;
    return 3 * inv * inv * a + 6 * inv * t0 * (b - a) + 3 * t0 * t0 * (1 - b);
  };
  let param = clamp(t);
  for (let i = 0; i < 5; i += 1) {
    const x = sampleCurve(param, x1, x2) - t;
    const d = sampleCurveDerivative(param, x1, x2);
    if (Math.abs(x) < 1e-4 || d === 0) break;
    param = clamp(param - x / d);
  }
  return sampleCurve(param, y1, y2);
};
const SERVE_TARGET_Y = { top: 60, bottom: 120 };
const SERVE_NET_Y = 90;
const SERVE_JITTER_MAX = 30;
const SERVE_BOX_Y = { topMin: 45, topMax: 90, bottomMin: 90, bottomMax: 135 };
const SERVE_TARGET_X = {
  deuce: { wide: 10, middle: 45 },
  ad: { wide: 85, middle: 55 },
};
const VOLLEY_TARGET_Y = 71;
const AI_VOLLEY_ZONE_Y = 60;

type GameProps = {
  playerStats: PlayerStats;
  aiStats: PlayerStats;
  aiProfile: AiProfile;
  playerLoadout: Loadout;
  aiLoadout: Loadout;
  shopItems: ShopItem[];
  surface: CourtSurface;
  opponentName?: string;
  playerPortrait?: string;
  opponentPortrait?: string;
  playerName?: string;
  playerRank?: number;
  opponentRank?: number;
  tournamentName?: string;
  tournamentRound?: string;
  onExit?: () => void;
  onMatchEnd?: (winner: 'player' | 'opponent') => void;
  tutorial?: {
    instructionPrimary?: React.ReactNode;
    instructionSecondary?: React.ReactNode;
    targets?: Array<{ id: string; x: number; y: number; radius: number }>;
    targetMode?: 'ground' | 'volley' | 'dropshot';
    dropshotZone?: { xMin: number; xMax: number; yMin: number; yMax: number };
    onPlayerServe?: () => void;
    onPlayerHit?: (context: { isVolley: boolean }) => void;
    onTargetHit?: (id: string, isVolley: boolean) => void;
    disableOpeningServeFaults?: boolean;
  };
};

const Game: React.FC<GameProps> = ({ playerStats, aiStats, aiProfile, playerLoadout, aiLoadout, shopItems, surface, opponentName, playerPortrait, opponentPortrait, playerName, playerRank, opponentRank, tournamentName, tournamentRound, onExit, onMatchEnd, tutorial }) => {
  const opponentLabel = opponentName || 'Master AI';
  const playerLabel = playerName?.trim() || 'You';
  const formatRank = (rank?: number) => (typeof rank === 'number' && Number.isFinite(rank) ? `#${rank}` : null);
  const playerRankLabel = formatRank(playerRank);
  const opponentRankLabel = formatRank(opponentRank);
  const [gameState, setGameState] = useState<GameState>({
    player: { score: 0, name: 'Pro' },
    opponent: { score: 0, name: 'Master AI' },
    status: GameStatus.START,
    isPlayerTurn: false,
    lastShotQuality: ShotQuality.NONE,
    difficulty: 1,
  });

  const [ballPos, setBallPos] = useState({ x: 50, y: 20 });
  const [ballHitPos, setBallHitPos] = useState({ x: 50, y: 20 });
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 170 });
  const [aiPos, setAiPos] = useState({ x: 50, y: 8 });
  const currentAiPosRef = useRef(aiPos);
  const [lastStroke, setLastStroke] = useState<'FH' | 'BH' | null>(null);
  const [aiLastStroke, setAiLastStroke] = useState<'FH' | 'BH' | null>(null);
  const [isSwinging, setIsSwinging] = useState(false);
  const [isVolleySwinging, setIsVolleySwinging] = useState(false);
  const [isAiSwinging, setIsAiSwinging] = useState(false);
  const [isAiVolleySwinging, setIsAiVolleySwinging] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [startLoadingKey, setStartLoadingKey] = useState(0);
  const [showStartButton, setShowStartButton] = useState(false);
  const [rallyCount, setRallyCount] = useState(0);
  const [currentAnimDuration, setCurrentAnimDuration] = useState(0);
  const [ballTimingFunction, setBallTimingFunction] = useState(PRE_BOUNCE_TIMING);
  const [bounceMarkers, setBounceMarkers] = useState<any[]>([]);
  const [ballHasBounced, setBallHasBounced] = useState(false);
  const [server, setServer] = useState<'player' | 'opponent'>('player');
  const [serveSide, setServeSide] = useState<'deuce' | 'ad'>('deuce');
  const [servePointIndex, setServePointIndex] = useState(0);
  const [serveNumber, setServeNumber] = useState(1);
  const [isServePending, setIsServePending] = useState(true);
  const [serveTarget, setServeTarget] = useState<'wide' | 'middle'>('wide');
  const [rosterOpen, setRosterOpen] = useState<'player' | 'opponent' | null>(null);
  const [aiRunTarget, setAiRunTarget] = useState<{ x: number; y: number } | null>(null);
  const matchReportedRef = useRef(false);
  
  // Meter states
  const [meterValue, setMeterValue] = useState(0); // 0 to 100
  const [isMeterActive, setIsMeterActive] = useState(false);
  const [isMeterHolding, setIsMeterHolding] = useState(false);

  // Refs
  const ballTimeoutRef = useRef<any>(null);
  const missTimeoutRef = useRef<any>(null);
  const feedbackTimeoutRef = useRef<any>(null);
  const isBallLiveRef = useRef<boolean>(false);
  const keysPressed = useRef<Set<string>>(new Set());
  const shotStartTimeRef = useRef<number>(0);
  const shotDurationRef = useRef<number>(0);
  const shotStartPosRef = useRef({ x: 50, y: 20 });
  const shotEndPosRef = useRef({ x: 50, y: 220 });
  const currentPlayerPosRef = useRef(playerPos);
  const ballHitPosRef = useRef(ballHitPos);
  const aiTargetXRef = useRef<number>(50);
  const aiTargetYRef = useRef<number>(8);
  const ballHasBouncedRef = useRef(false);
  const aiVolleySwingRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const serveInProgressRef = useRef(false);
  const initialServerRef = useRef<'player' | 'opponent'>('player');
  const lastFrameTimeRef = useRef<number | null>(null);
  const lastTutorialTipRef = useRef<{ primary: string; secondary: string }>({ primary: '', secondary: '' });
  const lastTutorialTipVisibleRef = useRef<{ primary: boolean; secondary: boolean }>({ primary: false, secondary: false });
  const setBallBounced = (value: boolean) => {
    ballHasBouncedRef.current = value;
    setBallHasBounced(value);
  };

  useEffect(() => {
    currentPlayerPosRef.current = playerPos;
  }, [playerPos]);

  useEffect(() => {
    currentAiPosRef.current = aiPos;
  }, [aiPos]);

  useEffect(() => {
    if (gameState.status !== GameStatus.START) return;
    setStartLoadingKey(prev => prev + 1);
    setShowStartButton(false);
    const timer = setTimeout(() => setShowStartButton(true), 2000);
    return () => clearTimeout(timer);
  }, [gameState.status]);

  // Helper to show feedback briefly
  const triggerFeedback = useCallback((text: string, duration = 800) => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setFeedback(text);
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback("");
    }, duration);
  }, []);

  const playTutorialTipSound = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(640, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }, []);

  useEffect(() => {
    if (!onMatchEnd) return;
    if (gameState.status !== GameStatus.GAME_OVER || matchReportedRef.current) return;
    matchReportedRef.current = true;
    const winner = gameState.player.score >= gameState.opponent.score ? 'player' : 'opponent';
    onMatchEnd(winner);
  }, [gameState.opponent.score, gameState.player.score, gameState.status, onMatchEnd]);

  useEffect(() => {
    const primaryVisible = Boolean(tutorial?.instructionPrimary);
    const secondaryVisible = Boolean(tutorial?.instructionSecondary);
    const lastVisible = lastTutorialTipVisibleRef.current;
    const nextPrimary = tutorial?.instructionPrimary ? String(tutorial.instructionPrimary) : '';
    const nextSecondary = tutorial?.instructionSecondary ? String(tutorial.instructionSecondary) : '';
    const primaryChanged = primaryVisible && nextPrimary !== lastTutorialTipRef.current.primary;
    const secondaryChanged = secondaryVisible && nextSecondary !== lastTutorialTipRef.current.secondary;
    if (
      (primaryVisible && !lastVisible.primary)
      || (secondaryVisible && !lastVisible.secondary)
      || primaryChanged
      || secondaryChanged
    ) {
      playTutorialTipSound();
    }
    lastTutorialTipVisibleRef.current = { primary: primaryVisible, secondary: secondaryVisible };
    lastTutorialTipRef.current = { primary: nextPrimary, secondary: nextSecondary };
  }, [playTutorialTipSound, tutorial?.instructionPrimary, tutorial?.instructionSecondary]);

  const getPlayerSpeed = useCallback(() => {
    const speedStat = Math.max(0, Math.min(100, playerStats.athleticism.speed));
    const staminaStat = Math.max(0, Math.min(100, playerStats.athleticism.stamina));
    const baseMultiplier = 0.3 + (speedStat / 100) * 0.4;
    const baseSpeed = PHYSICS.PLAYER_SPEED * baseMultiplier;
    const fatigueRate = (1 - staminaStat / 100) * 0.12;
    const staminaFactor = Math.max(0.6, 1 - rallyCount * fatigueRate);
    return baseSpeed * staminaFactor;
  }, [playerStats.athleticism.speed, playerStats.athleticism.stamina, rallyCount]);

  const getAiSpeed = useCallback(() => {
    const speedStat = Math.max(0, Math.min(100, aiStats.athleticism.speed));
    const staminaStat = Math.max(0, Math.min(100, aiStats.athleticism.stamina));
    const baseMultiplier = 0.3 + (speedStat / 100) * 0.4;
    const baseSpeed = PHYSICS.PLAYER_SPEED * baseMultiplier;
    const fatigueRate = (1 - staminaStat / 100) * 0.12;
    const staminaFactor = Math.max(0.6, 1 - rallyCount * fatigueRate);
    return baseSpeed * staminaFactor;
  }, [aiStats.athleticism.speed, aiStats.athleticism.stamina, rallyCount]);

  const playerSpeedDebug = useMemo(() => {
    const speedStat = Math.max(0, Math.min(100, playerStats.athleticism.speed));
    const staminaStat = Math.max(0, Math.min(100, playerStats.athleticism.stamina));
    const baseMultiplier = 0.3 + (speedStat / 100) * 0.4;
    const baseSpeed = PHYSICS.PLAYER_SPEED * baseMultiplier;
    const fatigueRate = (1 - staminaStat / 100) * 0.12;
    const staminaFactor = Math.max(0.6, 1 - rallyCount * fatigueRate);
    const actualSpeed = baseSpeed * staminaFactor;
    const speedMph = actualSpeed * 25;
    return { staminaFactor, speedMph };
  }, [playerStats.athleticism.speed, playerStats.athleticism.stamina, rallyCount]);

  const aiHomeY = useMemo(
    () => Math.max(AI_COURT_BOUNDS.MIN_Y, Math.min(AI_COURT_BOUNDS.MAX_Y, aiProfile.tendencies.homeY)),
    [aiProfile.tendencies.homeY]
  );
  const surfacePostBounceMultiplier = useMemo(() => {
    switch (surface) {
      case 'clay':
        return 1.28;
      case 'hardcourt':
        return 1.14;
      case 'grass':
      default:
        return 1;
    }
  }, [surface]);

  // Movement loop
  useEffect(() => {
    let frameId: number;
    lastFrameTimeRef.current = null;
    const moveLoop = () => {
      const now = performance.now();
      const last = lastFrameTimeRef.current;
      const rawDeltaMs = last === null ? 0 : now - last;
      const deltaMs = Math.min(rawDeltaMs, 50);
      lastFrameTimeRef.current = now;

      if (gameState.status === GameStatus.PLAYING) {
        const baseFrameMs = 1000 / 60;
        // Player Movement
        const playerSpeed = getPlayerSpeed();
        const playerSpeedPerMs = playerSpeed / baseFrameMs;
        setPlayerPos(prev => {
          if (isServePending && server === 'player') {
            return prev;
          }
          let newX = prev.x;
          let newY = prev.y;
          const moveStep = playerSpeedPerMs * deltaMs;
          if (keysPressed.current.has('ArrowLeft')) newX -= moveStep;
          if (keysPressed.current.has('ArrowRight')) newX += moveStep;
          if (keysPressed.current.has('ArrowUp')) newY -= moveStep;
          if (keysPressed.current.has('ArrowDown')) newY += moveStep;
          return {
            x: Math.max(PHYSICS.PLAYER_BOUNDS.MIN_X, Math.min(PHYSICS.PLAYER_BOUNDS.MAX_X, newX)),
            y: Math.max(PHYSICS.PLAYER_BOUNDS.MIN_Y, Math.min(PHYSICS.PLAYER_BOUNDS.MAX_Y, newY))
          };
        });

        // AI Movement
        const aiSpeed = getAiSpeed();
        const aiSpeedPerMs = aiSpeed / baseFrameMs;
        setAiPos(prev => {
          const dx = aiTargetXRef.current - prev.x;
          const dy = aiTargetYRef.current - prev.y;
          const moveStep = aiSpeedPerMs * deltaMs;
          const nextX = Math.abs(dx) < moveStep ? aiTargetXRef.current : prev.x + Math.sign(dx) * moveStep;
          const nextY = Math.abs(dy) < moveStep ? aiTargetYRef.current : prev.y + Math.sign(dy) * moveStep;
          return {
            x: Math.max(AI_COURT_BOUNDS.MIN_X, Math.min(AI_COURT_BOUNDS.MAX_X, nextX)),
            y: Math.max(AI_COURT_BOUNDS.MIN_Y, Math.min(AI_COURT_BOUNDS.MAX_Y, nextY)),
          };
        });

        // Update live ball position for hit checks and UI cues
        const elapsed = now - shotStartTimeRef.current;
        const progress = Math.min(1, shotDurationRef.current > 0 ? elapsed / shotDurationRef.current : 1);
        const easedProgress = ballHasBouncedRef.current
          ? progress
          : cubicBezierEase(progress, PRE_BOUNCE_BEZIER.x1, PRE_BOUNCE_BEZIER.y1, PRE_BOUNCE_BEZIER.x2, PRE_BOUNCE_BEZIER.y2);
        const liveBallX = shotStartPosRef.current.x + (shotEndPosRef.current.x - shotStartPosRef.current.x) * easedProgress;
        const liveBallY = shotStartPosRef.current.y + (shotEndPosRef.current.y - shotStartPosRef.current.y) * easedProgress;
        const liveBallPos = { x: liveBallX, y: liveBallY };
        setBallHitPos(liveBallPos);
        ballHitPosRef.current = liveBallPos;

        // Update Meter based on ball proximity to player's hitting line
        if (isBallLiveRef.current && !isMeterHolding) {
          const dx = liveBallX - currentPlayerPosRef.current.x;
          const stroke = dx < 0 ? 'BH' : 'FH';
          const hitRadius = ballHasBouncedRef.current
            ? (stroke === 'FH' ? playerHitRadiusFH : playerHitRadiusBH)
            : playerVolleyRadius;
          const bY = liveBallY;
          const distToHittingLine = bY - currentPlayerPosRef.current.y;
          
          if (Math.abs(distToHittingLine) < hitRadius * 1.5) {
            setIsMeterActive(true);
            const mVal = ((distToHittingLine / hitRadius) + 1) * 50;
            setMeterValue(Math.max(0, Math.min(100, mVal)));
          } else {
            setIsMeterActive(false);
          }
        } else if (!isMeterHolding) {
          setIsMeterActive(false);
        }
      }
      frameId = requestAnimationFrame(moveLoop);
    };
    frameId = requestAnimationFrame(moveLoop);
    return () => cancelAnimationFrame(frameId);
  }, [gameState.status, getAiSpeed, getPlayerSpeed, isMeterHolding, isServePending, server]);

  const playBounceSound = useCallback((isPlayer: boolean) => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioCtxRef.current;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isPlayer ? 180 : 150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);

    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.05, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start();
  }, []);

  const playHitSound = useCallback((isPlayer: boolean) => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioCtxRef.current;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.9, ctx.currentTime);

    const saturation = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < curve.length; i++) {
      const x = (i / (curve.length - 1)) * 2 - 1;
      curve[i] = Math.tanh(x * 1.4);
    }
    saturation.curve = curve;
    saturation.oversample = '2x';

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(6500, ctx.currentTime);

    master.connect(saturation);
    saturation.connect(lowpass);
    lowpass.connect(ctx.destination);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(master);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);

    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = 'square';
    snapOsc.frequency.setValueAtTime(1000, ctx.currentTime);
    snapOsc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.015);
    snapGain.gain.setValueAtTime(0.08, ctx.currentTime);
    snapGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
    snapOsc.connect(snapGain);
    snapGain.connect(master);
    snapOsc.start();
    snapOsc.stop(ctx.currentTime + 0.03);

    const bufferSize = Math.floor(ctx.sampleRate * 0.03);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) noiseData[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1800, ctx.currentTime);
    bandpass.Q.setValueAtTime(0.7, ctx.currentTime);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.16, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
    noise.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(master);
    noise.start();
  }, []);


  const playNetCordSound = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioCtxRef.current;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.25, ctx.currentTime);
    master.connect(ctx.destination);

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.04);
    oscGain.gain.setValueAtTime(0.15, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.connect(oscGain);
    oscGain.connect(master);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);

    const bufferSize = Math.floor(ctx.sampleRate * 0.04);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) noiseData[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(900, ctx.currentTime);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
    noise.connect(highpass);
    highpass.connect(noiseGain);
    noiseGain.connect(master);
    noise.start();
  }, []);

  const addBounceMarker = useCallback((x: number, y: number) => {
    playBounceSound(false);
    const id = Date.now();
    setBounceMarkers(prev => [...prev.slice(-10), { id, x, y, opacity: 0.8 }]);
    setTimeout(() => {
      setBounceMarkers(prev => prev.map(m => m.id === id ? { ...m, opacity: 0 } : m));
    }, 600);
  }, [playBounceSound]);

  const checkTutorialTargets = useCallback((x: number, y: number, context: { isVolley: boolean; isDropShot: boolean }) => {
    if (!tutorial?.onTargetHit) return;
    if (tutorial.targetMode === 'dropshot' && tutorial.dropshotZone && context.isDropShot) {
      const { xMin, xMax, yMin, yMax } = tutorial.dropshotZone;
      if (x >= xMin && x <= xMax && y >= yMin && y <= yMax) {
        tutorial.onTargetHit('dropshot', false);
      }
      return;
    }
    if (!tutorial.targets || tutorial.targets.length === 0) return;
    if (tutorial.targetMode === 'volley' && !context.isVolley) return;
    if (tutorial.targetMode === 'ground' && context.isVolley) return;
    tutorial.targets.forEach(target => {
      const distance = Math.hypot(x - target.x, y - target.y);
      if (distance <= target.radius) {
        tutorial.onTargetHit(target.id, context.isVolley);
      }
    });
  }, [tutorial]);

  const playServeFault = useCallback((start: { x: number; y: number }, target: { x: number; y: number }, duration: number, isPlayer: boolean) => {
    isBallLiveRef.current = false;
    playHitSound(isPlayer);
    setCurrentAnimDuration(0);
    setBallTimingFunction(PRE_BOUNCE_TIMING);
    setBallPos({ x: start.x, y: start.y });
    shotStartPosRef.current = { x: start.x, y: start.y };
    shotEndPosRef.current = { x: target.x, y: target.y };
    shotStartTimeRef.current = performance.now();
    shotDurationRef.current = duration;
    setTimeout(() => {
      setCurrentAnimDuration(duration);
      setBallPos({ x: target.x, y: target.y });
      if (target.y === SERVE_NET_Y) {
        playNetCordSound();
      }
    }, 20);
  }, [playHitSound, playNetCordSound]);

  const getPowerDuration = useCallback((shotType: 'serve' | 'forehand' | 'backhand' | 'volley' | 'dropshot', power: number) => {
    const baseDuration = (() => {
      switch (shotType) {
        case 'serve':
          return SERVE_BASE_DURATION;
        case 'dropshot':
          return DROP_SHOT_BASE_DURATION;
        case 'volley':
          return VOLLEY_BASE_DURATION;
        case 'forehand':
        case 'backhand':
        default:
          return SHOT_BASE_DURATION;
      }
    })();
    const multiplier = 1.8 - (power / 70);
    return Math.max(200, baseDuration * multiplier);
  }, []);

  const getPostBounceDuration = useCallback((
    preStart: { x: number; y: number },
    preEnd: { x: number; y: number },
    preDuration: number,
    postStart: { x: number; y: number },
    postEnd: { x: number; y: number },
    minDuration = 120
  ) => {
    const preDist = Math.hypot(preEnd.x - preStart.x, preEnd.y - preStart.y);
    if (preDist <= 0 || preDuration <= 0) return minDuration;
    const endSlope = (1 - PRE_BOUNCE_BEZIER.y2) / (1 - PRE_BOUNCE_BEZIER.x2);
    const endSpeed = (preDist / preDuration) * endSlope;
    if (endSpeed <= 0) return minDuration;
    const postDist = Math.hypot(postEnd.x - postStart.x, postEnd.y - postStart.y);
    const baseDuration = postDist / endSpeed;
    return Math.max(minDuration, baseDuration * surfacePostBounceMultiplier);
  }, [surfacePostBounceMultiplier]);


  const getServeNetChance = useCallback((spin: number) => {
    const clamped = Math.max(0, Math.min(100, spin));
    return Math.max(0.05, 0.35 - (clamped / 100) * 0.25);
  }, []);

  const getServeStats = useCallback((owner: 'player' | 'opponent') => {
    if (owner === 'player') {
      return serveNumber === 1 ? playerStats.serveFirst : playerStats.serveSecond;
    }
    return serveNumber === 1 ? aiStats.serveFirst : aiStats.serveSecond;
  }, [aiStats.serveFirst, aiStats.serveSecond, playerStats, serveNumber]);

  const getServeJitter = useCallback((control: number) => {
    const clamped = Math.max(0, Math.min(100, control));
    const radius = ((100 - clamped) / 100) * SERVE_JITTER_MAX;
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * radius;
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
  }, []);

  const shouldServeHitNet = useCallback((spin: number) => (
    Math.random() < getServeNetChance(spin)
  ), [getServeNetChance]);

  const getControlRadius = useCallback((control: number) => (
    PHYSICS.HIT_RADIUS * (0.7 + (control / 100) * 0.6)
  ), []);

  const getTimingScale = useCallback((shape: number) => (
    0.8 + (shape / 100)
  ), [])

  const getBouncePoint = useCallback((
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    power: number,
    spin: number
  ) => {
    const dx = targetX - startX;
    const dy = targetY - startY;
    const baseDist = Math.hypot(dx, dy);
    if (baseDist === 0) return { x: targetX, y: targetY };
    const travelDelta = (power - spin) * 0.5;
    const travelDist = Math.max(baseDist, baseDist + travelDelta);
    const scale = travelDist / baseDist;
    return {
      x: startX + dx * scale,
      y: startY + dy * scale,
    };
  }, []);

  const isOutOfBounds = useCallback((x: number, y: number) => (
    x < PHYSICS.COURT_BOUNDS.MIN_X
    || x > PHYSICS.COURT_BOUNDS.MAX_X
    || y < PHYSICS.COURT_BOUNDS.MIN_Y
    || y > PHYSICS.COURT_BOUNDS.MAX_Y
  ), []);

  const isServeInBox = useCallback((serveOwner: 'player' | 'opponent', side: 'deuce' | 'ad', x: number, y: number) => {
    const effectiveSide = serveOwner === 'opponent' ? (side === 'deuce' ? 'ad' : 'deuce') : side;
    const minX = effectiveSide === 'deuce' ? PHYSICS.COURT_BOUNDS.MIN_X : 50;
    const maxX = effectiveSide === 'deuce' ? 50 : PHYSICS.COURT_BOUNDS.MAX_X;
    const minY = serveOwner === 'player' ? SERVE_BOX_Y.topMin : SERVE_BOX_Y.bottomMin;
    const maxY = serveOwner === 'player' ? SERVE_BOX_Y.topMax : SERVE_BOX_Y.bottomMax;
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  }, []);

  const getInBoundsTarget = useCallback((startX: number, startY: number, targetX: number, targetY: number) => {
    if (!isOutOfBounds(targetX, targetY)) return { x: targetX, y: targetY };
    const dx = targetX - startX;
    const dy = targetY - startY;
    const isToTop = targetY < startY;
    const isOnOpponentSide = (y: number) => (isToTop ? y <= SERVE_NET_Y : y >= SERVE_NET_Y);
    const candidates: Array<{ t: number; x: number; y: number }> = [];
    if (dx !== 0) {
      const tMinX = (PHYSICS.COURT_BOUNDS.MIN_X - startX) / dx;
      const yAtMinX = startY + dy * tMinX;
      if (tMinX > 0 && yAtMinX >= PHYSICS.COURT_BOUNDS.MIN_Y && yAtMinX <= PHYSICS.COURT_BOUNDS.MAX_Y && isOnOpponentSide(yAtMinX)) {
        candidates.push({ t: tMinX, x: PHYSICS.COURT_BOUNDS.MIN_X, y: yAtMinX });
      }
      const tMaxX = (PHYSICS.COURT_BOUNDS.MAX_X - startX) / dx;
      const yAtMaxX = startY + dy * tMaxX;
      if (tMaxX > 0 && yAtMaxX >= PHYSICS.COURT_BOUNDS.MIN_Y && yAtMaxX <= PHYSICS.COURT_BOUNDS.MAX_Y && isOnOpponentSide(yAtMaxX)) {
        candidates.push({ t: tMaxX, x: PHYSICS.COURT_BOUNDS.MAX_X, y: yAtMaxX });
      }
    }
    if (dy !== 0) {
      const tMinY = (PHYSICS.COURT_BOUNDS.MIN_Y - startY) / dy;
      const xAtMinY = startX + dx * tMinY;
      if (tMinY > 0 && xAtMinY >= PHYSICS.COURT_BOUNDS.MIN_X && xAtMinY <= PHYSICS.COURT_BOUNDS.MAX_X && isOnOpponentSide(PHYSICS.COURT_BOUNDS.MIN_Y)) {
        candidates.push({ t: tMinY, x: xAtMinY, y: PHYSICS.COURT_BOUNDS.MIN_Y });
      }
      const tMaxY = (PHYSICS.COURT_BOUNDS.MAX_Y - startY) / dy;
      const xAtMaxY = startX + dx * tMaxY;
      if (tMaxY > 0 && xAtMaxY >= PHYSICS.COURT_BOUNDS.MIN_X && xAtMaxY <= PHYSICS.COURT_BOUNDS.MAX_X && isOnOpponentSide(PHYSICS.COURT_BOUNDS.MAX_Y)) {
        candidates.push({ t: tMaxY, x: xAtMaxY, y: PHYSICS.COURT_BOUNDS.MAX_Y });
      }
    }
    if (candidates.length === 0) return { x: targetX, y: targetY };
    const closest = candidates.reduce((best, curr) => (curr.t < best.t ? curr : best));
    return { x: closest.x, y: closest.y };
  }, [isOutOfBounds]);

  const extendShotToY = useCallback((start: { x: number; y: number }, end: { x: number; y: number }, targetY: number) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    if (dy === 0) return end.x;
    const t = (targetY - end.y) / dy;
    return end.x + dx * t;
  }, []);

  const getServeTargetX = useCallback(
    (serveOwner: 'player' | 'opponent', side: 'deuce' | 'ad', target: 'wide' | 'middle') => {
      const effectiveSide = serveOwner === 'opponent' ? (side === 'deuce' ? 'ad' : 'deuce') : side;
      if (effectiveSide === 'deuce') {
        return target === 'wide' ? SERVE_TARGET_X.deuce.wide : SERVE_TARGET_X.deuce.middle;
      }
      return target === 'wide' ? SERVE_TARGET_X.ad.wide : SERVE_TARGET_X.ad.middle;
    },
    []
  );

  const getServerForPoint = useCallback((pointIndex: number) => {
    if (pointIndex === 0) return initialServerRef.current;
    const block = Math.floor((pointIndex - 1) / 2);
    if (block % 2 === 0) {
      return initialServerRef.current === 'player' ? 'opponent' : 'player';
    }
    return initialServerRef.current;
  }, []);

  const getServeSideForPoint = useCallback((pointIndex: number) => (
    pointIndex % 2 === 0 ? 'deuce' : 'ad'
  ), []);

  const playerHitRadiusFH = getControlRadius(playerStats.forehand.control);
  const playerHitRadiusBH = getControlRadius(playerStats.backhand.control);
  const playerVolleyRadius = getControlRadius(playerStats.volley.control);
  const aiHitRadiusFH = getControlRadius(aiStats.forehand.control);
  const aiHitRadiusBH = getControlRadius(aiStats.backhand.control);
  const aiVolleyRadius = getControlRadius(aiStats.volley.control);

  const resetPoint = useCallback((winner: 'player' | 'opponent', options?: { skipFeedback?: boolean }) => {
    isBallLiveRef.current = false;
    if (missTimeoutRef.current) clearTimeout(missTimeoutRef.current);
    setRallyCount(0);
    setServePointIndex(prev => {
      const nextIndex = prev + 1;
      setServer(getServerForPoint(nextIndex));
      setServeSide(getServeSideForPoint(nextIndex));
      setServeNumber(1);
      setIsServePending(true);
      serveInProgressRef.current = false;
      return nextIndex;
    });
    setGameState(prev => ({
      ...prev,
      player: { ...prev.player, score: winner === 'player' ? prev.player.score + 1 : prev.player.score },
      opponent: { ...prev.opponent, score: winner === 'opponent' ? prev.opponent.score + 1 : prev.opponent.score },
      status: GameStatus.SCORING,
    }));
    if (!options?.skipFeedback) {
      triggerFeedback(winner === 'player' ? "POINT!" : "MISS!", 1000);
    }
    aiTargetXRef.current = 50; // Recover to center
    aiTargetYRef.current = aiHomeY;
    setAiRunTarget(null);
    
    setTimeout(() => {
      setCurrentAnimDuration(0);
      setBallPos({ x: 50, y: 20 });
      setPlayerPos({ x: 50, y: 170 });
      const resetAiPos = { x: 50, y: aiHomeY };
      setAiPos(resetAiPos);
      currentAiPosRef.current = resetAiPos;
      setLastStroke(null);
      setGameState(prev => {
        if (!tutorial && (prev.player.score >= 10 || prev.opponent.score >= 10)) {
          return { ...prev, status: GameStatus.GAME_OVER };
        }
        return { ...prev, status: GameStatus.PLAYING };
      });
      if (gameState.player.score < 5 && gameState.opponent.score < 5) {
        setIsServePending(true);
        serveInProgressRef.current = false;
      }
    }, 1000); 
  }, [aiHomeY, gameState.player.score, gameState.opponent.score, getServerForPoint, getServeSideForPoint, triggerFeedback, tutorial]);

  const schedulePlayerMiss = useCallback((delayMs: number, context?: { isServe?: boolean }) => {
    const check = () => {
      if (!isBallLiveRef.current) return;
      const player = currentPlayerPosRef.current;
      const ball = ballHitPosRef.current;
      const dx = ball.x - player.x;
      const hitRadius = ballHasBouncedRef.current
        ? (dx < 0 ? playerHitRadiusBH : playerHitRadiusFH)
        : playerVolleyRadius;
      if (ball.y < player.y + hitRadius * 0.3) {
        missTimeoutRef.current = setTimeout(check, 80);
        return;
      }
      const dy = ball.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const isServeWinner = context?.isServe && rallyCount === 0 && server === 'opponent';
      const message = isServeWinner
        ? "ACE!"
        : (distance > hitRadius * 1.5 ? "WINNER! 🏆" : "MISS!");
      triggerFeedback(message, 600);
      resetPoint('opponent', { skipFeedback: true });
    };
    if (missTimeoutRef.current) clearTimeout(missTimeoutRef.current);
    missTimeoutRef.current = setTimeout(check, delayMs);
  }, [playerHitRadiusBH, playerHitRadiusFH, playerVolleyRadius, rallyCount, resetPoint, server, triggerFeedback]);
  
  const startAiShot = useCallback((startOverride?: { x: number; y: number }) => {
    const isVolley = aiVolleySwingRef.current;
    setIsAiSwinging(true);
    setIsAiVolleySwinging(isVolley);
    aiVolleySwingRef.current = false;
    setTimeout(() => {
      setIsAiSwinging(false);
      setIsAiVolleySwinging(false);
    }, 250);
    setAiRunTarget(null);
    const startX = startOverride?.x ?? currentAiPosRef.current.x;
    const startY = startOverride?.y ?? currentAiPosRef.current.y;
    const timingFactor = Math.max(-1, Math.min(1, (Math.random() * 2 - 1)));
    const playerX = currentPlayerPosRef.current.x;
    const isDropShot = tutorial ? false : (Math.random() < aiProfile.tendencies.dropShotChance);
    const baseTargetY = isDropShot ? 108 : 144;
    const awayAnchor = playerX < 50 ? 80 : 20;
    const towardX = playerX + (Math.random() * 12 - 6);
    const awayX = awayAnchor + (Math.random() * 10 - 5);
    const endX = tutorial ? towardX : (Math.random() < aiProfile.tendencies.awayBias ? awayX : towardX);
    const outY = 224;
    const aiStroke = ballHitPosRef.current.x < startX ? 'BH' : 'FH';
    setAiLastStroke(aiStroke);
    const aiShotStats = aiStats[aiStroke === 'FH' ? 'forehand' : 'backhand'];
    const aiVolleyPower = aiStats.volley.control;
    const volleyPower = 50 + aiVolleyPower * 0.25;
    const hitPower = isVolley ? volleyPower : aiShotStats.power;
    const hitSpin = isVolley ? 0 : aiShotStats.spin;
    const duration = getPowerDuration(isDropShot ? 'dropshot' : (isVolley ? 'volley' : (aiStroke === 'FH' ? 'forehand' : 'backhand')), hitPower);
    const outDuration = duration;

    setCurrentAnimDuration(0);
    setBallPos({ x: startX, y: startY });
    
    setTimeout(() => {
      playHitSound(false);
      isBallLiveRef.current = true;
      setBallTimingFunction(PRE_BOUNCE_TIMING);
      shotStartTimeRef.current = performance.now();
      shotDurationRef.current = duration;
      const shapedEndX = endX + timingFactor * 12;
      const targetPoint = getInBoundsTarget(startX, startY, shapedEndX, baseTargetY);
      const bounce = getBouncePoint(startX, startY, targetPoint.x, targetPoint.y, hitPower, hitSpin);
      const isOut = isOutOfBounds(bounce.x, bounce.y);
      shotStartPosRef.current = { x: startX, y: startY };
      shotEndPosRef.current = { x: bounce.x, y: bounce.y };
      setCurrentAnimDuration(duration);
      setBallPos({ x: bounce.x, y: bounce.y });
      if (isDropShot) {
        triggerFeedback("DROP SHOT!", 600);
      }
      setBallBounced(false);
      
      // AI starts recovering to middle after hitting
      aiTargetXRef.current = 50;
      aiTargetYRef.current = aiHomeY;

      if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);
      ballTimeoutRef.current = setTimeout(() => {
        if (!isBallLiveRef.current) return;
        addBounceMarker(bounce.x, bounce.y);
        if (isOut) {
          isBallLiveRef.current = false;
          triggerFeedback("OUT! ❌", 600);
          ballTimeoutRef.current = setTimeout(() => {
            resetPoint('player');
          }, 600);
          return;
        }
        if (isDropShot) {
          const dropStopY = Math.min(PHYSICS.COURT_BOUNDS.MAX_Y + 20, bounce.y + 24);
          const dropStopX = extendShotToY({ x: startX, y: startY }, { x: bounce.x, y: bounce.y }, dropStopY);
          const stopDuration = getPostBounceDuration(
            { x: startX, y: startY },
            { x: bounce.x, y: bounce.y },
            duration,
            { x: bounce.x, y: bounce.y },
            { x: dropStopX, y: dropStopY }
          );
          setBallBounced(true);
          setBallTimingFunction(POST_BOUNCE_TIMING);
          shotStartTimeRef.current = performance.now();
          shotDurationRef.current = stopDuration;
          shotStartPosRef.current = { x: bounce.x, y: bounce.y };
          shotEndPosRef.current = { x: dropStopX, y: dropStopY };
          setCurrentAnimDuration(stopDuration);
          setBallPos({ x: dropStopX, y: dropStopY });

          if (missTimeoutRef.current) clearTimeout(missTimeoutRef.current);
          missTimeoutRef.current = setTimeout(() => {
            if (!isBallLiveRef.current) return;
            triggerFeedback("MISS!", 600);
            resetPoint('opponent');
          }, stopDuration);
          return;
        }

        const travelX = bounce.x - startX;
        const travelY = bounce.y - startY;
        const continuationT = travelY !== 0 ? (outY - bounce.y) / travelY : 0;
        const outX = bounce.x + travelX * continuationT;
        const postBounceDuration = getPostBounceDuration(
          { x: startX, y: startY },
          { x: bounce.x, y: bounce.y },
          duration,
          { x: bounce.x, y: bounce.y },
          { x: outX, y: outY }
        );
        setBallBounced(true);
        setBallTimingFunction(POST_BOUNCE_TIMING);
        shotStartTimeRef.current = performance.now();
        shotDurationRef.current = postBounceDuration;
        shotStartPosRef.current = { x: bounce.x, y: bounce.y };
        shotEndPosRef.current = { x: outX, y: outY };
        setCurrentAnimDuration(postBounceDuration);
        setBallPos({ x: outX, y: outY });

        schedulePlayerMiss(postBounceDuration);
      }, duration);
    }, 50);
  }, [addBounceMarker, aiHomeY, aiProfile.tendencies.awayBias, aiProfile.tendencies.dropShotChance, aiStats, extendShotToY, getBouncePoint, getInBoundsTarget, getPostBounceDuration, getPowerDuration, isOutOfBounds, playHitSound, resetPoint, schedulePlayerMiss, triggerFeedback, tutorial]);

  const executePlayerShot = useCallback((params: {
    startX: number;
    startY: number;
    hitSpeed: number;
    hitSpin: number;
    isDropShot: boolean;
    bounceX: number;
    bounceY: number;
    isServe?: boolean;
    isVolley?: boolean;
  }) => {
    const { startX, startY, hitSpeed, hitSpin, isDropShot, bounceX, bounceY, isServe, isVolley } = params;
    const aiNow = currentAiPosRef.current;
    const aiVolleyCandidate = aiNow.y >= AI_VOLLEY_ZONE_Y;
    const aiBounceY = bounceY;
    const volleyTargetX = extendShotToY({ x: startX, y: startY }, { x: bounceX, y: bounceY }, AI_VOLLEY_ZONE_Y);
    const volleyTarget = { x: volleyTargetX, y: AI_VOLLEY_ZONE_Y };
    const aiVolleyDist = Math.hypot(aiNow.x - volleyTarget.x, aiNow.y - volleyTarget.y);
    const distTotal = Math.hypot(bounceX - startX, aiBounceY - startY);
    const distVolley = Math.hypot(volleyTarget.x - startX, volleyTarget.y - startY);
    const volleyArrivalMs = Math.max(120, hitSpeed * (distTotal > 0 ? distVolley / distTotal : 0.5));
    const aiSpeed = getAiSpeed();
    const aiSpeedPerMs = aiSpeed / (1000 / 60);
    const aiTravelMs = aiSpeedPerMs > 0 ? (aiVolleyDist / aiSpeedPerMs) : Number.POSITIVE_INFINITY;
    const aiCanReachVolley = aiVolleyDist < aiVolleyRadius || aiTravelMs <= volleyArrivalMs;
    const aiWillVolley = aiVolleyCandidate && aiCanReachVolley;
    const dropStopY = Math.max(24, aiBounceY - 24);
    const spinFactor = Math.max(0.6, Math.min(1.6, 1 + (hitSpin - 60) / 120));
    const contactOffset = 36 * spinFactor;
    const contactY = Math.max(AI_COURT_BOUNDS.MIN_Y + 8, aiBounceY - contactOffset);
    const preStart = { x: startX, y: startY };
    const preEnd = { x: bounceX, y: aiBounceY };
    const dropStopX = extendShotToY(preStart, preEnd, dropStopY);
    const contactX = extendShotToY(preStart, preEnd, contactY);
    const isOut = isOutOfBounds(bounceX, aiBounceY);

    // AI starts moving towards where the ball will land
    if (aiWillVolley) {
      aiTargetXRef.current = volleyTarget.x;
      aiTargetYRef.current = volleyTarget.y;
      setAiRunTarget({ x: volleyTarget.x, y: volleyTarget.y });
    } else {
      const targetY = isDropShot ? dropStopY : Math.max(AI_COURT_BOUNDS.MIN_Y, contactY - 8);
      const targetX = isDropShot ? dropStopX : contactX;
      aiTargetXRef.current = targetX;
      aiTargetYRef.current = targetY;
      setAiRunTarget({ x: targetX, y: targetY });
    }

    shotStartTimeRef.current = performance.now();
    if (aiWillVolley) {
      setBallTimingFunction(PRE_BOUNCE_TIMING);
      const volleyDuration = volleyArrivalMs;
      shotDurationRef.current = volleyDuration;
      shotStartPosRef.current = { x: startX, y: startY };
      shotEndPosRef.current = { x: volleyTarget.x, y: volleyTarget.y };
      setCurrentAnimDuration(0);
      setBallPos({ x: startX, y: startY });
      setTimeout(() => {
        setCurrentAnimDuration(volleyDuration);
        setBallPos({ x: volleyTarget.x, y: volleyTarget.y });
      }, 20);

      if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);
      ballTimeoutRef.current = setTimeout(() => {
        aiVolleySwingRef.current = true;
        startAiShot({ x: volleyTarget.x, y: volleyTarget.y });
      }, volleyDuration);
      return;
    }

    setBallTimingFunction(PRE_BOUNCE_TIMING);
    shotDurationRef.current = hitSpeed;
    shotStartPosRef.current = { x: startX, y: startY };
    shotEndPosRef.current = { x: bounceX, y: aiBounceY };

    setCurrentAnimDuration(0);
    setBallPos({ x: startX, y: startY });

    setTimeout(() => {
      setCurrentAnimDuration(hitSpeed);
      setBallPos({ x: bounceX, y: aiBounceY });
    }, 20);

    setTimeout(() => {
      if (!isOut && !isServe) {
        checkTutorialTargets(bounceX, aiBounceY, { isVolley: Boolean(isVolley), isDropShot: Boolean(isDropShot) });
      }
      addBounceMarker(bounceX, aiBounceY);
      setBallBounced(true);
      if (isOut) {
        triggerFeedback("OUT! ❌", 600);
        setAiRunTarget(null);
        if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);
        ballTimeoutRef.current = setTimeout(() => {
          resetPoint('opponent');
        }, 600);
        return;
      }
      const aiCheckX = isDropShot ? dropStopX : contactX;
      const aiCheckY = isDropShot ? dropStopY : contactY;
      const postTarget = { x: aiCheckX, y: aiCheckY };
      const postDuration = getPostBounceDuration(
        preStart,
        preEnd,
        hitSpeed,
        { x: bounceX, y: aiBounceY },
        postTarget
      );

      shotStartTimeRef.current = performance.now();
      setBallTimingFunction(POST_BOUNCE_TIMING);
      shotDurationRef.current = postDuration;
      shotStartPosRef.current = { x: bounceX, y: aiBounceY };
      shotEndPosRef.current = postTarget;
      setCurrentAnimDuration(postDuration);
      setBallPos(postTarget);

      if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);
      ballTimeoutRef.current = setTimeout(() => {
        const aiNow = currentAiPosRef.current;
        const aiDistFromBall = Math.hypot(aiNow.x - aiCheckX, aiNow.y - aiCheckY);
        const aiStroke = aiCheckX < aiNow.x ? 'BH' : 'FH';
        const aiHitRadius = aiStroke === 'FH' ? aiHitRadiusFH : aiHitRadiusBH;
        const aiControl = aiStroke === 'FH' ? aiStats.forehand.control : aiStats.backhand.control;
        const controlFactor = Math.max(0.15, 1 - aiControl / 160);
        const powerFactor = Math.max(0, Math.min(1, (hitSpin + hitSpeed / 20) / 200));
        const baseMissChance = 0.04 + powerFactor * 0.25;
        const errorModifier = Math.max(0.5, aiProfile.tendencies.errorModifier || 1);
        const missChance = Math.max(0.01, baseMissChance * controlFactor * errorModifier);
        const forcePerfectAi = Boolean(tutorial);
        const inRange = forcePerfectAi ? true : aiDistFromBall < aiHitRadius;
        const rollMiss = forcePerfectAi ? false : Math.random() < missChance;

        if (isDropShot) {
          if (!inRange) {
            triggerFeedback("DROPSHOT WINNER! 🏆", 600);
            setAiRunTarget(null);
            ballTimeoutRef.current = setTimeout(() => {
              resetPoint('player');
            }, 600);
            return;
          }
        if (rollMiss) {
          triggerFeedback("NET! ❌", 600);
          setAiRunTarget(null);
          setIsAiSwinging(true);
          setIsAiVolleySwinging(false);
          setTimeout(() => {
            setIsAiSwinging(false);
            setIsAiVolleySwinging(false);
          }, 250);
          const netX = extendShotToY(
            { x: dropStopX, y: dropStopY },
            { x: currentPlayerPosRef.current.x, y: currentPlayerPosRef.current.y },
            SERVE_NET_Y
            );
          const netDuration = getPostBounceDuration(
            preStart,
            preEnd,
            hitSpeed,
            { x: bounceX, y: aiBounceY },
            { x: netX, y: SERVE_NET_Y }
          );
          playHitSound(false);
          shotStartTimeRef.current = performance.now();
          setBallTimingFunction(POST_BOUNCE_TIMING);
          shotDurationRef.current = netDuration;
          shotStartPosRef.current = { x: dropStopX, y: dropStopY };
          shotEndPosRef.current = { x: netX, y: SERVE_NET_Y };
          setCurrentAnimDuration(netDuration);
          setBallPos({ x: netX, y: SERVE_NET_Y });
          setTimeout(() => {
            playNetCordSound();
          }, netDuration);
          if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);
          ballTimeoutRef.current = setTimeout(() => {
            resetPoint('player');
          }, netDuration);
          return;
          }
          setAiRunTarget(null);
          startAiShot({ x: dropStopX, y: dropStopY });
          return;
        }

        if (!inRange) {
          const isServeWinner = isServe && rallyCount === 0 && server === 'player';
          triggerFeedback(isServeWinner ? "ACE!" : "WINNER! 🏆", 600);
          setAiRunTarget(null);
          const outY = -24;
          const outX = extendShotToY(preStart, preEnd, outY);
          const outDuration = getPostBounceDuration(
            preStart,
            preEnd,
            hitSpeed,
            postTarget,
            { x: outX, y: outY }
          );
          shotStartTimeRef.current = performance.now();
          setBallTimingFunction(POST_BOUNCE_TIMING);
          shotDurationRef.current = outDuration;
          shotStartPosRef.current = postTarget;
          shotEndPosRef.current = { x: outX, y: outY };
          setCurrentAnimDuration(outDuration);
          setBallPos({ x: outX, y: outY });

          if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);
          ballTimeoutRef.current = setTimeout(() => {
            resetPoint('player');
          }, outDuration);
          return;
        }

        if (rollMiss) {
          triggerFeedback("NET! ❌", 600);
          setAiRunTarget(null);
          setIsAiSwinging(true);
          setIsAiVolleySwinging(false);
          setTimeout(() => {
            setIsAiSwinging(false);
            setIsAiVolleySwinging(false);
          }, 250);
          const netX = extendShotToY(
            postTarget,
            { x: currentPlayerPosRef.current.x, y: currentPlayerPosRef.current.y },
            SERVE_NET_Y
          );
          const netDuration = getPostBounceDuration(
            preStart,
            preEnd,
            hitSpeed,
            { x: bounceX, y: aiBounceY },
            { x: netX, y: SERVE_NET_Y }
          );
          playHitSound(false);
          shotStartTimeRef.current = performance.now();
          setBallTimingFunction(POST_BOUNCE_TIMING);
          shotDurationRef.current = netDuration;
          shotStartPosRef.current = postTarget;
          shotEndPosRef.current = { x: netX, y: SERVE_NET_Y };
          setCurrentAnimDuration(netDuration);
          setBallPos({ x: netX, y: SERVE_NET_Y });
          setTimeout(() => {
            playNetCordSound();
          }, netDuration);

          if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);
          ballTimeoutRef.current = setTimeout(() => {
            resetPoint('player');
          }, netDuration);
          return;
        }

        setAiRunTarget(null);
        startAiShot({ x: contactX, y: contactY });
      }, postDuration);
    }, hitSpeed);
  }, [addBounceMarker, aiHitRadiusBH, aiHitRadiusFH, aiVolleyRadius, checkTutorialTargets, extendShotToY, getAiSpeed, getPostBounceDuration, isOutOfBounds, playNetCordSound, rallyCount, resetPoint, server, startAiShot, triggerFeedback, tutorial]);

  const isTutorialOpeningServe = Boolean(
    tutorial?.disableOpeningServeFaults
    && servePointIndex === 0
    && server === 'player'
    && serveNumber === 1
    && isServePending
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysPressed.current.add(e.code);
    
    if (isServePending && server === 'player' && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) {
      setServeTarget(prev => (prev === 'wide' ? 'middle' : 'wide'));
      return;
    }
    if ((e.code === 'Space' || e.code === 'KeyX') && gameState.status === GameStatus.PLAYING) {
      e.preventDefault();
      if (isServePending && server === 'player' && e.code === 'Space') {
        const serveStats = getServeStats('player');
        const serveDuration = getPowerDuration('serve', serveStats.power);
        const p = currentPlayerPosRef.current;
        const targetX = getServeTargetX('player', serveSide, serveTarget);
        const isTutorialNoFault = Boolean(tutorial);
        const jitter = isTutorialNoFault ? { x: 0, y: 0 } : getServeJitter(serveStats.control);
        let targetPoint = { x: targetX + jitter.x, y: SERVE_TARGET_Y.top + jitter.y };
        const netFault = isTutorialNoFault ? false : shouldServeHitNet(serveStats.spin);
        const outFault = isTutorialNoFault ? false : (!netFault && !isServeInBox('player', serveSide, targetPoint.x, targetPoint.y));
        if (netFault) {
          targetPoint = { x: targetX, y: SERVE_NET_Y };
        }
        if (isTutorialNoFault) {
          targetPoint = { x: targetX, y: SERVE_TARGET_Y.top };
        }

        if (netFault || outFault) {
          triggerFeedback("FAULT!", 700);
          setIsServePending(false);
          playServeFault(p, targetPoint, serveDuration, true);
          if (serveNumber === 1) {
            setTimeout(() => {
              setServeNumber(2);
              setIsServePending(true);
              serveInProgressRef.current = false;
            }, serveDuration + 100);
          } else {
            setTimeout(() => {
              resetPoint('opponent');
            }, serveDuration + 100);
          }
          return;
        }

        setIsServePending(false);
        setServeNumber(1);
        serveInProgressRef.current = false;
        setBallBounced(false);

        const serveBounce = targetPoint;

        setLastStroke(targetPoint.x < p.x ? 'BH' : 'FH');
        setIsSwinging(true);
        setIsVolleySwinging(false);
        setTimeout(() => {
          setIsSwinging(false);
          setIsVolleySwinging(false);
        }, 250);
        playHitSound(true);
        executePlayerShot({
          startX: p.x,
          startY: p.y,
          hitSpeed: serveDuration,
          hitSpin: serveStats.spin,
          isDropShot: false,
          bounceX: serveBounce.x,
          bounceY: serveBounce.y,
          isServe: true,
          isVolley: false,
        });
        tutorial?.onPlayerServe?.();
        return;
      }
      if (isServePending) return;
      const isDropShot = e.code === 'KeyX';
      
      const bX = ballHitPosRef.current.x;
      const p = currentPlayerPosRef.current;
      const dx = bX - p.x;
      
      const stroke = dx < 0 ? 'BH' : 'FH';
      const isVolley = !ballHasBouncedRef.current;
      const hitRadius = isVolley
        ? playerVolleyRadius
        : (stroke === 'FH' ? playerHitRadiusFH : playerHitRadiusBH);
      setLastStroke(stroke);
      setIsSwinging(true);
      setIsVolleySwinging(isVolley);
      setTimeout(() => {
        setIsSwinging(false);
        setIsVolleySwinging(false);
      }, 250);

      if (!isBallLiveRef.current) return;

      const bY = ballHitPosRef.current.y;
      const dy = bY - p.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > hitRadius) {
        const isServeWinner = rallyCount === 0 && server === 'opponent';
        const message = isServeWinner
          ? "ACE!"
          : (distance > hitRadius * 1.5 ? "WINNER! 🏆" : "MISSED!");
        triggerFeedback(message, 600);
        resetPoint('opponent', { skipFeedback: true });
        return;
      }

      // HIT SUCCESS
      playHitSound(true);
      clearTimeout(ballTimeoutRef.current);
      if (missTimeoutRef.current) clearTimeout(missTimeoutRef.current);
      isBallLiveRef.current = false;
      setBallBounced(false);
      setRallyCount(prev => prev + 1);
      tutorial?.onPlayerHit?.({ isVolley });

      setIsMeterHolding(true);
      setTimeout(() => {
        setIsMeterHolding(false);
        setIsMeterActive(false);
      }, 800); 

      const timingScale = getTimingScale(stroke === 'FH' ? playerStats.forehand.shape : playerStats.backhand.shape);
      const neutralAngle = isVolley ? VOLLEY_NEUTRAL_ANGLE_DEG : GROUND_NEUTRAL_ANGLE_DEG;
      const neutralOffset = Math.tan((neutralAngle * Math.PI) / 180) * hitRadius;
      const timingFactor = isVolley
        ? Math.max(-1, Math.min(1, ((dy + neutralOffset) / hitRadius)))
        : Math.max(-1, Math.min(1, ((dy + neutralOffset) / hitRadius) * timingScale));
      const lerpT = (timingFactor + 1) / 2;
      
      let targetX: number;
      if (isDropShot) {
        if (stroke === 'FH') {
          targetX = 20 + (80 - 20) * lerpT;
        } else {
          targetX = 80 + (20 - 80) * lerpT;
        }
        triggerFeedback("DROP SHOT!", 700);
      } else if (isVolley) {
        if (stroke === 'FH') {
          targetX = 4.5 + (95.5 - 4.5) * lerpT;
        } else {
          targetX = 95.5 + (4.5 - 95.5) * lerpT;
        }
        triggerFeedback("VOLLEY!", 700);
      } else if (stroke === 'FH') {
        targetX = 4.5 + (95.5 - 4.5) * lerpT;
      } else {
        targetX = 95.5 + (4.5 - 95.5) * lerpT;
      }
      
      const hitPower = isVolley
        ? 50 + playerStats.volley.control * 0.25
        : (stroke === 'FH' ? playerStats.forehand.power : playerStats.backhand.power);
      const baseSpin = isVolley ? 0 : (stroke === 'FH' ? playerStats.forehand.spin : playerStats.backhand.spin);
      const hitSpeed = getPowerDuration(isDropShot ? 'dropshot' : (isVolley ? 'volley' : (stroke === 'FH' ? 'forehand' : 'backhand')), hitPower);
      const accuracySpin = isVolley ? (playerStats.volley.accuracy / 100) * 80 : 0;
      const effectiveSpin = baseSpin + accuracySpin;
      const baseBounceY = isDropShot ? 80 : (isVolley ? VOLLEY_TARGET_Y : 36);
      const targetPoint = getInBoundsTarget(bX, bY, targetX, baseBounceY);
      const bounce = getBouncePoint(bX, bY, targetPoint.x, targetPoint.y, hitPower, effectiveSpin);
      executePlayerShot({
        startX: bX,
        startY: bY,
        hitSpeed,
        hitSpin: baseSpin,
        isDropShot,
        bounceX: bounce.x,
        bounceY: bounce.y,
        isServe: false,
        isVolley,
      });
    }
  }, [executePlayerShot, gameState.status, getBouncePoint, getPowerDuration, getServeJitter, getServeStats, getServeTargetX, getTimingScale, isBallLiveRef, isServeInBox, isTutorialOpeningServe, playHitSound, playServeFault, playerHitRadiusBH, playerHitRadiusFH, resetPoint, server, serveNumber, serveSide, serveTarget, shouldServeHitNet, triggerFeedback, isServePending, tutorial]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysPressed.current.delete(e.code);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    if (gameState.status !== GameStatus.PLAYING || !isServePending) return;
    const serverPos = server === 'player' ? playerPos : aiPos;
    setCurrentAnimDuration(0);
    setBallTimingFunction(PRE_BOUNCE_TIMING);
    setBallPos({ x: serverPos.x, y: serverPos.y });
    setAiRunTarget(null);
    shotStartPosRef.current = { x: serverPos.x, y: serverPos.y };
    shotEndPosRef.current = { x: serverPos.x, y: serverPos.y };
    shotStartTimeRef.current = performance.now();
    shotDurationRef.current = 0;
    setBallHitPos({ x: serverPos.x, y: serverPos.y });
    ballHitPosRef.current = { x: serverPos.x, y: serverPos.y };
  }, [aiPos, gameState.status, isServePending, playerPos, server]);

  useEffect(() => {
    if (gameState.status !== GameStatus.PLAYING || !isServePending) return;
    const effectiveSide = server === 'opponent' ? (serveSide === 'deuce' ? 'ad' : 'deuce') : serveSide;
    const isDeuce = effectiveSide === 'deuce';
    if (server === 'player') {
      const serverX = isDeuce ? 70 : 30;
      const receiverX = isDeuce ? 30 : 70;
      setPlayerPos(prev => ({ ...prev, x: serverX, y: 186 }));
      setAiPos(prev => ({ ...prev, x: receiverX, y: -6 }));
      currentAiPosRef.current = { ...currentAiPosRef.current, x: receiverX, y: -6 };
      aiTargetXRef.current = receiverX;
      aiTargetYRef.current = -6;
    } else {
      const serverX = isDeuce ? 70 : 30;
      const receiverX = isDeuce ? 30 : 70;
      setAiPos(prev => ({ ...prev, x: serverX, y: -6 }));
      currentAiPosRef.current = { ...currentAiPosRef.current, x: serverX, y: -6 };
      setPlayerPos(prev => ({ ...prev, x: receiverX, y: 186 }));
      aiTargetXRef.current = serverX;
      aiTargetYRef.current = -6;
    }
  }, [gameState.status, isServePending, serveSide, server]);

  useEffect(() => {
    if (gameState.status !== GameStatus.PLAYING || !isServePending || server !== 'opponent') return;
    if (serveInProgressRef.current) return;
    serveInProgressRef.current = true;
    const timeoutId = setTimeout(() => {
      const isTutorialNoFault = Boolean(tutorial);
      const serveStats = getServeStats('opponent');
      const serveDuration = getPowerDuration('serve', serveStats.power);
      const start = currentAiPosRef.current;
      const serveTargetX = getServeTargetX('opponent', serveSide, Math.random() < 0.5 ? 'wide' : 'middle');
      const jitter = isTutorialNoFault ? { x: 0, y: 0 } : getServeJitter(serveStats.control);
      let targetPoint = { x: serveTargetX + jitter.x, y: SERVE_TARGET_Y.bottom + jitter.y };
      const netFault = isTutorialNoFault ? false : shouldServeHitNet(serveStats.spin);
      const outFault = isTutorialNoFault ? false : (!netFault && !isServeInBox('opponent', serveSide, targetPoint.x, targetPoint.y));
      if (netFault) {
        targetPoint = { x: serveTargetX, y: SERVE_NET_Y };
      }
      if (isTutorialNoFault) {
        targetPoint = { x: serveTargetX, y: SERVE_TARGET_Y.bottom };
      }

      if (netFault || outFault) {
        triggerFeedback("FAULT!", 700);
        setIsServePending(false);
        playServeFault(start, targetPoint, serveDuration, false);
        if (serveNumber === 1) {
          setTimeout(() => {
            setServeNumber(2);
            setIsServePending(true);
            serveInProgressRef.current = false;
          }, serveDuration + 100);
        } else {
          setTimeout(() => {
            resetPoint('player');
          }, serveDuration + 100);
        }
        return;
      }

      setIsServePending(false);
      setServeNumber(1);
      serveInProgressRef.current = false;

      const outY = 224;
      const duration = serveDuration;

      setCurrentAnimDuration(0);
      setBallPos({ x: start.x, y: start.y });

      setTimeout(() => {
        setIsAiSwinging(true);
        setIsAiVolleySwinging(false);
        setTimeout(() => {
          setIsAiSwinging(false);
          setIsAiVolleySwinging(false);
        }, 250);
        setAiLastStroke('FH');
        playHitSound(false);
        isBallLiveRef.current = true;
        setBallBounced(false);
        setBallTimingFunction(PRE_BOUNCE_TIMING);
        shotStartTimeRef.current = performance.now();
        shotDurationRef.current = duration;
        shotStartPosRef.current = { x: start.x, y: start.y };
        const serveBounce = targetPoint;
        shotEndPosRef.current = { x: serveBounce.x, y: serveBounce.y };
        setCurrentAnimDuration(duration);
        setBallPos({ x: serveBounce.x, y: serveBounce.y });

        aiTargetXRef.current = 50;
        aiTargetYRef.current = aiHomeY;

        if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);
        ballTimeoutRef.current = setTimeout(() => {
          if (!isBallLiveRef.current) return;
          addBounceMarker(serveBounce.x, serveBounce.y);
          setBallBounced(true);
          setBallTimingFunction(POST_BOUNCE_TIMING);
          shotStartTimeRef.current = performance.now();
          const travelX = serveBounce.x - start.x;
          const travelY = serveBounce.y - start.y;
          const continuationT = travelY !== 0 ? (outY - serveBounce.y) / travelY : 0;
          const outX = serveBounce.x + travelX * continuationT;
          const postBounceDuration = getPostBounceDuration(
            { x: start.x, y: start.y },
            { x: serveBounce.x, y: serveBounce.y },
            duration,
            { x: serveBounce.x, y: serveBounce.y },
            { x: outX, y: outY }
          );
          shotDurationRef.current = postBounceDuration;
          shotStartPosRef.current = { x: serveBounce.x, y: serveBounce.y };
          shotEndPosRef.current = { x: outX, y: outY };
          setCurrentAnimDuration(postBounceDuration);
          setBallPos({ x: outX, y: outY });

        schedulePlayerMiss(postBounceDuration, { isServe: true });
        }, duration);
      }, 50);
    }, 600);
    return () => clearTimeout(timeoutId);
  }, [addBounceMarker, gameState.status, getPostBounceDuration, getPowerDuration, getServeJitter, getServeStats, getServeTargetX, isServeInBox, isServePending, playHitSound, playServeFault, resetPoint, schedulePlayerMiss, serveNumber, server, serveSide, shouldServeHitNet, triggerFeedback, tutorial]);

  const startGame = () => {
    matchReportedRef.current = false;
    setGameState(prev => ({
      ...prev,
      player: { ...prev.player, score: 0 },
      opponent: { ...prev.opponent, score: 0 },
      status: GameStatus.PLAYING,
    }));
    setRallyCount(0);
    initialServerRef.current = 'player';
    setServePointIndex(0);
    setServer(getServerForPoint(0));
    setServeSide(getServeSideForPoint(0));
    setServeNumber(1);
    setIsServePending(true);
    serveInProgressRef.current = false;
    setBallBounced(false);
    aiTargetXRef.current = 50;
    aiTargetYRef.current = aiHomeY;
    const resetAiPos = { x: 50, y: aiHomeY };
    setAiPos(resetAiPos);
    currentAiPosRef.current = resetAiPos;
  };

  useEffect(() => {
    if (tutorial && gameState.status === GameStatus.START) {
      startGame();
    }
  }, [gameState.status, startGame, tutorial]);

  const serveUiStats = getServeStats('player');
  const serveNetChance = tutorial ? 0 : getServeNetChance(serveUiStats.spin);
  const serveDebug = isServePending && server === 'player'
    ? {
        x: getServeTargetX('player', serveSide, serveTarget),
        y: SERVE_TARGET_Y.top,
        radius: isTutorialOpeningServe
          ? 0
          : ((100 - Math.min(100, Math.max(0, serveUiStats.control))) / 100) * SERVE_JITTER_MAX,
        visible: true,
      }
    : undefined;
  const aiVolleyDebugTarget = currentAnimDuration > 0 && !ballHasBouncedRef.current
    ? { x: extendShotToY(shotStartPosRef.current, shotEndPosRef.current, AI_VOLLEY_ZONE_Y), y: AI_VOLLEY_ZONE_Y }
    : undefined;
  const itemById = useMemo(() => new Map(shopItems.map(item => [item.id, item])), [shopItems]);
  const rosterTarget = rosterOpen === 'player'
    ? { name: playerLabel, subtitle: 'Pro', loadout: playerLoadout, portrait: playerPortrait }
    : rosterOpen === 'opponent'
      ? { name: opponentLabel, subtitle: aiProfile.name, loadout: aiLoadout, portrait: opponentPortrait }
      : null;

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-center select-none bg-slate-950 text-white overflow-hidden font-inter">
      {/* Header UI */}
      {!tutorial && (
        <div className="absolute top-6 w-full max-w-5xl px-8 flex justify-between items-start z-30 pointer-events-none">
          <div className="flex flex-col items-start bg-blue-900/40 p-5 rounded-2xl border border-blue-500/30 backdrop-blur-md shadow-2xl">
            <span className="text-[10px] font-orbitron text-blue-400 tracking-[0.2em] uppercase mb-1">YOU</span>
            <span className="text-6xl font-orbitron font-bold tracking-tighter">{gameState.player.score}</span>
          </div>

          <div className="flex flex-col items-end bg-red-900/40 p-5 rounded-2xl border border-red-500/30 backdrop-blur-md shadow-2xl">
            <span className="text-[10px] font-orbitron text-red-400 tracking-[0.2em] uppercase mb-1">AI</span>
            <span className="text-6xl font-orbitron font-bold tracking-tighter">{gameState.opponent.score}</span>
          </div>
        </div>
      )}

      {!tutorial && (
        <div className="absolute top-28 left-6 z-30 pointer-events-auto">
          <button
            type="button"
            onClick={() => setRosterOpen('player')}
            className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-900 border-2 border-white flex items-center justify-center overflow-hidden text-[10px] font-black">
              {playerPortrait ? (
                <img src={playerPortrait} alt="Player portrait" className="w-full h-full object-cover" />
              ) : (
                'YOU'
              )}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2 text-[10px] font-orbitron uppercase tracking-widest text-white">
                <span>{playerLabel}</span>
                {playerRankLabel && <span className="text-slate-300">{playerRankLabel}</span>}
              </div>
              <div className="text-[9px] uppercase tracking-widest text-slate-400">View loadout</div>
            </div>
          </button>
        </div>
      )}

      {!tutorial && (
        <div className="absolute top-28 right-6 z-30 pointer-events-auto">
          <button
            type="button"
            onClick={() => setRosterOpen('opponent')}
            className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10 transition-all"
          >
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 text-[10px] font-orbitron uppercase tracking-widest text-white">
                <span>{opponentLabel}</span>
                {opponentRankLabel && <span className="text-slate-300">{opponentRankLabel}</span>}
              </div>
              <div className="text-[9px] uppercase tracking-widest text-slate-400">View loadout</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-900 border-2 border-white flex items-center justify-center overflow-hidden text-[9px] font-black">
              {opponentPortrait ? (
                <img src={opponentPortrait} alt={`${opponentLabel} portrait`} className="w-full h-full object-cover" />
              ) : (
                'AI'
              )}
            </div>
          </button>
        </div>
      )}

      {onExit && (
        <div className="absolute top-6 right-6 z-40 pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Leave the game? You will forfeit this match.')) {
                onExit();
              }
            }}
            className="px-4 py-2 rounded-full text-[10px] font-orbitron uppercase tracking-widest border border-white/20 bg-white/10 text-white/80 hover:bg-white/20 transition-all"
          >
            Leave
          </button>
        </div>
      )}

      {!tutorial && (
        <div className="absolute bottom-6 left-6 z-30 pointer-events-none">
          <div className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 backdrop-blur-md">
            <div className="text-[10px] font-orbitron uppercase tracking-widest text-slate-400">Tournament</div>
            <div className="mt-1 text-xl font-orbitron font-black uppercase tracking-[0.18em] text-white">
              {tournamentName || 'Exhibition'}
            </div>
            <div className="mt-2 text-[10px] font-orbitron uppercase tracking-widest text-slate-300">
              {tournamentRound || 'Match'}
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-6 right-6 z-30 pointer-events-auto">
        <div className="bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl px-5 py-4">
          <div className="text-[10px] font-orbitron uppercase tracking-widest text-white/70">
            {serveNumber === 1 ? '1st serve' : '2nd serve'}
          </div>
          {isServePending && server === 'player' && (
            <>
              <div className="mt-3">
                <div className="flex items-center justify-between text-[9px] font-orbitron uppercase tracking-widest text-white/60">
                  <span>Net Risk</span>
                  <span>{Math.round(serveNetChance * 100)}%</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 via-yellow-300 to-red-500"
                    style={{ width: `${Math.max(0, Math.min(100, serveNetChance * 100))}%` }}
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setServeTarget('wide')}
                  className={`px-3 py-1 rounded-full text-[10px] font-orbitron uppercase tracking-widest border transition-all ${serveTarget === 'wide' ? 'bg-white text-slate-900 border-white' : 'bg-white/5 text-white/70 border-white/20 hover:bg-white/10'}`}
                >
                  Wide
                </button>
                <button
                  type="button"
                  onClick={() => setServeTarget('middle')}
                  className={`px-3 py-1 rounded-full text-[10px] font-orbitron uppercase tracking-widest border transition-all ${serveTarget === 'middle' ? 'bg-white text-slate-900 border-white' : 'bg-white/5 text-white/70 border-white/20 hover:bg-white/10'}`}
                >
                  Middle
                </button>
              </div>
            </>
          )}
          <div className="mt-4 border-t border-white/10 pt-3 text-[9px] font-orbitron uppercase tracking-widest text-white/70">
            <div className="flex items-center justify-between">
              <span>Speed (mph)</span>
              <span>{Math.round(playerSpeedDebug.speedMph)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-white/50">
              <span>Stamina</span>
              <span>{Math.round(playerSpeedDebug.staminaFactor * 100)}%</span>
            </div>
          </div>
        </div>
      </div>

      {rosterTarget && (
        <div className="absolute inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <style>{`
            @keyframes subtleGlow {
              0%, 100% {
                box-shadow: inset 0 0 0 1px rgba(253,230,138,0.35), inset 0 0 18px rgba(250,204,21,0.2);
              }
              50% {
                box-shadow: inset 0 0 0 1px rgba(254,240,138,0.45), inset 0 0 24px rgba(250,204,21,0.32);
              }
            }
          `}</style>
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-950/90 p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {rosterTarget.portrait && (
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 bg-black/30">
                    <img src={rosterTarget.portrait} alt={`${rosterTarget.name} portrait`} className="w-full h-full object-cover" />
                  </div>
                )}
                <div>
                  <div className="text-xs font-orbitron uppercase tracking-widest text-slate-400">Loadout & Stats</div>
                  <div className="mt-2 text-2xl font-orbitron uppercase tracking-widest">{rosterTarget.name}</div>
                  <div className="mt-2 text-[10px] uppercase tracking-widest text-slate-400">
                    {rosterTarget.subtitle}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRosterOpen(null)}
                className="px-3 py-1 rounded-full text-[10px] font-orbitron uppercase tracking-widest border border-white/20 bg-white/10 text-white/80 hover:bg-white/20 transition-all"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] uppercase tracking-widest text-slate-300">
              {([
                { label: '1st Serve', id: rosterTarget.loadout.serveFirst },
                { label: '2nd Serve', id: rosterTarget.loadout.serveSecond },
                { label: 'Forehand', id: rosterTarget.loadout.forehand },
                { label: 'Backhand', id: rosterTarget.loadout.backhand },
                { label: 'Volley', id: rosterTarget.loadout.volley },
                { label: 'Athleticism', id: rosterTarget.loadout.athleticism },
              ]).map(slot => {
                const item = itemById.get(slot.id);
                const tierStyle = item?.tier === 'unique'
                  ? 'border-yellow-300/70 bg-[linear-gradient(135deg,rgba(253,230,138,0.28),rgba(250,204,21,0.2),rgba(161,98,7,0.35))] shadow-[inset_0_0_0_1px_rgba(254,243,199,0.4),inset_0_0_22px_rgba(250,204,21,0.25)]'
                  : item?.tier === 'legendary'
                    ? 'border-purple-300/60 bg-purple-500/10'
                  : item?.tier === 'elite'
                    ? 'border-sky-400/60 bg-sky-500/10'
                    : item?.tier === 'pro'
                      ? 'border-emerald-400/60 bg-emerald-500/10'
                      : 'border-slate-400/50 bg-slate-500/10';
                const tierGlowStyle = item?.tier === 'unique'
                  ? { animation: 'subtleGlow 6s ease-in-out infinite' }
                  : undefined;
                return (
                  <div key={slot.label} className={`rounded-2xl border px-4 py-3 ${tierStyle}`} style={tierGlowStyle}>
                    <div className="flex items-center justify-between">
                      <span>{slot.label}</span>
                      <span className="text-slate-400">{item?.player || 'Unknown'}</span>
                    </div>
                    <div className="mt-2 text-[9px] text-slate-400">
                      {item?.id || slot.id}
                    </div>
                    {item?.shot === 'volley' ? (
                      <div className="mt-3 flex gap-2">
                        <span className="bg-black/40 rounded-full px-3 py-1">CTR {(item.stats as any).control}</span>
                        <span className="bg-black/40 rounded-full px-3 py-1">ACC {(item.stats as any).accuracy}</span>
                      </div>
                    ) : item?.shot === 'athleticism' ? (
                      <div className="mt-3 flex gap-2">
                        <span className="bg-black/40 rounded-full px-3 py-1">SPD {(item.stats as any).speed}</span>
                        <span className="bg-black/40 rounded-full px-3 py-1">STM {(item.stats as any).stamina}</span>
                      </div>
                    ) : (
                      <div className="mt-3 flex gap-2">
                        <span className="bg-black/40 rounded-full px-3 py-1">PWR {(item?.stats as any)?.power}</span>
                        <span className="bg-black/40 rounded-full px-3 py-1">SPN {(item?.stats as any)?.spin}</span>
                        <span className="bg-black/40 rounded-full px-3 py-1">CTR {(item?.stats as any)?.control}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Game Court */}
      <div className="relative w-full h-full flex items-center justify-center">
        <Court 
          ballPosition={ballPos}
          ballHitPosition={ballHitPos}
          playerPosition={playerPos} 
          aiPosition={aiPos} 
          playerHitRadiusFH={playerHitRadiusFH}
          playerHitRadiusBH={playerHitRadiusBH}
          playerVolleyRadius={playerVolleyRadius}
          aiHitRadiusFH={aiHitRadiusFH}
          aiHitRadiusBH={aiHitRadiusBH}
          surface={surface}
          serveDebug={serveDebug}
          aiVolleyZoneY={AI_VOLLEY_ZONE_Y}
          aiVolleyTarget={aiVolleyDebugTarget}
          aiRunTarget={aiRunTarget}
          aiSwinging={isAiSwinging}
          animationDuration={currentAnimDuration}
          ballTimingFunction={ballTimingFunction}
          ballHasBounced={ballHasBounced}
          aiLastStroke={aiLastStroke}
          aiVolleySwinging={isAiVolleySwinging}
          lastStroke={lastStroke}
          isSwinging={isSwinging}
          isVolleySwinging={isVolleySwinging}
          bounceMarkers={bounceMarkers}
          tutorialTargets={tutorial?.targets}
          tutorialZone={tutorial?.dropshotZone}
        />

        {tutorial?.instructionPrimary && (
          <div className="absolute top-24 right-6 z-40 w-80 space-y-4 pointer-events-none">
            <div className="rounded-3xl border border-white/20 bg-black/60 px-5 py-4 shadow-[0_0_24px_rgba(15,23,42,0.8)] animate-tutorial-pop">
              <div className="text-[9px] font-orbitron uppercase tracking-widest text-slate-300">
                Tutorial Tip
              </div>
              <div className="mt-2 text-[11px] uppercase tracking-widest text-slate-100">
                {tutorial.instructionPrimary}
              </div>
            </div>
            {tutorial.instructionSecondary && (
              <div className="rounded-3xl border border-white/20 bg-black/60 px-5 py-4 shadow-[0_0_24px_rgba(15,23,42,0.8)] animate-tutorial-pop-delayed">
                <div className="text-[9px] font-orbitron uppercase tracking-widest text-slate-300">
                  Timing Tip
                </div>
                <div className="mt-2 text-[11px] uppercase tracking-widest text-slate-100">
                  {tutorial.instructionSecondary}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Shot Meter Slider */}
        {isMeterActive && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-64 h-12 flex flex-col items-center z-40 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 p-2 shadow-2xl transition-all duration-300">
            <div className="w-full h-2 bg-slate-800 rounded-full relative overflow-hidden">
              <div className="absolute top-0 bottom-0 left-[40%] right-[40%] bg-emerald-500/50 shadow-[0_0:10px_rgba(16,185,129,0.5)]" />
              <div 
                className={`absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_white] transition-all ${isMeterHolding ? 'duration-500 opacity-100 scale-y-150' : 'duration-75'}`}
                style={{ left: `${meterValue}%` }}
              />
            </div>
            <div className="flex justify-between w-full mt-1 px-1">
              <span className="text-[7px] font-orbitron text-slate-500">EARLY</span>
              <span className="text-[7px] font-orbitron text-emerald-400 font-bold uppercase">Perfect Zone</span>
              <span className="text-[7px] font-orbitron text-slate-500">LATE</span>
            </div>
          </div>
        )}

        {feedback && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 text-center">
            <h2 className="text-7xl font-orbitron font-black text-white italic drop-shadow-[0_0_40px_rgba(0,0,0,0.8)] animate-bounce uppercase tracking-tighter">
              {feedback}
            </h2>
          </div>
        )}
      </div>

      {/* Start Screen */}
      {gameState.status === GameStatus.START && !tutorial && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center p-12 text-center">
          <div className="text-[10px] font-orbitron uppercase tracking-widest text-slate-400">
            {tournamentName || 'Pro Tennis'}
          </div>
          <h2 className="mt-2 text-3xl font-orbitron font-black mb-6 uppercase tracking-[0.3em] text-white">
            {tournamentRound || 'Round of 16'}
          </h2>

          {gameState.status === GameStatus.START && (
            <div className="w-full max-w-4xl rounded-3xl border border-white/10 bg-white/5 px-8 py-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 items-center">
                <div className="flex flex-col gap-4 text-left">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0 text-right">
                      <div className="text-[10px] uppercase tracking-widest text-slate-400">You</div>
                      <div className="flex items-center justify-end gap-2 text-xl font-orbitron uppercase tracking-widest text-white">
                        <span>{playerLabel}</span>
                        {playerRankLabel && <span className="text-slate-300 text-base">{playerRankLabel}</span>}
                      </div>
                    </div>
                    <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-white/20 bg-black/30">
                      {playerPortrait ? (
                        <img src={playerPortrait} alt={`${playerLabel} portrait`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-orbitron">YOU</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-4xl font-orbitron font-black uppercase tracking-[0.3em] text-white/80">VS</div>
                </div>

                <div className="flex flex-col gap-4 text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-white/20 bg-black/30">
                      {opponentPortrait ? (
                        <img src={opponentPortrait} alt={`${opponentLabel} portrait`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-orbitron">AI</div>
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-400">Opponent</div>
                      <div className="flex items-center gap-2 text-lg font-orbitron uppercase tracking-widest text-white">
                        <span>{opponentLabel}</span>
                        {opponentRankLabel && <span className="text-slate-300 text-sm">{opponentRankLabel}</span>}
                      </div>
                      <div className="mt-1 text-[9px] uppercase tracking-widest text-slate-400">{aiProfile.name}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    key={startLoadingKey}
                    className="h-full bg-gradient-to-r from-emerald-400 via-sky-400 to-purple-400"
                    style={{ width: '0%', animation: 'matchLoad 2s linear forwards' }}
                  />
                </div>
                <div className="mt-2 text-[9px] uppercase tracking-widest text-slate-500">
                  Warming up...
                </div>
              </div>
            </div>
          )}
          
          {gameState.status !== GameStatus.START || showStartButton ? (
            <button 
              onClick={startGame}
              className="group relative px-12 py-5 bg-white text-slate-950 font-orbitron text-xl font-black rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_60px_rgba(255,255,255,0.2)]"
            >
              <span className="relative z-10">{gameState.status === GameStatus.START ? "START MATCH" : "REMATCH"}</span>
            </button>
          ) : null}
          
          <div className="mt-12 text-slate-400 font-orbitron text-sm tracking-widest flex flex-col gap-2">
            <p>ARROWS: MOVE</p>
            <p>SPACE: SWING (TIME IT IN THE ZONE!)</p>
          </div>
        </div>
      )}
      <style>{`
        @keyframes matchLoad {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes tutorialPop {
          0% { opacity: 0; transform: translateY(-8px) scale(0.98); }
          60% { opacity: 1; transform: translateY(0) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-tutorial-pop {
          animation: tutorialPop 0.45s ease-out both;
        }
        .animate-tutorial-pop-delayed {
          animation: tutorialPop 0.55s ease-out both;
          animation-delay: 0.08s;
        }
      `}</style>
    </div>
  );
};

export default Game;
