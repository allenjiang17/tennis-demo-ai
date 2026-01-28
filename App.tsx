
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStatus, ShotQuality, GameState } from './types';
import { PHYSICS, MESSAGES } from './constants';
import Court from './components/Court';

const AI_SPEED = 0.2; // Approximately half of player speed (0.8)
const AI_REACH_RADIUS = 9;

const App: React.FC = () => {
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
  const [aiPos, setAiPos] = useState({ x: 50, y: 10 });
  const currentAiPosRef = useRef(aiPos);
  const [lastStroke, setLastStroke] = useState<'FH' | 'BH' | null>(null);
  const [isSwinging, setIsSwinging] = useState(false);
  const [isAiSwinging, setIsAiSwinging] = useState(false);
  const [commentary, setCommentary] = useState("Ready to dominate?");
  const [feedback, setFeedback] = useState("");
  const [rallyCount, setRallyCount] = useState(0);
  const [currentAnimDuration, setCurrentAnimDuration] = useState(0);
  const [bounceMarkers, setBounceMarkers] = useState<any[]>([]);
  
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
  const aiTargetXRef = useRef<number>(50);
  const audioCtxRef = useRef<AudioContext | null>(null);

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
            x: Math.max(PHYSICS.COURT_BOUNDS.MIN_X, Math.min(PHYSICS.COURT_BOUNDS.MAX_X, newX)),
            y: Math.max(PHYSICS.COURT_BOUNDS.MIN_Y, Math.min(PHYSICS.COURT_BOUNDS.MAX_Y, newY))
          };
        });

        // AI Movement
        setAiPos(prev => {
          const dx = aiTargetXRef.current - prev.x;
          if (Math.abs(dx) < AI_SPEED) return { ...prev, x: aiTargetXRef.current };
          return { ...prev, x: prev.x + Math.sign(dx) * AI_SPEED };
        });

        // Update live ball position for hit checks and UI cues
        const now = performance.now();
        const elapsed = now - shotStartTimeRef.current;
        const progress = Math.min(1, shotDurationRef.current > 0 ? elapsed / shotDurationRef.current : 1);
        const liveBallX = shotStartPosRef.current.x + (shotEndPosRef.current.x - shotStartPosRef.current.x) * progress;
        const liveBallY = shotStartPosRef.current.y + (shotEndPosRef.current.y - shotStartPosRef.current.y) * progress;
        setBallHitPos({ x: liveBallX, y: liveBallY });

        // Update Meter based on ball proximity to player's hitting line
        if (isBallLiveRef.current && !isMeterHolding) {
          const bY = liveBallY;
          const distToHittingLine = bY - currentPlayerPosRef.current.y;
          
          if (Math.abs(distToHittingLine) < PHYSICS.HIT_RADIUS * 1.5) {
            setIsMeterActive(true);
            const mVal = ((distToHittingLine / PHYSICS.HIT_RADIUS) + 1) * 50;
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

  const extendShotToY = useCallback((start: { x: number; y: number }, end: { x: number; y: number }, targetY: number) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    if (dy === 0) return end.x;
    const t = (targetY - end.y) / dy;
    return end.x + dx * t;
  }, []);

  const resetPoint = useCallback((winner: 'player' | 'opponent') => {
    isBallLiveRef.current = false;
    setRallyCount(0);
    setGameState(prev => ({
      ...prev,
      player: { ...prev.player, score: winner === 'player' ? prev.player.score + 1 : prev.player.score },
      opponent: { ...prev.opponent, score: winner === 'opponent' ? prev.opponent.score + 1 : prev.opponent.score },
      status: GameStatus.SCORING,
    }));
    triggerFeedback(winner === 'player' ? "POINT!" : "MISS!", 1000);
    aiTargetXRef.current = 50; // Recover to center
    
    setTimeout(() => {
      setCurrentAnimDuration(0);
      setBallPos({ x: 50, y: 10 });
      setPlayerPos({ x: 50, y: 85 });
      setAiPos({ x: 50, y: 10 });
      setLastStroke(null);
      setGameState(prev => {
        if (prev.player.score >= 5 || prev.opponent.score >= 5) return { ...prev, status: GameStatus.GAME_OVER };
        return { ...prev, status: GameStatus.PLAYING };
      });
      if (gameState.player.score < 5 && gameState.opponent.score < 5) startAiShot();
    }, 1000); 
  }, [gameState.player.score, gameState.opponent.score, triggerFeedback]);

  const startAiShot = useCallback((startOverride?: { x: number; y: number }) => {
    setIsAiSwinging(true);
    setTimeout(() => setIsAiSwinging(false), 250);
    const startX = startOverride?.x ?? currentAiPosRef.current.x;
    const startY = startOverride?.y ?? currentAiPosRef.current.y;
    const endX = Math.max(10, Math.min(90, currentPlayerPosRef.current.x + (Math.random() * 40 - 20)));
    const endY = 72;
    const outY = 112;
    const duration = Math.max(1600, PHYSICS.BALL_SPEED_BASE - (rallyCount * 80));
    const outDuration = duration;

    setCurrentAnimDuration(0);
    setBallPos({ x: startX, y: startY });
    
    setTimeout(() => {
      playHitSound(false);
      isBallLiveRef.current = true;
      shotStartTimeRef.current = performance.now();
      shotDurationRef.current = duration;
      shotStartPosRef.current = { x: startX, y: startY };
      shotEndPosRef.current = { x: endX, y: endY };
      setCurrentAnimDuration(duration);
      setBallPos({ x: endX, y: endY });
      
      // AI starts recovering to middle after hitting
      aiTargetXRef.current = 50;

      if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);
      ballTimeoutRef.current = setTimeout(() => {
        if (!isBallLiveRef.current) return;
        addBounceMarker(endX, endY);
        shotStartTimeRef.current = performance.now();
        shotDurationRef.current = outDuration;
        const travelX = endX - startX;
        const travelY = endY - startY;
        const continuationT = travelY !== 0 ? (outY - endY) / travelY : 0;
        const outX = Math.max(5, Math.min(95, endX + travelX * continuationT));
        shotStartPosRef.current = { x: endX, y: endY };
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

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysPressed.current.add(e.code);
    
    if (e.code === 'Space' && gameState.status === GameStatus.PLAYING) {
      e.preventDefault();
      
      const now = performance.now();
      const elapsed = now - shotStartTimeRef.current;
      const progress = Math.min(1, elapsed / shotDurationRef.current);
      const bX = shotStartPosRef.current.x + (shotEndPosRef.current.x - shotStartPosRef.current.x) * progress;
      const p = currentPlayerPosRef.current;
      const dx = bX - p.x;
      
      const stroke = dx < 0 ? 'BH' : 'FH';
      setLastStroke(stroke);
      setIsSwinging(true);
      setTimeout(() => setIsSwinging(false), 250);

      if (!isBallLiveRef.current) return;

      const bY = shotStartPosRef.current.y + (shotEndPosRef.current.y - shotStartPosRef.current.y) * progress;
      const dy = bY - p.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > PHYSICS.HIT_RADIUS) {
        if (distance < PHYSICS.HIT_RADIUS * 1.8) {
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

      const timingFactor = Math.max(-1, Math.min(1, dy / PHYSICS.HIT_RADIUS));
      const lerpT = (timingFactor + 1) / 2;
      
      let targetX: number;
      if (stroke === 'FH') {
        targetX = 4.5 + (95.5 - 4.5) * lerpT;
        triggerFeedback(timingFactor < -0.3 ? "CROSS COURT FH!" : timingFactor > 0.3 ? "INSIDE-OUT FH!" : "CLEAN FH!", 700);
      } else {
        targetX = 95.5 + (4.5 - 95.5) * lerpT;
        triggerFeedback(timingFactor < -0.3 ? "CROSS COURT BH!" : timingFactor > 0.3 ? "INSIDE-OUT BH!" : "CLEAN BH!", 700);
      }
      
      targetX = Math.max(4, Math.min(96, targetX));
      
      // AI starts moving towards where the ball will land
      aiTargetXRef.current = targetX;

      triggerAiCommentary(ShotQuality.PERFECT);
      const hitSpeed = stroke === 'FH' ? 900 : 1050;
      
      shotStartTimeRef.current = performance.now();
      shotDurationRef.current = hitSpeed;
      const aiBounceY = 18;
      shotStartPosRef.current = { x: bX, y: bY };
      shotEndPosRef.current = { x: targetX, y: aiBounceY };

      setCurrentAnimDuration(0);
      setBallPos({ x: bX, y: bY });
      
      setTimeout(() => {
        setCurrentAnimDuration(hitSpeed);
        setBallPos({ x: targetX, y: aiBounceY });
      }, 20);

      setTimeout(() => {
        addBounceMarker(targetX, aiBounceY); 
        // Logic check: AI only hits if it is close to targetX
        const aiDistFromBall = Math.hypot(aiPos.x - targetX, aiPos.y - aiBounceY);
        const canReach = aiDistFromBall < AI_REACH_RADIUS;
        const missFalloff = 40;
        const baseMiss = 0.1;
        const missScale = 0.8;
        const distanceFactor = Math.max(0, aiDistFromBall - AI_REACH_RADIUS) / missFalloff;
        const aiMissChance = canReach ? 0.02 : Math.min(0.9, baseMiss + distanceFactor * missScale);

        if (Math.random() < aiMissChance) {
          triggerFeedback("WINNER! 🏆", 1000);
          const outY = -12;
          const outX = extendShotToY({ x: bX, y: bY }, { x: targetX, y: aiBounceY }, outY);
          shotStartTimeRef.current = performance.now();
          shotDurationRef.current = hitSpeed;
          shotStartPosRef.current = { x: targetX, y: aiBounceY };
          shotEndPosRef.current = { x: outX, y: outY };
          setCurrentAnimDuration(hitSpeed);
          setBallPos({ x: outX, y: outY });

          if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);
          ballTimeoutRef.current = setTimeout(() => {
            resetPoint('player');
          }, hitSpeed);
        } else {
          const contactY = 8;
          const contactX = extendShotToY({ x: bX, y: bY }, { x: targetX, y: aiBounceY }, contactY);
          const segmentY = Math.abs(aiBounceY - contactY);
          const fullY = Math.abs(aiBounceY - bY);
          const continueDuration = Math.max(120, hitSpeed * (fullY > 0 ? segmentY / fullY : 0.3));

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
      }, hitSpeed);
    }
  }, [isBallLiveRef, gameState.status, rallyCount, resetPoint, triggerAiCommentary, startAiShot, playHitSound, addBounceMarker, triggerFeedback, aiPos.x]);

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

  const startGame = () => {
    setGameState(prev => ({
      ...prev,
      player: { ...prev.player, score: 0 },
      opponent: { ...prev.opponent, score: 0 },
      status: GameStatus.PLAYING,
    }));
    setRallyCount(0);
    aiTargetXRef.current = 50;
    setAiPos({ x: 50, y: 10 });
    startAiShot();
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

      <div className="absolute bottom-6 left-6 z-30 pointer-events-none">
        <h1 className="text-4xl font-orbitron font-black tracking-[0.3em] mb-2 italic text-white drop-shadow-2xl">ACE MASTER</h1>
        <div className="h-16 flex items-center justify-start">
          <p className="text-slate-400 text-[10px] font-orbitron uppercase tracking-widest text-left px-6 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm italic">
            {commentary}
          </p>
        </div>
      </div>

      {/* Main Game Court */}
      <div className="relative w-full h-full flex items-center justify-center">
        <Court 
          ballPosition={ballPos}
          ballHitPosition={ballHitPos}
          playerPosition={playerPos} 
          aiPosition={aiPos} 
          aiReachRadius={AI_REACH_RADIUS}
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

export default App;
