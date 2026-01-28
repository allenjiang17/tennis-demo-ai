
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AiProfile, GameStatus, ShotQuality, GameState, PlayerStats } from './types';
import { PHYSICS, MESSAGES } from './constants';
import Court from './components/Court';

const AI_COURT_BOUNDS = { MIN_Y: 0, MAX_Y: 45 };
const SERVE_BASE_DURATION = 900;
const SERVE_TARGET_Y = { top: 30, bottom: 70 };
const SERVE_NET_Y = 50;
const SERVE_JITTER_MAX = 30;
const SERVE_BOX_Y = { topMin: 25, topMax: 50, bottomMin: 50, bottomMax: 75 };
const SERVE_TARGET_X = {
  deuce: { wide: 10, middle: 45 },
  ad: { wide: 85, middle: 55 },
};
const VOLLEY_TARGET_Y = 26;
const AI_VOLLEY_ZONE_Y = 34;

type GameProps = {
  playerStats: PlayerStats;
  aiStats: PlayerStats;
  aiProfile: AiProfile;
  onExit?: () => void;
};

const Game: React.FC<GameProps> = ({ playerStats, aiStats, aiProfile, onExit }) => {
  const [gameState, setGameState] = useState<GameState>({
    player: { score: 0, name: 'Pro' },
    opponent: { score: 0, name: 'Master AI' },
    status: GameStatus.START,
    isPlayerTurn: false,
    lastShotQuality: ShotQuality.NONE,
    difficulty: 1,
  });

  const [ballPos, setBallPos] = useState({ x: 50, y: 10 });
  const [ballHitPos, setBallHitPos] = useState({ x: 50, y: 10 });
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 85 });
  const [aiPos, setAiPos] = useState({ x: 50, y: 4 });
  const currentAiPosRef = useRef(aiPos);
  const [lastStroke, setLastStroke] = useState<'FH' | 'BH' | null>(null);
  const [isSwinging, setIsSwinging] = useState(false);
  const [isAiSwinging, setIsAiSwinging] = useState(false);
  const [commentary, setCommentary] = useState("Ready to dominate?");
  const [feedback, setFeedback] = useState("");
  const [rallyCount, setRallyCount] = useState(0);
  const [currentAnimDuration, setCurrentAnimDuration] = useState(0);
  const [bounceMarkers, setBounceMarkers] = useState<any[]>([]);
  const [server, setServer] = useState<'player' | 'opponent'>('player');
  const [serveSide, setServeSide] = useState<'deuce' | 'ad'>('deuce');
  const [servePointIndex, setServePointIndex] = useState(0);
  const [serveNumber, setServeNumber] = useState(1);
  const [isServePending, setIsServePending] = useState(true);
  const [serveTarget, setServeTarget] = useState<'wide' | 'middle'>('wide');
  
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
  const shotStartPosRef = useRef({ x: 50, y: 10 });
  const shotEndPosRef = useRef({ x: 50, y: 100 });
  const currentPlayerPosRef = useRef(playerPos);
  const ballHitPosRef = useRef(ballHitPos);
  const aiTargetXRef = useRef<number>(50);
  const aiTargetYRef = useRef<number>(4);
  const ballHasBouncedRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const serveInProgressRef = useRef(false);
  const initialServerRef = useRef<'player' | 'opponent'>('player');

  useEffect(() => {
    currentPlayerPosRef.current = playerPos;
  }, [playerPos]);

  useEffect(() => {
    currentAiPosRef.current = aiPos;
  }, [aiPos]);

  // Helper to show feedback briefly
  const triggerFeedback = useCallback((text: string, duration = 800) => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setFeedback(text);
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback("");
    }, duration);
  }, []);

  const getPlayerSpeed = useCallback(() => {
    const speedStat = Math.max(0, Math.min(100, playerStats.athleticism.speed));
    const staminaStat = Math.max(0, Math.min(100, playerStats.athleticism.stamina));
    const baseMultiplier = 0.8+ (speedStat / 100) * 0.8;
    const baseSpeed = PHYSICS.PLAYER_SPEED * baseMultiplier;
    const fatigueRate = (1 - staminaStat / 100) * 0.05;
    const staminaFactor = Math.max(0.6, 1 - rallyCount * fatigueRate);
    return baseSpeed * staminaFactor;
  }, [playerStats.athleticism.speed, playerStats.athleticism.stamina, rallyCount]);

  const getAiSpeed = useCallback(() => {
    const speedStat = Math.max(0, Math.min(100, aiStats.athleticism.speed));
    const staminaStat = Math.max(0, Math.min(100, aiStats.athleticism.stamina));
    const baseMultiplier = 0.8 + (speedStat / 100) * 0.8;
    const baseSpeed = PHYSICS.PLAYER_SPEED * baseMultiplier * 0.85;
    const fatigueRate = (1 - staminaStat / 100) * 0.05;
    const staminaFactor = Math.max(0.6, 1 - rallyCount * fatigueRate);
    return baseSpeed * staminaFactor;
  }, [aiStats.athleticism.speed, aiStats.athleticism.stamina, rallyCount]);

  const playerSpeedDebug = useMemo(() => {
    const speedStat = Math.max(0, Math.min(100, playerStats.athleticism.speed));
    const staminaStat = Math.max(0, Math.min(100, playerStats.athleticism.stamina));
    const baseMultiplier = 0.8 + (speedStat / 100) * 0.8;
    const baseSpeed = PHYSICS.PLAYER_SPEED * baseMultiplier;
    const fatigueRate = (1 - staminaStat / 100) * 0.05;
    const staminaFactor = Math.max(0.6, 1 - rallyCount * fatigueRate);
    const actualSpeed = baseSpeed * staminaFactor;
    return { baseSpeed, staminaFactor, actualSpeed };
  }, [playerStats.athleticism.speed, playerStats.athleticism.stamina, rallyCount]);

  const aiHomeY = useMemo(
    () => Math.max(AI_COURT_BOUNDS.MIN_Y, Math.min(AI_COURT_BOUNDS.MAX_Y, aiProfile.tendencies.homeY)),
    [aiProfile.tendencies.homeY]
  );

  // Movement loop
  useEffect(() => {
    let frameId: number;
    const moveLoop = () => {
      if (gameState.status === GameStatus.PLAYING) {
        // Player Movement
        const playerSpeed = getPlayerSpeed();
        setPlayerPos(prev => {
          if (isServePending && server === 'player') {
            return prev;
          }
          let newX = prev.x;
          let newY = prev.y;
          if (keysPressed.current.has('ArrowLeft')) newX -= playerSpeed;
          if (keysPressed.current.has('ArrowRight')) newX += playerSpeed;
          if (keysPressed.current.has('ArrowUp')) newY -= playerSpeed;
          if (keysPressed.current.has('ArrowDown')) newY += playerSpeed;
          return {
            x: Math.max(PHYSICS.PLAYER_BOUNDS.MIN_X, Math.min(PHYSICS.PLAYER_BOUNDS.MAX_X, newX)),
            y: Math.max(PHYSICS.PLAYER_BOUNDS.MIN_Y, Math.min(PHYSICS.PLAYER_BOUNDS.MAX_Y, newY))
          };
        });

        // AI Movement
        const aiSpeed = getAiSpeed();
        setAiPos(prev => {
          const dx = aiTargetXRef.current - prev.x;
          const dy = aiTargetYRef.current - prev.y;
          const nextX = Math.abs(dx) < aiSpeed ? aiTargetXRef.current : prev.x + Math.sign(dx) * aiSpeed;
          const nextY = Math.abs(dy) < aiSpeed ? aiTargetYRef.current : prev.y + Math.sign(dy) * aiSpeed;
          return {
            x: nextX,
            y: Math.max(AI_COURT_BOUNDS.MIN_Y, Math.min(AI_COURT_BOUNDS.MAX_Y, nextY)),
          };
        });

        // Update live ball position for hit checks and UI cues
        const now = performance.now();
        const elapsed = now - shotStartTimeRef.current;
        const progress = Math.min(1, shotDurationRef.current > 0 ? elapsed / shotDurationRef.current : 1);
        const liveBallX = shotStartPosRef.current.x + (shotEndPosRef.current.x - shotStartPosRef.current.x) * progress;
        const liveBallY = shotStartPosRef.current.y + (shotEndPosRef.current.y - shotStartPosRef.current.y) * progress;
        const liveBallPos = { x: liveBallX, y: liveBallY };
        setBallHitPos(liveBallPos);
        ballHitPosRef.current = liveBallPos;

        // Update Meter based on ball proximity to player's hitting line
        if (isBallLiveRef.current && !isMeterHolding) {
          const dx = liveBallX - currentPlayerPosRef.current.x;
          const stroke = dx < 0 ? 'BH' : 'FH';
          const hitRadius = ballHasBouncedRef.current
            ? (stroke === 'FH' ? playerHitRadiusFH : playerHitRadiusBH)
            : (stroke === 'FH' ? playerVolleyRadiusFH : playerVolleyRadiusBH);
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

  const playHitSound = useCallback((isPlayer: boolean) => {
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

  const addBounceMarker = useCallback((x: number, y: number) => {
    const id = Date.now();
    setBounceMarkers(prev => [...prev.slice(-10), { id, x, y, opacity: 0.8 }]);
    setTimeout(() => {
      setBounceMarkers(prev => prev.map(m => m.id === id ? { ...m, opacity: 0 } : m));
    }, 600);
  }, []);

  const playServeFault = useCallback((start: { x: number; y: number }, target: { x: number; y: number }, duration: number) => {
    isBallLiveRef.current = false;
    setCurrentAnimDuration(0);
    setBallPos({ x: start.x, y: start.y });
    shotStartPosRef.current = { x: start.x, y: start.y };
    shotEndPosRef.current = { x: target.x, y: target.y };
    shotStartTimeRef.current = performance.now();
    shotDurationRef.current = duration;
    setTimeout(() => {
      setCurrentAnimDuration(duration);
      setBallPos({ x: target.x, y: target.y });
    }, 20);
  }, []);

  const triggerAiCommentary = async (quality: ShotQuality) => {
    const text = 'Wow!';
    setCommentary(text);
  };

  const getPowerDuration = useCallback((baseDuration: number, power: number) => {
    const multiplier = 1.2 - (power / 100) * 0.4;
    return Math.max(200, baseDuration * multiplier);
  }, []);


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
    0.8 + (shape / 100) * 0.7
  ), []);

  const getVolleyTimingScale = useCallback((accuracy: number) => (
    2.2 - (Math.max(0, Math.min(100, accuracy)) / 100) * 1.4
  ), []);

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
    const isOnOpponentSide = (y: number) => (isToTop ? y <= 50 : y >= 50);
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
  const playerVolleyRadiusFH = getControlRadius(playerStats.forehandVolley.control);
  const playerVolleyRadiusBH = getControlRadius(playerStats.backhandVolley.control);
  const aiHitRadiusFH = getControlRadius(aiStats.forehand.control);
  const aiHitRadiusBH = getControlRadius(aiStats.backhand.control);
  const aiVolleyRadiusFH = getControlRadius(aiStats.forehandVolley.control);
  const aiVolleyRadiusBH = getControlRadius(aiStats.backhandVolley.control);

  const resetPoint = useCallback((winner: 'player' | 'opponent') => {
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
    triggerFeedback(winner === 'player' ? "POINT!" : "MISS!", 1000);
    aiTargetXRef.current = 50; // Recover to center
    aiTargetYRef.current = aiHomeY;
    
    setTimeout(() => {
      setCurrentAnimDuration(0);
      setBallPos({ x: 50, y: 10 });
      setPlayerPos({ x: 50, y: 85 });
      const resetAiPos = { x: 50, y: aiHomeY };
      setAiPos(resetAiPos);
      currentAiPosRef.current = resetAiPos;
      setLastStroke(null);
      setGameState(prev => {
        if (prev.player.score >= 10 || prev.opponent.score >= 10) return { ...prev, status: GameStatus.GAME_OVER };
        return { ...prev, status: GameStatus.PLAYING };
      });
      if (gameState.player.score < 5 && gameState.opponent.score < 5) {
        setIsServePending(true);
        serveInProgressRef.current = false;
      }
    }, 1000); 
  }, [aiHomeY, gameState.player.score, gameState.opponent.score, getServerForPoint, getServeSideForPoint, triggerFeedback]);

  const schedulePlayerMiss = useCallback((delayMs: number, label: string) => {
    const check = () => {
      if (!isBallLiveRef.current) return;
      const player = currentPlayerPosRef.current;
      const ball = ballHitPosRef.current;
      const dx = ball.x - player.x;
      const hitRadius = dx < 0 ? playerHitRadiusBH : playerHitRadiusFH;
      if (ball.y < player.y + hitRadius * 0.3) {
        missTimeoutRef.current = setTimeout(check, 80);
        return;
      }
      triggerFeedback(label, 600);
      resetPoint('opponent');
    };
    if (missTimeoutRef.current) clearTimeout(missTimeoutRef.current);
    missTimeoutRef.current = setTimeout(check, delayMs);
  }, [playerHitRadiusBH, playerHitRadiusFH, resetPoint, triggerFeedback]);
  
  const startAiShot = useCallback((startOverride?: { x: number; y: number }) => {
    setIsAiSwinging(true);
    setTimeout(() => setIsAiSwinging(false), 250);
    const startX = startOverride?.x ?? currentAiPosRef.current.x;
    const startY = startOverride?.y ?? currentAiPosRef.current.y;
    const timingFactor = Math.max(-1, Math.min(1, (Math.random() * 2 - 1)));
    const playerX = currentPlayerPosRef.current.x;
    const isDropShot = Math.random() < aiProfile.tendencies.dropShotChance;
    const baseTargetY = isDropShot ? 54 : 72;
    const awayAnchor = playerX < 50 ? 80 : 20;
    const towardX = playerX + (Math.random() * 12 - 6);
    const awayX = awayAnchor + (Math.random() * 10 - 5);
    const endX = Math.random() < aiProfile.tendencies.awayBias ? awayX : towardX;
    const outY = 112;
    const aiStroke = ballHitPosRef.current.x < startX ? 'BH' : 'FH';
    const aiShotStats = aiStats[aiStroke === 'FH' ? 'forehand' : 'backhand'];
    const baseDuration = Math.max(1600, PHYSICS.BALL_SPEED_BASE - (rallyCount * 80));
    const duration = getPowerDuration(baseDuration, aiShotStats.power);
    const outDuration = duration;

    setCurrentAnimDuration(0);
    setBallPos({ x: startX, y: startY });
    
    setTimeout(() => {
      playHitSound(false);
      isBallLiveRef.current = true;
      shotStartTimeRef.current = performance.now();
      shotDurationRef.current = duration;
      const shapedEndX = endX + timingFactor * 12;
      const targetPoint = getInBoundsTarget(startX, startY, shapedEndX, baseTargetY);
      const bounce = getBouncePoint(startX, startY, targetPoint.x, targetPoint.y, aiShotStats.power, aiShotStats.spin);
      const isOut = isOutOfBounds(bounce.x, bounce.y);
      shotStartPosRef.current = { x: startX, y: startY };
      shotEndPosRef.current = { x: bounce.x, y: bounce.y };
      setCurrentAnimDuration(duration);
      setBallPos({ x: bounce.x, y: bounce.y });
      if (isDropShot) {
        triggerFeedback("DROP SHOT!", 600);
      } else {
        triggerFeedback(timingFactor < -0.3 ? "CROSS COURT!" : timingFactor > 0.3 ? "DOWN THE LINE!" : "CLEAN HIT!", 600);
      }
      ballHasBouncedRef.current = false;
      
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
          const dropStopY = Math.min(PHYSICS.COURT_BOUNDS.MAX_Y + 5, bounce.y + 6);
          const dropStopX = extendShotToY({ x: startX, y: startY }, { x: bounce.x, y: bounce.y }, dropStopY);
          const segmentY = Math.abs(dropStopY - bounce.y);
          const fullY = Math.abs(bounce.y - startY);
          const stopDuration = Math.max(120, outDuration * (fullY > 0 ? segmentY / fullY : 0.2));
          ballHasBouncedRef.current = true;
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

        const segmentY = Math.abs(outY - bounce.y);
        const fullY = Math.abs(bounce.y - startY);
        const postBounceDuration = Math.max(120, outDuration * (fullY > 0 ? segmentY / fullY : 0.4));
        ballHasBouncedRef.current = true;
        shotStartTimeRef.current = performance.now();
        shotDurationRef.current = postBounceDuration;
        const travelX = bounce.x - startX;
        const travelY = bounce.y - startY;
        const continuationT = travelY !== 0 ? (outY - bounce.y) / travelY : 0;
        const outX = bounce.x + travelX * continuationT;
        shotStartPosRef.current = { x: bounce.x, y: bounce.y };
        shotEndPosRef.current = { x: outX, y: outY };
        setCurrentAnimDuration(postBounceDuration);
        setBallPos({ x: outX, y: outY });

        schedulePlayerMiss(postBounceDuration, "OUT! ❌");
      }, duration);
    }, 50);
  }, [addBounceMarker, aiHomeY, aiProfile.tendencies.awayBias, aiProfile.tendencies.dropShotChance, aiStats, extendShotToY, getBouncePoint, getInBoundsTarget, getPowerDuration, isOutOfBounds, playHitSound, rallyCount, resetPoint, schedulePlayerMiss, triggerFeedback]);

  const executePlayerShot = useCallback((params: {
    startX: number;
    startY: number;
    hitSpeed: number;
    isDropShot: boolean;
    bounceX: number;
    bounceY: number;
  }) => {
    const { startX, startY, hitSpeed, isDropShot, bounceX, bounceY } = params;
    const aiNow = currentAiPosRef.current;
    const aiVolleyCandidate = aiNow.y >= AI_VOLLEY_ZONE_Y;
    const volleyTargetX = extendShotToY({ x: startX, y: startY }, { x: bounceX, y: bounceY }, AI_VOLLEY_ZONE_Y);
    const volleyTarget = { x: volleyTargetX, y: AI_VOLLEY_ZONE_Y };
    const volleyStroke = volleyTarget.x < aiNow.x ? 'BH' : 'FH';
    const aiVolleyRadius = volleyStroke === 'FH' ? aiVolleyRadiusFH : aiVolleyRadiusBH;
    const aiVolleyDist = Math.hypot(aiNow.x - volleyTarget.x, aiNow.y - volleyTarget.y);
    const aiWillVolley = aiVolleyCandidate;
    const aiCanVolley = aiVolleyDist < aiVolleyRadius;
    const aiBounceY = bounceY;
    const dropStopY = Math.max(6, aiBounceY - 6);
    const contactY = Math.max(AI_COURT_BOUNDS.MIN_Y + 2, aiBounceY - 10);
    const dropPostBounceMultiplier = isDropShot ? 2.0 : 1;
    const isOut = isOutOfBounds(bounceX, aiBounceY);

    // AI starts moving towards where the ball will land
    if (!isOut) {
      if (aiWillVolley) {
        aiTargetXRef.current = volleyTarget.x;
        aiTargetYRef.current = volleyTarget.y;
      } else {
        aiTargetXRef.current = bounceX;
        aiTargetYRef.current = isDropShot ? dropStopY : Math.max(AI_COURT_BOUNDS.MIN_Y, contactY - 4);
      }
    }

    shotStartTimeRef.current = performance.now();
    if (aiWillVolley) {
      const distTotal = Math.hypot(bounceX - startX, aiBounceY - startY);
      const distVolley = Math.hypot(volleyTarget.x - startX, volleyTarget.y - startY);
      const volleyDuration = Math.max(120, hitSpeed * (distTotal > 0 ? distVolley / distTotal : 0.5));
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
        if (aiCanVolley) {
          startAiShot({ x: volleyTarget.x, y: volleyTarget.y });
        } else {
          triggerFeedback("MISSED!", 600);
          resetPoint('player');
        }
      }, volleyDuration);
      return;
    }

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
      addBounceMarker(bounceX, aiBounceY);
      ballHasBouncedRef.current = true;
      if (isOut) {
        triggerFeedback("OUT! ❌", 600);
        if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);
        ballTimeoutRef.current = setTimeout(() => {
          resetPoint('opponent');
        }, 600);
        return;
      }
      const dropStopX = extendShotToY({ x: startX, y: startY }, { x: bounceX, y: aiBounceY }, dropStopY);
      const contactX = extendShotToY({ x: startX, y: startY }, { x: bounceX, y: aiBounceY }, contactY);
      const aiCheckX = isDropShot ? dropStopX : contactX;
      const aiCheckY = isDropShot ? dropStopY : contactY;
      const aiNow = currentAiPosRef.current;
      const aiDistFromBall = Math.hypot(aiNow.x - aiCheckX, aiNow.y - aiCheckY);
      const aiStroke = aiCheckX < aiNow.x ? 'BH' : 'FH';
      const aiHitRadius = aiStroke === 'FH' ? aiHitRadiusFH : aiHitRadiusBH;
      const canReach = aiDistFromBall < aiHitRadius;
      const missFalloff = 40;
      const baseMiss = 0.1;
      const missScale = 0.8;
      const distanceFactor = Math.max(0, aiDistFromBall - aiHitRadius) / missFalloff;
      const aiMissChance = canReach ? 0.02 : Math.min(0.9, baseMiss + distanceFactor * missScale);

      if (!canReach && isDropShot) {
        triggerFeedback("DROPSHOT WINNER! 🏆", 600);
        const segmentY = Math.abs(aiBounceY - dropStopY);
        const fullY = Math.abs(aiBounceY - startY);
        const stopDuration = Math.max(120, hitSpeed * (fullY > 0 ? segmentY / fullY : 0.2)) * dropPostBounceMultiplier;
        shotStartTimeRef.current = performance.now();
        shotDurationRef.current = stopDuration;
        shotStartPosRef.current = { x: bounceX, y: aiBounceY };
        shotEndPosRef.current = { x: dropStopX, y: dropStopY };
        setCurrentAnimDuration(stopDuration);
        setBallPos({ x: dropStopX, y: dropStopY });

        if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);
        ballTimeoutRef.current = setTimeout(() => {
          resetPoint('player');
        }, stopDuration);
        return;
      }

      if (!canReach) {
        triggerFeedback("WINNER! 🏆", 600);
        const outY = -12;
        const outX = extendShotToY({ x: startX, y: startY }, { x: bounceX, y: aiBounceY }, outY);
        shotStartTimeRef.current = performance.now();
        const postBounceDuration = hitSpeed * dropPostBounceMultiplier;
        shotDurationRef.current = postBounceDuration;
        shotStartPosRef.current = { x: bounceX, y: aiBounceY };
        shotEndPosRef.current = { x: outX, y: outY };
        setCurrentAnimDuration(postBounceDuration);
        setBallPos({ x: outX, y: outY });

        if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);
        ballTimeoutRef.current = setTimeout(() => {
          resetPoint('player');
        }, postBounceDuration);
        return;
      }

      if (Math.random() < aiMissChance) {
        triggerFeedback("MISSED!", 600);
        if (isDropShot) {
          const segmentY = Math.abs(aiBounceY - dropStopY);
          const fullY = Math.abs(aiBounceY - startY);
          const stopDuration = Math.max(120, hitSpeed * (fullY > 0 ? segmentY / fullY : 0.2)) * dropPostBounceMultiplier;
          shotStartTimeRef.current = performance.now();
          shotDurationRef.current = stopDuration;
          shotStartPosRef.current = { x: bounceX, y: aiBounceY };
          shotEndPosRef.current = { x: dropStopX, y: dropStopY };
          setCurrentAnimDuration(stopDuration);
          setBallPos({ x: dropStopX, y: dropStopY });

          if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);
          ballTimeoutRef.current = setTimeout(() => {
            resetPoint('player');
          }, stopDuration);
        } else {
          const outY = -12;
          const outX = extendShotToY({ x: startX, y: startY }, { x: bounceX, y: aiBounceY }, outY);
          shotStartTimeRef.current = performance.now();
          const postBounceDuration = hitSpeed * dropPostBounceMultiplier;
          shotDurationRef.current = postBounceDuration;
          shotStartPosRef.current = { x: bounceX, y: aiBounceY };
          shotEndPosRef.current = { x: outX, y: outY };
          setCurrentAnimDuration(postBounceDuration);
          setBallPos({ x: outX, y: outY });

          if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);
          ballTimeoutRef.current = setTimeout(() => {
            resetPoint('player');
          }, postBounceDuration);
        }
      } else {
        if (isDropShot) {
          const segmentY = Math.abs(aiBounceY - dropStopY);
          const fullY = Math.abs(aiBounceY - startY);
          const stopDuration = Math.max(120, hitSpeed * (fullY > 0 ? segmentY / fullY : 0.2)) * dropPostBounceMultiplier;

          shotStartTimeRef.current = performance.now();
          shotDurationRef.current = stopDuration;
          shotStartPosRef.current = { x: bounceX, y: aiBounceY };
          shotEndPosRef.current = { x: dropStopX, y: dropStopY };
          setCurrentAnimDuration(stopDuration);
          setBallPos({ x: dropStopX, y: dropStopY });

          if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);
          ballTimeoutRef.current = setTimeout(() => {
            startAiShot({ x: dropStopX, y: dropStopY });
          }, stopDuration);
        } else {
          const segmentY = Math.abs(aiBounceY - contactY);
          const fullY = Math.abs(aiBounceY - startY);
          const continueDuration = Math.max(120, hitSpeed * (fullY > 0 ? segmentY / fullY : 0.3)) * dropPostBounceMultiplier;

          shotStartTimeRef.current = performance.now();
          shotDurationRef.current = continueDuration;
          shotStartPosRef.current = { x: bounceX, y: aiBounceY };
          shotEndPosRef.current = { x: contactX, y: contactY };
          setCurrentAnimDuration(continueDuration);
          setBallPos({ x: contactX, y: contactY });

          if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);
          ballTimeoutRef.current = setTimeout(() => {
            startAiShot({ x: contactX, y: contactY });
          }, continueDuration);
        }
      }
    }, hitSpeed);
  }, [addBounceMarker, aiHitRadiusBH, aiHitRadiusFH, aiVolleyRadiusBH, aiVolleyRadiusFH, extendShotToY, isOutOfBounds, resetPoint, startAiShot, triggerFeedback]);

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
        const serveDuration = getPowerDuration(SERVE_BASE_DURATION, serveStats.power);
        const p = currentPlayerPosRef.current;
        const targetX = getServeTargetX('player', serveSide, serveTarget);
        const jitter = getServeJitter(serveStats.control);
        let targetPoint = { x: targetX + jitter.x, y: SERVE_TARGET_Y.top + jitter.y };
        const netFault = shouldServeHitNet(serveStats.spin);
        const outFault = !netFault && !isServeInBox('player', serveSide, targetPoint.x, targetPoint.y);
        if (netFault) {
          targetPoint = { x: targetX, y: SERVE_NET_Y };
        }

        if (netFault || outFault) {
          triggerFeedback("FAULT!", 700);
          setIsServePending(false);
          playServeFault(p, targetPoint, serveDuration);
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
        ballHasBouncedRef.current = false;

        const serveBounce = targetPoint;

        setLastStroke(targetPoint.x < p.x ? 'BH' : 'FH');
        setIsSwinging(true);
        setTimeout(() => setIsSwinging(false), 250);
        playHitSound(true);
        executePlayerShot({
          startX: p.x,
          startY: p.y,
          hitSpeed: serveDuration,
          isDropShot: false,
          bounceX: serveBounce.x,
          bounceY: serveBounce.y,
        });
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
        ? (stroke === 'FH' ? playerVolleyRadiusFH : playerVolleyRadiusBH)
        : (stroke === 'FH' ? playerHitRadiusFH : playerHitRadiusBH);
      setLastStroke(stroke);
      setIsSwinging(true);
      setTimeout(() => setIsSwinging(false), 250);

      if (!isBallLiveRef.current) return;

      const bY = ballHitPosRef.current.y;
      const dy = bY - p.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > hitRadius) {
        if (distance < hitRadius * 1.8) {
           triggerFeedback("MISSED!", 600);
           resetPoint('opponent');
        }
        return;
      }

      // HIT SUCCESS
      playHitSound(true);
      clearTimeout(ballTimeoutRef.current);
      if (missTimeoutRef.current) clearTimeout(missTimeoutRef.current);
      isBallLiveRef.current = false;
      ballHasBouncedRef.current = false;
      setRallyCount(prev => prev + 1);

      setIsMeterHolding(true);
      setTimeout(() => {
        setIsMeterHolding(false);
        setIsMeterActive(false);
      }, 800); 

      const timingScale = isVolley
        ? getVolleyTimingScale(stroke === 'FH' ? playerStats.forehandVolley.accuracy : playerStats.backhandVolley.accuracy)
        : getTimingScale(stroke === 'FH' ? playerStats.forehand.shape : playerStats.backhand.shape);
      const timingFactor = Math.max(-1, Math.min(1, (dy / hitRadius) * timingScale));
      const lerpT = (timingFactor + 1) / 2;
      
      let targetX: number;
      if (isDropShot) {
        if (stroke === 'FH') {
          targetX = 20 + (80 - 20) * lerpT;
        } else {
          targetX = 80 + (20 - 80) * lerpT;
        }
        triggerFeedback("DROP SHOT!", 700);
      } else if (stroke === 'FH') {
        targetX = 4.5 + (95.5 - 4.5) * lerpT;
        triggerFeedback(timingFactor < -0.3 ? "CROSS COURT FH!" : timingFactor > 0.3 ? "INSIDE-OUT FH!" : "CLEAN FH!", 700);
      } else {
        targetX = 95.5 + (4.5 - 95.5) * lerpT;
        triggerFeedback(timingFactor < -0.3 ? "CROSS COURT BH!" : timingFactor > 0.3 ? "INSIDE-OUT BH!" : "CLEAN BH!", 700);
      }
      
      triggerAiCommentary(ShotQuality.PERFECT);
      const baseHitSpeed = isDropShot ? 1000 : 600;
      const hitPower = stroke === 'FH' ? playerStats.forehand.power : playerStats.backhand.power;
      const hitSpin = stroke === 'FH' ? playerStats.forehand.spin : playerStats.backhand.spin;
      const hitSpeed = getPowerDuration(baseHitSpeed, hitPower);
      const baseBounceY = isDropShot ? 40 : (isVolley ? VOLLEY_TARGET_Y : 18);
      const targetPoint = getInBoundsTarget(bX, bY, targetX, baseBounceY);
      const bounce = getBouncePoint(bX, bY, targetPoint.x, targetPoint.y, hitPower, hitSpin);
      executePlayerShot({
        startX: bX,
        startY: bY,
        hitSpeed,
        isDropShot,
        bounceX: bounce.x,
        bounceY: bounce.y,
      });
    }
  }, [executePlayerShot, gameState.status, getBouncePoint, getPowerDuration, getServeJitter, getServeStats, getServeTargetX, getTimingScale, isBallLiveRef, isServeInBox, playHitSound, playServeFault, playerHitRadiusBH, playerHitRadiusFH, resetPoint, server, serveNumber, serveSide, serveTarget, shouldServeHitNet, triggerAiCommentary, triggerFeedback, isServePending]);

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
    setBallPos({ x: serverPos.x, y: serverPos.y });
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
      setPlayerPos(prev => ({ ...prev, x: serverX, y: 100 }));
      setAiPos(prev => ({ ...prev, x: receiverX, y: 0 }));
      currentAiPosRef.current = { ...currentAiPosRef.current, x: receiverX, y: 0 };
      aiTargetXRef.current = receiverX;
      aiTargetYRef.current = 0;
    } else {
      const serverX = isDeuce ? 70 : 30;
      const receiverX = isDeuce ? 30 : 70;
      setAiPos(prev => ({ ...prev, x: serverX, y: 0 }));
      currentAiPosRef.current = { ...currentAiPosRef.current, x: serverX, y: 0 };
      setPlayerPos(prev => ({ ...prev, x: receiverX, y: 100 }));
      aiTargetXRef.current = serverX;
      aiTargetYRef.current = 0;
    }
  }, [gameState.status, isServePending, serveSide, server]);

  useEffect(() => {
    if (gameState.status !== GameStatus.PLAYING || !isServePending || server !== 'opponent') return;
    if (serveInProgressRef.current) return;
    serveInProgressRef.current = true;
    const timeoutId = setTimeout(() => {
      const serveStats = getServeStats('opponent');
      const serveDuration = getPowerDuration(SERVE_BASE_DURATION, serveStats.power);
      const start = currentAiPosRef.current;
      const serveTargetX = getServeTargetX('opponent', serveSide, Math.random() < 0.5 ? 'wide' : 'middle');
      const jitter = getServeJitter(serveStats.control);
      let targetPoint = { x: serveTargetX + jitter.x, y: SERVE_TARGET_Y.bottom + jitter.y };
      const netFault = shouldServeHitNet(serveStats.spin);
      const outFault = !netFault && !isServeInBox('opponent', serveSide, targetPoint.x, targetPoint.y);
      if (netFault) {
        targetPoint = { x: serveTargetX, y: SERVE_NET_Y };
      }

      if (netFault || outFault) {
        triggerFeedback("FAULT!", 700);
        setIsServePending(false);
        playServeFault(start, targetPoint, serveDuration);
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

      const outY = 112;
      const duration = serveDuration;

      setCurrentAnimDuration(0);
      setBallPos({ x: start.x, y: start.y });

      setTimeout(() => {
        setIsAiSwinging(true);
        setTimeout(() => setIsAiSwinging(false), 250);
        playHitSound(false);
        isBallLiveRef.current = true;
        ballHasBouncedRef.current = false;
        shotStartTimeRef.current = performance.now();
        shotDurationRef.current = duration;
        shotStartPosRef.current = { x: start.x, y: start.y };
        const serveBounce = targetPoint;
        shotEndPosRef.current = { x: serveBounce.x, y: serveBounce.y };
        setCurrentAnimDuration(duration);
        setBallPos({ x: serveBounce.x, y: serveBounce.y });

        aiTargetXRef.current = 50;
        aiTargetYRef.current = 4;

        if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);
        ballTimeoutRef.current = setTimeout(() => {
          if (!isBallLiveRef.current) return;
          addBounceMarker(serveBounce.x, serveBounce.y);
          ballHasBouncedRef.current = true;
          shotStartTimeRef.current = performance.now();
          shotDurationRef.current = duration;
          const travelX = serveBounce.x - start.x;
          const travelY = serveBounce.y - start.y;
          const continuationT = travelY !== 0 ? (outY - serveBounce.y) / travelY : 0;
          const outX = serveBounce.x + travelX * continuationT;
          shotStartPosRef.current = { x: serveBounce.x, y: serveBounce.y };
          shotEndPosRef.current = { x: outX, y: outY };
          setCurrentAnimDuration(duration);
          setBallPos({ x: outX, y: outY });

          schedulePlayerMiss(duration, "OUT! ❌");
        }, duration);
      }, 50);
    }, 600);
    return () => clearTimeout(timeoutId);
  }, [addBounceMarker, gameState.status, getPowerDuration, getServeJitter, getServeStats, getServeTargetX, isServeInBox, isServePending, playHitSound, playServeFault, resetPoint, schedulePlayerMiss, serveNumber, server, serveSide, shouldServeHitNet, triggerFeedback]);

  const startGame = () => {
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
    ballHasBouncedRef.current = false;
    aiTargetXRef.current = 50;
    aiTargetYRef.current = aiHomeY;
    const resetAiPos = { x: 50, y: aiHomeY };
    setAiPos(resetAiPos);
    currentAiPosRef.current = resetAiPos;
  };

  const serveUiStats = getServeStats('player');
  const serveNetChance = getServeNetChance(serveUiStats.spin);
  const serveDebug = isServePending && server === 'player'
    ? {
        x: getServeTargetX('player', serveSide, serveTarget),
        y: SERVE_TARGET_Y.top,
        radius: ((100 - Math.min(100, Math.max(0, serveUiStats.control))) / 100) * SERVE_JITTER_MAX,
        visible: true,
      }
    : undefined;

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-center select-none bg-slate-950 text-white overflow-hidden font-inter">
      {/* Header UI */}
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

      {onExit && (
        <div className="absolute top-6 right-6 z-40 pointer-events-auto">
          <button
            type="button"
            onClick={onExit}
            className="px-4 py-2 rounded-full text-[10px] font-orbitron uppercase tracking-widest border border-white/20 bg-white/10 text-white/80 hover:bg-white/20 transition-all"
          >
            Back To Shop
          </button>
        </div>
      )}

      <div className="absolute bottom-6 left-6 z-30 pointer-events-none">
        <h1 className="text-4xl font-orbitron font-black tracking-[0.3em] mb-2 italic text-white drop-shadow-2xl">ACE MASTER</h1>
        <div className="h-16 flex items-center justify-start">
          <p className="text-slate-400 text-[10px] font-orbitron uppercase tracking-widest text-left px-6 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm italic">
            {commentary}
          </p>
        </div>
      </div>

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
              <span>Speed</span>
              <span>{playerSpeedDebug.actualSpeed.toFixed(2)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-white/50">
              <span>Base</span>
              <span>{playerSpeedDebug.baseSpeed.toFixed(2)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-white/50">
              <span>Stamina</span>
              <span>{Math.round(playerSpeedDebug.staminaFactor * 100)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Court */}
      <div className="relative w-full h-full flex items-center justify-center">
        <Court 
          ballPosition={ballPos}
          ballHitPosition={ballHitPos}
          playerPosition={playerPos} 
          aiPosition={aiPos} 
          playerHitRadiusFH={playerHitRadiusFH}
          playerHitRadiusBH={playerHitRadiusBH}
          aiHitRadiusFH={aiHitRadiusFH}
          aiHitRadiusBH={aiHitRadiusBH}
          serveDebug={serveDebug}
          aiSwinging={isAiSwinging}
          animationDuration={currentAnimDuration}
          lastStroke={lastStroke}
          isSwinging={isSwinging}
          bounceMarkers={bounceMarkers}
        />
        
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
              <span className="text-[7px] font-orbitron text-slate-500">FRONT</span>
              <span className="text-[7px] font-orbitron text-emerald-400 font-bold uppercase">Perfect Zone</span>
              <span className="text-[7px] font-orbitron text-slate-500">BACK</span>
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

      {/* Start/GameOver Screens */}
      {(gameState.status === GameStatus.START || gameState.status === GameStatus.GAME_OVER) && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center p-12 text-center">
          <h2 className="text-8xl font-orbitron font-black mb-8 italic tracking-tighter bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent">
            {gameState.status === GameStatus.START ? "PRO TENNIS" : (gameState.player.score > gameState.opponent.score ? "CHAMPION" : "DEFEAT")}
          </h2>
          
          <button 
            onClick={startGame}
            className="group relative px-24 py-10 bg-white text-slate-950 font-orbitron text-4xl font-black rounded-full transition-all hover:scale-110 active:scale-95 shadow-[0_0_80px_rgba(255,255,255,0.2)]"
          >
            <span className="relative z-10">{gameState.status === GameStatus.START ? "START MATCH" : "REMATCH"}</span>
          </button>
          
          <div className="mt-12 text-slate-400 font-orbitron text-sm tracking-widest flex flex-col gap-2">
            <p>ARROWS: MOVE</p>
            <p>SPACE: SWING (TIME IT IN THE ZONE!)</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
