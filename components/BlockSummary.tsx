import React from 'react';

type BlockSummaryRow = {
  id: string;
  name: string;
  rankBefore: number;
  rankAfter: number;
  deltaPoints: number;
  blockPoints: number;
  pointsAfter: number;
};

type BlockSummaryProps = {
  block: number;
  rows: BlockSummaryRow[];
  resultSummary?: {
    outcome: 'eliminated' | 'champion';
    tournamentName: string;
    earnings: number;
    rankingDelta: number;
  };
  onContinue: () => void;
};

const BlockSummary: React.FC<BlockSummaryProps> = ({ block, rows, resultSummary, onContinue }) => (
  <div className="h-screen w-screen bg-slate-950 text-white font-inter overflow-y-auto">
    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(14,116,144,0.25),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(14,116,144,0.2),transparent_45%)]" />
    <div className="relative z-10 max-w-5xl mx-auto px-8 py-10 pb-20 min-h-full">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-orbitron font-black tracking-[0.3em] italic">Neon Slam</h1>
          <p className="text-xs font-orbitron uppercase tracking-widest text-slate-400 mt-2">
            Block {block} Results
          </p>
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="px-4 py-2 rounded-full text-[10px] font-orbitron uppercase tracking-widest border border-white/20 bg-white/10 text-white/80 hover:bg-white/20 transition-all"
        >
          Continue
        </button>
      </div>

      {resultSummary && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-6 py-5">
          <div className="text-[10px] uppercase tracking-widest text-slate-400">Tournament Report</div>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xl font-orbitron uppercase tracking-widest text-white">
                {resultSummary.tournamentName}
              </div>
              <div className="mt-2 text-[11px] uppercase tracking-widest text-slate-300">
                {resultSummary.outcome === 'champion' ? 'Champion' : 'Eliminated'}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-[11px] uppercase tracking-widest">
              <div className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-slate-300">
                Ranking {resultSummary.rankingDelta >= 0 ? 'Gain' : 'Loss'}:{' '}
                <span className={resultSummary.rankingDelta >= 0 ? 'text-emerald-200' : 'text-rose-200'}>
                  {resultSummary.rankingDelta >= 0 ? `+${resultSummary.rankingDelta}` : resultSummary.rankingDelta}
                </span>
              </div>
              <div className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-emerald-200">
                Credits: +{resultSummary.earnings}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="grid grid-cols-[60px_1fr_90px_90px_90px_120px] gap-0 text-[10px] uppercase tracking-widest text-slate-400 border-b border-white/10 px-5 py-3">
          <div>Rank</div>
          <div>Player</div>
          <div className="text-right">Block Pts</div>
          <div className="text-right">Change</div>
          <div className="text-right">Points</div>
          <div className="text-right">Movement</div>
        </div>
        <div className="divide-y divide-white/5">
          {rows.map(row => {
            const rankDelta = row.rankBefore - row.rankAfter;
            const movement =
              rankDelta > 0 ? 'up' : rankDelta < 0 ? 'down' : 'same';
            return (
              <div
                key={row.id}
                className="grid grid-cols-[60px_1fr_90px_90px_90px_120px] gap-0 px-5 py-3 text-sm"
              >
                <div className="text-slate-300">#{row.rankAfter}</div>
                <div className="font-orbitron uppercase tracking-widest text-sm text-white">
                  {row.name}
                </div>
                <div className="text-right text-xs uppercase tracking-widest text-slate-300">
                  {row.blockPoints}
                </div>
                <div className={`text-right text-xs uppercase tracking-widest ${
                  row.deltaPoints > 0
                    ? 'text-emerald-200'
                    : row.deltaPoints < 0
                      ? 'text-rose-200'
                      : 'text-slate-400'
                }`}>
                  {row.deltaPoints > 0 ? `+${row.deltaPoints}` : row.deltaPoints}
                </div>
                <div className="text-right text-slate-300 text-xs uppercase tracking-widest">
                  {row.pointsAfter}
                </div>
                <div className="text-right text-xs uppercase tracking-widest">
                  {movement === 'up' && <span className="text-emerald-300">▲ +{rankDelta}</span>}
                  {movement === 'down' && <span className="text-rose-300">▼ {Math.abs(rankDelta)}</span>}
                  {movement === 'same' && <span className="text-slate-500">—</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);

export default BlockSummary;
