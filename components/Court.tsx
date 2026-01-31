
import React from 'react';
import { PHYSICS } from '../constants';
import { CourtSurface } from '../types';

interface BounceMarker {
  id: number;
  x: number;
  y: number;
  opacity: number;
}

interface CourtProps {
  ballPosition: { x: number; y: number };
  ballHitPosition: { x: number; y: number };
  playerPosition: { x: number; y: number };
  aiPosition: { x: number; y: number };
  playerHitRadiusFH: number;
  playerHitRadiusBH: number;
  playerVolleyRadius: number;
  aiHitRadiusFH: number;
  aiHitRadiusBH: number;
  ballHasBounced: boolean;
  serveDebug?: { x: number; y: number; radius: number; visible: boolean };
  aiVolleyZoneY?: number;
  aiVolleyTarget?: { x: number; y: number };
  aiRunTarget?: { x: number; y: number };
  aiSwinging: boolean;
  animationDuration: number;
  ballTimingFunction: string;
  aiLastStroke: 'FH' | 'BH' | null;
  aiVolleySwinging: boolean;
  lastStroke: 'FH' | 'BH' | null;
  isSwinging: boolean;
  isVolleySwinging: boolean;
  bounceMarkers: BounceMarker[];
  tutorialTargets?: Array<{ id: string; x: number; y: number; radius: number }>;
  tutorialZone?: { xMin: number; xMax: number; yMin: number; yMax: number };
  surface: CourtSurface;
}

