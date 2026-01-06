import { FC, useState } from 'react';
import { ArrowLeft, Gem, Flame, ShieldCheck } from 'lucide-react';
import { InitializeCasino } from '../components/InitializeCasino';
import { CasinoInfo } from '../components/CasinoInfo';
import { CasinoLobby } from '../components/CasinoLobby';
import { CoinFlip } from '../components/CoinFlip';
import { Dice } from '../components/Dice';
import { Slots } from '../components/Slots';
import { SessionList } from '../components/SessionList';
import { Leaderboard } from '../components/Leaderboard';

type GameType = 'coinflip' | 'dice' | 'slots' | null;

export const GamesPage: FC = () => {
  const [selectedGame, setSelectedGame] = useState<GameType>(null);

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8">
      {selectedGame === null ? (
        <>
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-emerald to-brand-accent">
                Casino Lobby
              </span>
            </h1>
            <p className="text-slate-400 text-lg">
              Select a game to start playing on-chain.
            </p>
          </div>

          {/* Initialize Casino (if needed) */}
          <div className="max-w-4xl mx-auto">
            <InitializeCasino />
          </div>

          {/* Casino Info */}
          <div className="max-w-6xl mx-auto">
            <div className="aura-card">
              <div className="aura-card-inner">
                <CasinoInfo />
              </div>
              <div className="aura-card-glow" />
            </div>
          </div>

          {/* Game Cards */}
          <div className="max-w-6xl mx-auto">
            <div className="aura-card">
              <div className="aura-card-inner">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Gem className="w-6 h-6 text-brand-gold" />
                <span>Available Games</span>
              </h2>
              <CasinoLobby onSelectGame={setSelectedGame} />
              </div>
              <div className="aura-card-glow" />
            </div>
          </div>

          {/* Leaderboard */}
          <div className="max-w-6xl mx-auto">
            <div className="aura-card">
              <div className="aura-card-inner">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Flame className="w-6 h-6 text-brand-accent" />
                <span>Top Players</span>
              </h2>
              <Leaderboard />
              </div>
              <div className="aura-card-glow" />
            </div>
          </div>

          {/* Provably Fair Banner */}
          <div className="max-w-4xl mx-auto">
            <div className="glass-panel rounded-2xl p-6 text-center border border-white/10">
              <div className="flex items-center justify-center gap-2 text-brand-emerald mb-2">
                <ShieldCheck className="w-5 h-5" />
                <span className="font-semibold">100% Provably Fair</span>
              </div>
              <p className="text-sm text-slate-400">
                All games use Switchboard VRF for verifiable on-chain randomness
              </p>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Back to Lobby Button */}
          <div className="mb-8">
            <button
              onClick={() => setSelectedGame(null)}
              className="glass-panel px-6 py-3 rounded-full font-medium text-white hover:bg-white/10 transition-all duration-300 flex items-center gap-2 border border-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Lobby
            </button>
          </div>

          {/* Game Component */}
          <div className="max-w-6xl mx-auto">
            <div className="aura-card">
              <div className="aura-card-inner">
                {selectedGame === 'coinflip' && <CoinFlip />}
                {selectedGame === 'dice' && <Dice />}
                {selectedGame === 'slots' && <Slots />}
              </div>
              <div className="aura-card-glow" />
            </div>
          </div>
          
          {/* Leaderboard */}
          <div className="max-w-6xl mx-auto">
            <div className="aura-card">
              <div className="aura-card-inner">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Flame className="w-6 h-6 text-brand-accent" />
                <span>Top Players</span>
              </h2>
              <Leaderboard />
              </div>
              <div className="aura-card-glow" />
            </div>
          </div>
          
          {/* Session List */}
          <div className="max-w-6xl mx-auto">
            <div className="aura-card">
              <div className="aura-card-inner">
                <SessionList />
              </div>
              <div className="aura-card-glow" />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

