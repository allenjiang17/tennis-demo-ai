
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStatus, ShotQuality, GameState, PlayerStats } from './types';
import { PHYSICS, MESSAGES } from './constants';
import Court from './components/Court';

const AI_STATS: PlayerStats = {
  serve: { power: 40, spin: 35, control: 52, shape: 50 },
  forehand: { power: 35, spin: 30, control: 54, shape: 60 },
  backhand: { power: 70, spin: 30, control: 50, shape: 55 },
};

const AI_SPEED = 0.7; // Approximately half of player speed (0.8)
const AI_COURT_BOUNDS = { MIN_Y: 0, MAX_Y: 45 };
const SERVE_CONFIG = {
  flat: { duration: 850, faultChance: 0.28, bounceYTop: 35, bounceYBottom: 65 },
  kick: { duration: 1150, faultChance: 0.12, bounceYTop: 40, bounceYBottom: 60 },
};

type GameProps = {
  playerStats: PlayerStats;
  onExit?: () => void;
};

const Game: React.FC<GameProps> = ({ playerStats, onExit }) => {
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

  // Movement loop
  useEffect(() => {
    let frameId: number;
    const moveLoop = () => {
      if (gameState.status === GameStatus.PLAYING) {
        // Player Movement
        setPlayerPos(prev => {
          let newX = prev.x;
          let newY = prev.y;
          if (keysPressed.current.has('ArrowLeft')) newX -= PHYSICS.PLAYER_SPEED;
          if (keysPressed.current.has('ArrowRight')) newX += PHYSICS.PLAYER_SPEED;
          if (keysPressed.current.has('ArrowUp')) newY -= PHYSICS.PLAYER_SPEED;
          if (keysPressed.current.has('ArrowDown')) newY += PHYSICS.PLAYER_SPEED;
          return {
            x: Math.max(PHYSICS.PLAYER_BOUNDS.MIN_X, Math.min(PHYSICS.PLAYER_BOUNDS.MAX_X, newX)),
            y: Math.max(PHYSICS.PLAYER_BOUNDS.MIN_Y, Math.min(PHYSICS.PLAYER_BOUNDS.MAX_Y, newY))
          };
        });

        // AI Movement
        setAiPos(prev => {
          const dx = aiTargetXRef.current - prev.x;
          const dy = aiTargetYRef.current - prev.y;
          const nextX = Math.abs(dx) < AI_SPEED ? aiTargetXRef.current : prev.x + Math.sign(dx) * AI_SPEED;
          const nextY = Math.abs(dy) < AI_SPEED ? aiTargetYRef.current : prev.y + Math.sign(dy) * AI_SPEED;
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
          const hitRadius = stroke === 'FH' ? playerHitRadiusFH : playerHitRadiusBH;
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
  }, [gameState.status, isMeterHolding]);

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
    const safeY = Math.max(5, Math.min(95, y));
    setBounceMarkers(prev => [...prev.slice(-10), { id, x, y: safeY, opacity: 0.8 }]);
    setTimeout(() => {
      setBounceMarkers(prev => prev.map(m => m.id === id ? { ...m, opacity: 0 } : m));
    }, 2000);
  }, []);

  const triggerAiCommentary = async (quality: ShotQuality) => {
    const text = 'Wow!';
    setCommentary(text);
  };

  const getPowerDuration = useCallback((baseDuration: number, power: number) => {
    const multiplier = 1.2 - (power / 100) * 0.4;
    return Math.max(200, baseDuration * multiplier);
  }, []);

  const getControlRadius = useCallback((control: number) => (
    PHYSICS.HIT_RADIUS * (0.7 + (control / 100) * 0.6)
  ), []);

  const getTimingScale = useCallback((shape: number) => (
    0.8 + (shape / 100) * 0.7
  ), []);

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
      if (target === 'wide') {
        if (effectiveSide === 'deuce') return 16 + Math.random() * 8;
        return 76 + Math.random() * 8;
      }
      if (effectiveSide === 'deuce') return 40 + Math.random() * 6;
      return 54 + Math.random() * 6;
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
  const aiHitRadiusFH = getControlRadius(AI_STATS.forehand.control);
  const aiHitRadiusBH = getControlRadius(AI_STATS.backhand.control);

  const resetPoint = useCallback((winner: 'player' | 'opponent') => {
    isBallLiveRef.current = false;
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
    aiTargetYRef.current = 4;
    
    setTimeout(() => {
      setCurrentAnimDuration(0);
      setBallPos({ x: 50, y: 10 });
      setPlayerPos({ x: 50, y: 85 });
      const resetAiPos = { x: 50, y: 4 };
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
  }, [gameState.player.score, gameState.opponent.score, getServerForPoint, getServeSideForPoint, triggerFeedback]);

  const startAiShot = useCallback((startOverride?: { x: number; y: number }) => {
    setIsAiSwinging(true);
    setTimeout(() => setIsAiSwinging(false), 250);
    const startX = startOverride?.x ?? currentAiPosRef.current.x;
    const startY = startOverride?.y ?? currentAiPosRef.current.y;
    const timingFactor = Math.max(-1, Math.min(1, (Math.random() * 2 - 1)));
    const endX = Math.max(10, Math.min(90, currentPlayerPosRef.current.x + (Math.random() * 40 - 20)));
    const endY = 72;
    const outY = 112;
    const aiStroke = ballHitPosRef.current.x < startX ? 'BH' : 'FH';
    const baseDuration = Math.max(1600, PHYSICS.BALL_SPEED_BASE - (rallyCount * 80));
    const duration = getPowerDuration(baseDuration, AI_STATS[aiStroke === 'FH' ? 'forehand' : 'backhand'].power);
    const outDuration = duration;

    setCurrentAnimDuration(0);
    setBallPos({ x: startX, y: startY });
    
    setTimeout(() => {
      playHitSound(false);
      isBallLiveRef.current = true;
      shotStartTimeRef.current = performance.now();
      shotDurationRef.current = duration;
      const shapedEndX = Math.max(6, Math.min(94, endX + timingFactor * 12));
      shotStartPosRef.current = { x: startX, y: startY };
      shotEndPosRef.current = { x: shapedEndX, y: endY };
      setCurrentAnimDuration(duration);
      setBallPos({ x: shapedEndX, y: endY });
      
      // AI starts recovering to middle after hitting
      aiTargetXRef.current = 50;
      aiTargetYRef.current = 4;

      if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);
      ballTimeoutRef.current = setTimeout(() => {
        if (!isBallLiveRef.current) return;
        addBounceMarker(shapedEndX, endY);
        shotStartTimeRef.current = performance.now();
        shotDurationRef.current = outDuration;
        const travelX = shapedEndX - startX;
        const travelY = endY - startY;
        const continuationT = travelY !== 0 ? (outY - endY) / travelY : 0;
        const outX = shapedEndX + travelX * continuationT;
        shotStartPosRef.current = { x: shapedEndX, y: endY };
        shotEndPosRef.current = { x: outX, y: outY };
        setCurrentAnimDuration(outDuration);
        setBallPos({ x: outX, y: outY });

        ballTimeoutRef.current = setTimeout(() => {
          if (!isBallLiveRef.current) return;
          triggerFeedback("OUT! ❌", 600);
          resetPoint('opponent');
        }, outDuration);
      }, duration);
    }, 50);
  }, [rallyCount, resetPoint, playHitSound, addBounceMarker, triggerFeedback, aiPos.x]);

  const executePlayerShot = useCallback((params: {
    startX: number;
    startY: number;
    targetX: number;
    hitSpeed: number;
    isDropShot: boolean;
    bounceYOverride?: number;
  }) => {
    const { startX, startY, targetX, hitSpeed, isDropShot, bounceYOverride } = params;
    const aiBounceY = bounceYOverride ?? (isDropShot ? 40 : 18);
    const dropStopY = Math.max(6, aiBounceY - 6);
    const contactY = Math.max(AI_COURT_BOUNDS.MIN_Y + 2, aiBounceY - 10);
    const dropPostBounceMultiplier = isDropShot ? 2.0 : 1;

    // AI starts moving towards where the ball will land
    aiTargetXRef.current = targetX;
    aiTargetYRef.current = isDropShot ? dropStopY : Math.max(AI_COURT_BOUNDS.MIN_Y, contactY - 4);

    shotStartTimeRef.current = performance.now();
    shotDurationRef.current = hitSpeed;
    shotStartPosRef.current = { x: startX, y: startY };
    shotEndPosRef.current = { x: targetX, y: aiBounceY };

    setCurrentAnimDuration(0);
    setBallPos({ x: startX, y: startY });

    setTimeout(() => {
      setCurrentAnimDuration(hitSpeed);
      setBallPos({ x: targetX, y: aiBounceY });
    }, 20);

    setTimeout(() => {
      addBounceMarker(targetX, aiBounceY);
      const dropStopX = extendShotToY({ x: startX, y: startY }, { x: targetX, y: aiBounceY }, dropStopY);
      const contactX = extendShotToY({ x: startX, y: startY }, { x: targetX, y: aiBounceY }, contactY);
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
        triggerFeedback("WINNER! 🏆", 1000);
        const segmentY = Math.abs(aiBounceY - dropStopY);
        const fullY = Math.abs(aiBounceY - startY);
        const stopDuration = Math.max(120, hitSpeed * (fullY > 0 ? segmentY / fullY : 0.2)) * dropPostBounceMultiplier;
        shotStartTimeRef.current = performance.now();
        shotDurationRef.current = stopDuration;
        shotStartPosRef.current = { x: targetX, y: aiBounceY };
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
        triggerFeedback("WINNER! 🏆", 1000);
        const outY = -12;
        const outX = extendShotToY({ x: startX, y: startY }, { x: targetX, y: aiBounceY }, outY);
        shotStartTimeRef.current = performance.now();
        const postBounceDuration = hitSpeed * dropPostBounceMultiplier;
        shotDurationRef.current = postBounceDuration;
        shotStartPosRef.current = { x: targetX, y: aiBounceY };
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
        triggerFeedback("WINNER! 🏆", 1000);
        if (isDropShot) {
          const segmentY = Math.abs(aiBounceY - dropStopY);
          const fullY = Math.abs(aiBounceY - startY);
          const stopDuration = Math.max(120, hitSpeed * (fullY > 0 ? segmentY / fullY : 0.2)) * dropPostBounceMultiplier;
          shotStartTimeRef.current = performance.now();
          shotDurationRef.current = stopDuration;
          shotStartPosRef.current = { x: targetX, y: aiBounceY };
          shotEndPosRef.current = { x: dropStopX, y: dropStopY };
          setCurrentAnimDuration(stopDuration);
          setBallPos({ x: dropStopX, y: dropStopY });

          if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);
          ballTimeoutRef.current = setTimeout(() => {
            resetPoint('player');
          }, stopDuration);
        } else {
          const outY = -12;
          const outX = extendShotToY({ x: startX, y: startY }, { x: targetX, y: aiBounceY }, outY);
          shotStartTimeRef.current = performance.now();
          const postBounceDuration = hitSpeed * dropPostBounceMultiplier;
          shotDurationRef.current = postBounceDuration;
          shotStartPosRef.current = { x: targetX, y: aiBounceY };
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
          shotStartPosRef.current = { x: targetX, y: aiBounceY };
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
          shotStartPosRef.current = { x: targetX, y: aiBounceY };
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
  }, [addBounceMarker, aiHitRadiusBH, aiHitRadiusFH, extendShotToY, resetPoint, startAiShot, triggerFeedback]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysPressed.current.add(e.code);
    
    if ((e.code === 'Space' || e.code === 'KeyX') && gameState.status === GameStatus.PLAYING) {
      e.preventDefault();
      if (isServePending && server === 'player') {
        const serveType = e.code === 'KeyX' ? 'kick' : 'flat';
        const config = SERVE_CONFIG[serveType];
        const serveDuration = getPowerDuration(config.duration, playerStats.serve.power);
        if (Math.random() < config.faultChance) {
          triggerFeedback("FAULT!", 700);
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

        const p = currentPlayerPosRef.current;
        const targetX = Math.max(15, Math.min(85, getServeTargetX('player', serveSide, serveTarget)));
        setLastStroke(targetX < p.x ? 'BH' : 'FH');
        setIsSwinging(true);
        setTimeout(() => setIsSwinging(false), 250);
        playHitSound(true);
        executePlayerShot({
          startX: p.x,
          startY: p.y,
          targetX,
          hitSpeed: serveDuration,
          isDropShot: false,
          bounceYOverride: config.bounceYTop,
        });
        return;
      }
      const isDropShot = e.code === 'KeyX';
      
      const bX = ballHitPosRef.current.x;
      const p = currentPlayerPosRef.current;
      const dx = bX - p.x;
      
      const stroke = dx < 0 ? 'BH' : 'FH';
      const hitRadius = stroke === 'FH' ? playerHitRadiusFH : playerHitRadiusBH;
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
      isBallLiveRef.current = false;
      setRallyCount(prev => prev + 1);

      setIsMeterHolding(true);
      setTimeout(() => {
        setIsMeterHolding(false);
        setIsMeterActive(false);
      }, 800); 

      const shotShape = stroke === 'FH' ? playerStats.forehand.shape : playerStats.backhand.shape;
      const timingScale = getTimingScale(shotShape);
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
      
      targetX = Math.max(4, Math.min(96, targetX));
      
      triggerAiCommentary(ShotQuality.PERFECT);
      const baseHitSpeed = isDropShot ? 1250 : (stroke === 'FH' ? 900 : 1050);
      const hitPower = stroke === 'FH' ? playerStats.forehand.power : playerStats.backhand.power;
      const hitSpeed = getPowerDuration(baseHitSpeed, hitPower);
      executePlayerShot({
        startX: bX,
        startY: bY,
        targetX,
        hitSpeed,
        isDropShot,
      });
    }
  }, [executePlayerShot, gameState.status, getPowerDuration, getServeTargetX, getTimingScale, isBallLiveRef, playHitSound, playerHitRadiusBH, playerHitRadiusFH, playerStats, resetPoint, server, serveNumber, serveSide, serveTarget, triggerAiCommentary, triggerFeedback, isServePending]);

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
      setPlayerPos(prev => ({ ...prev, x: serverX, y: 106 }));
      setAiPos(prev => ({ ...prev, x: receiverX, y: 0 }));
      currentAiPosRef.current = { ...currentAiPosRef.current, x: receiverX, y: 0 };
      aiTargetXRef.current = receiverX;
      aiTargetYRef.current = 0;
    } else {
      const serverX = isDeuce ? 70 : 30;
      const receiverX = isDeuce ? 30 : 70;
      setAiPos(prev => ({ ...prev, x: serverX, y: 0 }));
      currentAiPosRef.current = { ...currentAiPosRef.current, x: serverX, y: 0 };
      setPlayerPos(prev => ({ ...prev, x: receiverX, y: 106 }));
      aiTargetXRef.current = serverX;
      aiTargetYRef.current = 0;
    }
  }, [gameState.status, isServePending, serveSide, server]);

  useEffect(() => {
    if (gameState.status !== GameStatus.PLAYING || !isServePending || server !== 'opponent') return;
    if (serveInProgressRef.current) return;
    serveInProgressRef.current = true;
    const serveType = Math.random() < 0.5 ? 'flat' : 'kick';
    const timeoutId = setTimeout(() => {
      const config = SERVE_CONFIG[serveType];
      const serveDuration = getPowerDuration(config.duration, AI_STATS.serve.power);
        if (Math.random() < config.faultChance) {
          triggerFeedback("FAULT!", 700);
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

      const start = currentAiPosRef.current;
      const serveTargetX = getServeTargetX('opponent', serveSide, Math.random() < 0.5 ? 'wide' : 'middle');
      const endX = Math.max(15, Math.min(85, serveTargetX));
      const endY = 72;
      const outY = 112;
      const duration = serveDuration;

      setCurrentAnimDuration(0);
      setBallPos({ x: start.x, y: start.y });

      setTimeout(() => {
        setIsAiSwinging(true);
        setTimeout(() => setIsAiSwinging(false), 250);
        playHitSound(false);
        isBallLiveRef.current = true;
        shotStartTimeRef.current = performance.now();
        shotDurationRef.current = duration;
        shotStartPosRef.current = { x: start.x, y: start.y };
        const serveBounceY = config.bounceYBottom;
        shotEndPosRef.current = { x: endX, y: serveBounceY };
        setCurrentAnimDuration(duration);
        setBallPos({ x: endX, y: serveBounceY });

        aiTargetXRef.current = 50;
        aiTargetYRef.current = 4;

        if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);
        ballTimeoutRef.current = setTimeout(() => {
          if (!isBallLiveRef.current) return;
          addBounceMarker(endX, serveBounceY);
          shotStartTimeRef.current = performance.now();
          shotDurationRef.current = duration;
          const travelX = endX - start.x;
          const travelY = serveBounceY - start.y;
          const continuationT = travelY !== 0 ? (outY - serveBounceY) / travelY : 0;
          const outX = endX + travelX * continuationT;
          shotStartPosRef.current = { x: endX, y: serveBounceY };
          shotEndPosRef.current = { x: outX, y: outY };
          setCurrentAnimDuration(duration);
          setBallPos({ x: outX, y: outY });

          ballTimeoutRef.current = setTimeout(() => {
            if (!isBallLiveRef.current) return;
            triggerFeedback("OUT! ❌", 600);
            resetPoint('opponent');
          }, duration);
        }, duration);
      }, 50);
    }, 600);
    return () => clearTimeout(timeoutId);
  }, [addBounceMarker, gameState.status, getPowerDuration, getServeTargetX, isServePending, playHitSound, resetPoint, serveNumber, server, serveSide, triggerFeedback]);

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
    aiTargetXRef.current = 50;
    const resetAiPos = { x: 50, y: 4 };
    setAiPos(resetAiPos);
    currentAiPosRef.current = resetAiPos;
  };

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
              <div className="mt-2 text-[10px] font-orbitron uppercase tracking-widest text-emerald-300/90">
                Space: Flat • X: Kick
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
