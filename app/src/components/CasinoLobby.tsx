/**
 * Casino Lobby - Professional game selection with Aura design
 */

import { FC } from 'react';
import { Coins, Dices, GalleryVerticalEnd } from 'lucide-react';

interface GameCardProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  rtp: string;
  accent: 'accent' | 'secondary' | 'gold';
  onClick: () => void;
}

const GAME_CARD_STYLES: Record<GameCardProps['accent'], {
  outerHoverBorder: string;
  outerHoverShadow: string;
  badgeBg: string;
  badgeText: string;
  playHover: string;
}> = {
  accent: {
    outerHoverBorder: 'hover:border-brand-accent/30',
    outerHoverShadow: 'hover:shadow-[0_0_30px_-10px_rgba(0,212,255,0.25)]',
    badgeBg: 'bg-brand-accent/10',
    badgeText: 'text-brand-accent',
    playHover: 'hover:bg-brand-accent',
  },
  secondary: {
    outerHoverBorder: 'hover:border-brand-secondary/30',
    outerHoverShadow: 'hover:shadow-[0_0_30px_-10px_rgba(255,107,53,0.22)]',
    badgeBg: 'bg-brand-secondary/10',
    badgeText: 'text-brand-secondary',
    playHover: 'hover:bg-brand-secondary',
  },
  gold: {
    outerHoverBorder: 'hover:border-brand-gold/30',
    outerHoverShadow: 'hover:shadow-[0_0_30px_-10px_rgba(255,215,0,0.18)]',
    badgeBg: 'bg-brand-gold/10',
    badgeText: 'text-brand-gold',
    playHover: 'hover:bg-brand-gold',
  },
};

const GameCard: FC<GameCardProps> = ({ title, icon, description, rtp, accent, onClick }) => {
  const styles = GAME_CARD_STYLES[accent];

  return (
    <div 
      className={[
        'glass-panel p-1 rounded-2xl group cursor-pointer transition-all duration-500',
        styles.outerHoverBorder,
        styles.outerHoverShadow,
      ].join(' ')}
      onClick={onClick}
    >
      <div className="bg-[#13131a] rounded-xl p-6 h-full flex flex-col relative overflow-hidden">
        {/* Background icon - subtle */}
        <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
          {icon}
        </div>
        
        {/* Icon badge */}
        <div className={['w-12 h-12 rounded-lg flex items-center justify-center mb-4', styles.badgeBg, styles.badgeText].join(' ')}>
          {icon}
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        
        {/* Description */}
        <p className="text-sm text-slate-400 mb-6 flex-grow">
          {description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto">
          <span className="text-xs font-mono text-slate-500 bg-black/30 px-2 py-1 rounded">
            {rtp}
          </span>
          <button className={['bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors', styles.playHover].join(' ')}>
            Play
          </button>
        </div>
      </div>
    </div>
  );
};

interface CasinoLobbyProps {
  onSelectGame: (game: 'coinflip' | 'dice' | 'slots') => void;
}

export const CasinoLobby: FC<CasinoLobbyProps> = ({ onSelectGame }) => {
  const games = [
    {
      id: 'coinflip' as const,
      title: 'CoinFlip',
      icon: <Coins className="w-6 h-6" />,
      description: 'Double or nothing. 50/50 odds powered by Switchboard randomness.',
      rtp: 'RTP 99.0%',
      accent: 'accent' as const,
    },
    {
      id: 'dice' as const,
      title: 'Neon Dice',
      icon: <Dices className="w-6 h-6" />,
      description: 'Set your win chance and multiplier. Classic slider dice game.',
      rtp: 'RTP 99.0%',
      accent: 'secondary' as const,
    },
    {
      id: 'slots' as const,
      title: 'Cyber Slots',
      icon: <GalleryVerticalEnd className="w-6 h-6" />,
      description: 'Jackpot potential. Spin to match symbols on the blockchain.',
      rtp: 'RTP 96.5%',
      accent: 'gold' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {games.map((game) => (
        <GameCard
          key={game.id}
          title={game.title}
          icon={game.icon}
          description={game.description}
          rtp={game.rtp}
          accent={game.accent}
          onClick={() => onSelectGame(game.id)}
        />
      ))}
    </div>
  );
};