const Court: React.FC<CourtProps> = ({ 
  ballPosition, 
  ballHitPosition,
  playerPosition, 
  aiPosition,
  playerHitRadiusFH,
  playerHitRadiusBH,
  playerVolleyRadius,
  aiHitRadiusFH,
  aiHitRadiusBH,
  ballHasBounced,
  serveDebug,
  aiVolleyZoneY,
  aiVolleyTarget,
  aiRunTarget,
  aiSwinging,
  animationDuration, 
  ballTimingFunction,
  aiLastStroke,
  aiVolleySwinging,
  lastStroke, 
  isSwinging,
  isVolleySwinging,
  bounceMarkers,
  tutorialTargets,
  tutorialZone,
  surface,
}) => {
  const getRacketRotation = () => {
    const idle = lastStroke === 'BH' ? 135 : 45;
    const full = lastStroke === 'BH' ? 315 : -135;
    const swing = isVolleySwinging ? idle + (full - idle) * 0.5 : full;
    if (!lastStroke) return 45;
    if (lastStroke === 'BH') {
      return isSwinging ? swing : idle;
    } else {
      return isSwinging ? swing : idle;
    }
  };

  const getAiRacketRotation = () => {
    const idle = aiLastStroke === 'BH' ? 135 : 45;
    const full = aiLastStroke === 'BH' ? 315 : -135;
    const swing = aiVolleySwinging ? idle + (full - idle) * 0.5 : full;
    if (aiLastStroke === 'BH') {
      return aiSwinging ? swing : idle;
    }
    return aiSwinging ? swing : idle;
  };

  const playableInsetX = 12;
  const playableInsetTop = 12;
  const playableInsetBottom = 12;
  const playableWidth = 100 - playableInsetX * 2;
  const playableHeight = 100 - playableInsetTop - playableInsetBottom;

  const mapToCourt = (position: { x: number; y: number }) => ({
    x: playableInsetX
      + ((position.x - PHYSICS.COURT_BOUNDS.MIN_X) * playableWidth)
      / (PHYSICS.COURT_BOUNDS.MAX_X - PHYSICS.COURT_BOUNDS.MIN_X),
    y: playableInsetTop
      + ((position.y - PHYSICS.COURT_BOUNDS.MIN_Y) * playableHeight)
      / (PHYSICS.COURT_BOUNDS.MAX_Y - PHYSICS.COURT_BOUNDS.MIN_Y),
  });

  const ballOnCourt = mapToCourt(ballPosition);
  const ballHitOnCourt = mapToCourt(ballHitPosition);
  const playerOnCourt = mapToCourt(playerPosition);
  const ballScaleDenom = PHYSICS.COURT_BOUNDS.MAX_Y * 1.55;
  const dx = ballHitOnCourt.x - playerOnCourt.x;
  const dy = ballHitOnCourt.y - playerOnCourt.y;
  const activeHitRadius = ballHasBounced ? (dx < 0 ? playerHitRadiusBH : playerHitRadiusFH) : playerVolleyRadius;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const isInReach = distance < activeHitRadius;
  const showHitDebug = false;
  const hitRadiusX = (playableWidth * activeHitRadius) / 100;
  const aiOnCourt = mapToCourt(aiPosition);
  const aiDx = ballHitOnCourt.x - aiOnCourt.x;
  const aiActiveHitRadius = aiDx < 0 ? aiHitRadiusBH : aiHitRadiusFH;
  const aiHitRadiusX = (playableWidth * aiActiveHitRadius) / 100;
  const serveDebugOnCourt = serveDebug ? mapToCourt({ x: serveDebug.x, y: serveDebug.y }) : null;
  const serveDebugRadiusX = serveDebug ? (playableWidth * serveDebug.radius) / 100 : 0;
  const aiVolleyZoneOnCourt = aiVolleyZoneY !== undefined
    ? mapToCourt({ x: PHYSICS.COURT_BOUNDS.MIN_X, y: aiVolleyZoneY })
    : null;
  const aiVolleyTargetOnCourt = aiVolleyTarget ? mapToCourt(aiVolleyTarget) : null;
  const aiRunTargetOnCourt = aiRunTarget ? mapToCourt(aiRunTarget) : null;
  const tutorialTargetsOnCourt = tutorialTargets?.map(target => {
    const mapped = mapToCourt({ x: target.x, y: target.y });
    const radius = (target.radius * playableWidth) / (PHYSICS.COURT_BOUNDS.MAX_X - PHYSICS.COURT_BOUNDS.MIN_X);
    return {
      ...target,
      mapped,
      radius,
    };
  });
  const tutorialZoneOnCourt = tutorialZone
    ? (() => {
        const topLeft = mapToCourt({ x: tutorialZone.xMin, y: tutorialZone.yMin });
        const bottomRight = mapToCourt({ x: tutorialZone.xMax, y: tutorialZone.yMax });
        return {
          left: topLeft.x,
          top: topLeft.y,
          width: Math.max(0, bottomRight.x - topLeft.x),
          height: Math.max(0, bottomRight.y - topLeft.y),
        };
      })()
    : null;
  const surfaceTheme = {
    clay: {
      court: 'bg-orange-900',
      playable: 'bg-orange-700',
      glow: 'shadow-[0_0_60px_rgba(249,115,22,0.45)]',
    },
    hardcourt: {
      court: 'bg-sky-900',
      playable: 'bg-sky-700',
      glow: 'shadow-[0_0_60px_rgba(56,189,248,0.45)]',
    },
    grass: {
      court: 'bg-emerald-900',
      playable: 'bg-emerald-600',
      glow: 'shadow-[0_0_60px_rgba(16,185,129,0.55)]',
    },
  } as const;
  const activeTheme = surfaceTheme[surface];

  return (
    <div className="relative w-full h-full perspective-1000 overflow-hidden bg-slate-900 flex items-start justify-center">
      {/* Court Grid */}
      <div 
        className={`relative w-[70vw] h-[135vh] max-w-[680px] ${activeTheme.court} transition-transform [transform:perspective(1200px)_rotateX(30deg)_translateY(-230px)] ${isSwinging ? 'scale-[1.002]' : ''}`}
      >
        {/* Playable Court Surface */}
        <div 
          className={`absolute ${activeTheme.playable} border-4 border-white ${activeTheme.glow}`}
          style={{ top: `${playableInsetTop}%`, bottom: `${playableInsetBottom}%`, left: `${playableInsetX}%`, right: `${playableInsetX}%` }}
        />

        {/* Net */}
        <div 
          className="absolute z-10 shadow-lg"
          style={{ top: `${playableInsetTop}%`, bottom: `${playableInsetBottom}%`, left: `${playableInsetX}%`, right: `${playableInsetX}%` }}
        >
          <div className="absolute top-1/2 left-0 w-full h-1 bg-white/70 backdrop-blur-sm border-t border-b border-white flex items-center justify-center">
             <div className="w-full h-[44px] border-l border-r border-white/40 bg-[radial-gradient(circle,rgba(255,255,255,0.35)_1px,transparent_1px)] bg-[size:6px_6px] -translate-y-1/2" />
          </div>
        </div>
        
        {/* Bounce Markers */}
        {bounceMarkers.map(marker => {
          const markerOnCourt = mapToCourt({ x: marker.x, y: marker.y });

          return (
            <div 
              key={marker.id}
              className="absolute z-10 pointer-events-none"
              style={{ 
                left: `${markerOnCourt.x}%`, 
                top: `${markerOnCourt.y}%`, 
                transform: 'translate(-50%, -50%)' 
              }}
            >
              <div 
                className="w-8 h-4 bg-black/40 rounded-full blur-[1px] transition-opacity duration-1000"
                style={{ opacity: marker.opacity }}
              />
              <div 
                className="absolute inset-0 w-8 h-4 border-2 border-white/20 rounded-full animate-ping"
                style={{ opacity: marker.opacity > 0 ? 0.4 : 0 }}
              />
            </div>
          );
        })}

        {/* Lines */}
        <div 
          className="absolute pointer-events-none opacity-40"
          style={{ top: `${playableInsetTop}%`, bottom: `${playableInsetBottom}%`, left: `${playableInsetX}%`, right: `${playableInsetX}%` }}
        >
          <div className="absolute top-[25%] left-0 w-full h-0.5 bg-white/90 shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
          <div className="absolute top-[75%] left-0 w-full h-0.5 bg-white/90 shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
          <div className="absolute top-[25%] bottom-[25%] left-1/2 w-0.5 bg-white/90 shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
        </div>

        {aiVolleyZoneOnCourt && (
          <div
            className="absolute pointer-events-none z-10 hidden"
            style={{
              left: `${playableInsetX}%`,
              right: `${playableInsetX}%`,
              top: `${aiVolleyZoneOnCourt.y}%`,
              transform: 'translateY(-50%)',
            }}
          >
            <div className="w-full h-0.5 bg-fuchsia-300/70 shadow-[0_0_8px_rgba(232,121,249,0.7)]" />
          </div>
        )}

        {false && aiVolleyTargetOnCourt && (
          <div
            className="absolute pointer-events-none z-10 hidden w-3 h-3 rounded-full bg-fuchsia-200 shadow-[0_0_10px_rgba(232,121,249,0.9)]"
            style={{
              left: `${aiVolleyTargetOnCourt.x}%`,
              top: `${aiVolleyTargetOnCourt.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        )}

        {false && aiRunTargetOnCourt && (
          <div
            className="absolute pointer-events-none z-10 w-3 h-3 rounded-full bg-fuchsia-500 shadow-[0_0_12px_rgba(217,70,239,0.9)]"
            style={{
              left: `${aiRunTargetOnCourt.x}%`,
              top: `${aiRunTargetOnCourt.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        )}

        {/* AI Opponent - Uses Managed Position */}
        {showHitDebug && (
          <div
            className="absolute pointer-events-none z-10 rounded-full border border-red-300/70 border-dashed aspect-square"
            style={{
              width: `${aiHitRadiusX * 2}%`,
              left: `${aiOnCourt.x}%`,
              top: `${aiOnCourt.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        )}

        {serveDebug?.visible && serveDebugOnCourt && (
          <div
            className="absolute pointer-events-none z-10 rounded-full aspect-square border border-cyan-200/80 shadow-[0_0_18px_rgba(125,211,252,0.35)]"
            style={{
              width: `${serveDebugRadiusX * 2}%`,
              left: `${serveDebugOnCourt.x}%`,
              top: `${serveDebugOnCourt.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200 shadow-[0_0_14px_rgba(125,211,252,0.9)]" />
          </div>
        )}

        <div 
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
          style={{ 
            left: `${aiOnCourt.x}%`,
            top: `${aiOnCourt.y}%`
          }}
        >
           <div className="flex flex-col items-center">
             <div className="w-7 h-7 bg-gradient-to-br from-red-600 to-red-900 rounded-full shadow-lg border-2 border-white flex items-center justify-center text-white text-[6px] font-bold">AI</div>
             {/* AI Racket */}
             <div 
               className="absolute w-[60px] h-[7px] pointer-events-none transition-transform duration-200 ease-out flex items-center justify-end"
               style={{ 
                 transformOrigin: 'left center',
                 left: '50%',
                 transform: `scale(-1, -1) rotate(${getAiRacketRotation()}deg)`,
                 opacity: aiSwinging ? 1 : 0.5
               }}
             >
               <div className="flex items-center">
                 <div className="w-8 h-1.5 bg-slate-400 rounded-l-full shadow-md" />
                 <div className="w-11 h-8 border-[3px] border-slate-200 rounded-[45%] bg-white/5 flex items-center justify-center overflow-hidden relative shadow-xl">
                   <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_1px,rgba(255,255,255,0.1)_1px),linear-gradient(-45deg,transparent_1px,rgba(255,255,255,0.1)_1px)] bg-[size:3px_3px]" />
                 </div>
               </div>
             </div>
           </div>
        </div>

        {/* Playable Player */}
        <div 
          className="absolute z-20"
          style={{ left: `${playerOnCourt.x}%`, top: `${playerOnCourt.y}%`, transform: 'translate(-50%, -50%)' }}
        >
           <div className="relative flex items-center justify-center w-24 h-24">
             <div 
               className={`absolute rounded-full border-2 transition-all duration-300 ${isInReach ? 'border-emerald-400 scale-110 bg-emerald-400/10' : 'border-white/10'}`}
               style={{ width: `${hitRadiusX * 2}%`, height: `${hitRadiusX * 2}%` }}
             />
             
             <div 
               className="absolute w-[60px] h-[7px] pointer-events-none transition-transform duration-300 ease-out flex items-center justify-end"
               style={{ 
                 transformOrigin: 'left center',
                 left: '50%',
                 transform: `rotate(${getRacketRotation()}deg)`,
                 opacity: isSwinging || isInReach ? 1 : 0.3
               }}
             >
                <div className="flex items-center">
                   <div className="w-8 h-1.5 bg-slate-400 rounded-l-full shadow-md" />
                   <div className="w-11 h-8 border-[3px] border-slate-200 rounded-[45%] bg-white/5 flex items-center justify-center overflow-hidden relative shadow-xl">
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_1px,rgba(255,255,255,0.1)_1px),linear-gradient(-45deg,transparent_1px,rgba(255,255,255,0.1)_1px)] bg-[size:3px_3px]" />
                   </div>
                </div>
             </div>

             <div className={`w-10 h-10 bg-gradient-to-br ${lastStroke === 'BH' ? 'from-purple-600 to-blue-800' : 'from-blue-600 to-blue-900'} rounded-full shadow-2xl border-[3px] border-white flex items-center justify-center text-white text-[8px] font-black italic z-10 relative`}>
                {lastStroke || 'PRO'}
             </div>
             
             <div className="absolute bottom-3 flex gap-2 z-10">
                <span className={`text-[7px] font-orbitron transition-opacity ${dx < 0 && isInReach ? 'text-emerald-400 opacity-100 font-bold' : 'opacity-20 text-white'}`}>BACKHAND</span>
                <span className={`text-[7px] font-orbitron transition-opacity ${dx > 0 && isInReach ? 'text-emerald-400 opacity-100 font-bold' : 'opacity-20 text-white'}`}>FOREHAND</span>
             </div>
           </div>
        </div>

        {showHitDebug && (
          <>
            <div
              className="absolute pointer-events-none z-10 rounded-full border border-yellow-300/70 border-dashed aspect-square"
              style={{
                width: `${hitRadiusX * 2}%`,
                left: `${playerOnCourt.x}%`,
                top: `${playerOnCourt.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
            <div
              className="absolute pointer-events-none z-10 w-2 h-2 bg-yellow-200 rounded-full shadow-[0_0_10px_rgba(253,224,71,0.8)]"
              style={{
                left: `${ballHitOnCourt.x}%`,
                top: `${ballHitOnCourt.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          </>
        )}

        {tutorialTargetsOnCourt && tutorialTargetsOnCourt.length > 0 && (
          <>
            {tutorialTargetsOnCourt.map(target => (
              <div
                key={target.id}
                className="absolute pointer-events-none z-20 rounded-full border border-emerald-200/80 shadow-[0_0_18px_rgba(16,185,129,0.6)] bg-emerald-400/20 animate-pulse"
                style={{
                  width: `${target.radius * 2}%`,
                  height: `${target.radius * 2}%`,
                  left: `${target.mapped.x}%`,
                  top: `${target.mapped.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}
          </>
        )}
        {tutorialZoneOnCourt && (
          <div
            className="absolute pointer-events-none z-20 rounded-3xl border border-emerald-200/70 bg-emerald-400/10 shadow-[0_0_24px_rgba(16,185,129,0.4)] animate-pulse"
            style={{
              left: `${tutorialZoneOnCourt.left}%`,
              top: `${tutorialZoneOnCourt.top}%`,
              width: `${tutorialZoneOnCourt.width}%`,
              height: `${tutorialZoneOnCourt.height}%`,
            }}
          />
        )}

        {/* Ball Shadow */}
        <div 
          className="absolute w-3 h-3 bg-black/40 rounded-full blur-sm transition-all"
          style={{ 
            left: `${ballOnCourt.x}%`, 
            top: `${ballOnCourt.y + 2}%`,
            transitionDuration: `${animationDuration}ms`,
            transitionTimingFunction: ballTimingFunction,
            transform: `translate(-50%, -50%) scale(${0.55 + (ballPosition.y / ballScaleDenom)})` 
          }}
        />

        {/* The Ball */}
        <div 
          className={`absolute w-4 h-4 rounded-full shadow-2xl z-30 transition-all ${isInReach ? 'bg-white shadow-[0_0_20px_white]' : 'bg-yellow-300 shadow-[0_0_15px_rgba(253,224,71,0.6)]'}`}
          style={{ 
            left: `${ballOnCourt.x}%`, 
            top: `${ballOnCourt.y}%`,
            transitionDuration: `${animationDuration}ms`,
            transitionTimingFunction: ballTimingFunction,
            transform: `translate(-50%, -50%) scale(${0.55 + (ballPosition.y / ballScaleDenom)})`,
          }}
        >
          <div className="w-full h-full border border-black/10 rounded-full" />
        </div>
      </div>

      {/* Atmospheric Overlays */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-blue-900/10 via-transparent to-black/70" />
    </div>
  );
};

export default Court;
