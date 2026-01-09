import { FC, useState } from 'react';
import { ArrowLeft, Gem, Trophy, ShieldCheck } from 'lucide-react';
import { InitializeCasino } from '../components/InitializeCasino';
import { CasinoInfo } from '../components/CasinoInfo';
import { CasinoLobby } from '../components/CasinoLobby';
import { CoinFlip } from '../components/CoinFlip';
import { Dice } from '../components/Dice';
import { Slots } from '../components/Slots';
import { SessionList } from '../components/SessionList';
import { Leaderboard } from '../components/Leaderboard';
import { WalletActivateCard } from '../components/WalletActivateCard';

type GameType = 'coinflip' | 'dice' | 'slots' | null;

export const GamesPage: FC = () => {
  const [selectedGame, setSelectedGame] = useState<GameType>(null);

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-8">
      {selectedGame === null ? (
        <>
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight mb-3">
              Casino Lobby
            </h1>
            <p className="text-white/50 text-lg font-body">
              Select a game to start playing on-chain
            </p>
          </div>

          <div className="max-w-6xl mx-auto mb-8">
            <WalletActivateCard />
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="glass-card p-6">
              <h2 className="text-xl font-display font-semibold text-white mb-5 flex items-center gap-2">
                <Gem className="w-5 h-5 text-gold" />
                <span>Available Games</span>
              </h2>
              <CasinoLobby onSelectGame={setSelectedGame} />
            </div>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="glass-card p-6">
              <CasinoInfo />
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <InitializeCasino />
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="glass-card p-6">
              <h2 className="text-xl font-display font-semibold text-white mb-5 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent" />
                <span>Top Players</span>
              </h2>
              <Leaderboard />
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="glass-card p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-accent mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span className="font-display font-semibold text-sm">100% Provably Fair</span>
              </div>
              <p className="text-xs text-white/40 font-body">
                All games use Switchboard VRF for verifiable on-chain randomness
              </p>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="mb-6">
            <button
              onClick={() => setSelectedGame(null)}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Lobby
            </button>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="glass-card p-6">
              {selectedGame === 'coinflip' && <CoinFlip />}
              {selectedGame === 'dice' && <Dice />}
              {selectedGame === 'slots' && <Slots />}
            </div>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="glass-card p-6">
              <h2 className="text-xl font-display font-semibold text-white mb-5 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent" />
                <span>Top Players</span>
              </h2>
              <Leaderboard />
            </div>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="glass-card p-6">
              <SessionList />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
