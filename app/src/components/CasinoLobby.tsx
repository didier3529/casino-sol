import { FC } from 'react';
import { Coins, Dices, GalleryVerticalEnd, Clock } from 'lucide-react';

interface GameCardProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  rtp: string;
  accent: 'accent' | 'gold' | 'error';
  comingSoon?: boolean;
  onClick: () => void;
}

const GameCard: FC<GameCardProps> = ({ title, icon, description, rtp, accent, comingSoon, onClick }) => {
  const accentColors = {
    accent: {
      bg: 'bg-accent-muted',
      text: 'text-accent',
      border: 'hover:border-accent/30',
      glow: 'hover:shadow-glow',
    },
    gold: {
      bg: 'bg-gold-muted',
      text: 'text-gold',
      border: 'hover:border-gold/30',
      glow: 'hover:shadow-glow-gold',
    },
    error: {
      bg: 'bg-error-muted',
      text: 'text-error',
      border: 'hover:border-error/30',
      glow: 'hover:shadow-[0_0_30px_rgba(248,113,113,0.2)]',
    },
  };

  const colors = accentColors[accent];

  return (
    <div 
      className={`surface-elevated p-6 transition-all duration-300 group ${colors.border} ${colors.glow} ${comingSoon ? 'opacity-60' : 'cursor-pointer'}`}
      onClick={comingSoon ? undefined : onClick}
    >
      {comingSoon && (
        <div className="flex items-center gap-1.5 mb-4 px-2 py-1 bg-white/5 rounded-md w-fit">
          <Clock className="w-3 h-3 text-white/40" />
          <span className="text-[10px] font-display font-medium text-white/40 uppercase tracking-wider">Coming Soon</span>
        </div>
      )}
      
      <div className={`w-14 h-14 rounded-xl ${colors.bg} flex items-center justify-center ${colors.text} mb-5 group-hover:scale-105 transition-transform`}>
        {icon}
      </div>
      
      <h3 className="text-xl font-display font-semibold text-white mb-2">{title}</h3>
      
      <p className="text-sm text-white/40 font-body mb-6 leading-relaxed">
        {description}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-white/30 bg-white/5 px-2.5 py-1 rounded-md">
          {rtp}
        </span>
        <button 
          className={`${colors.bg} ${colors.text} text-sm font-display font-semibold px-5 py-2.5 rounded-lg transition-all ${comingSoon ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
          disabled={comingSoon}
        >
          {comingSoon ? 'Soon' : 'Play'}
        </button>
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
      icon: <Coins className="w-7 h-7" />,
      description: 'Double or nothing. 50/50 odds powered by Switchboard VRF.',
      rtp: 'RTP 99.0%',
      accent: 'accent' as const,
      comingSoon: false,
    },
    {
      id: 'dice' as const,
      title: 'Neon Dice',
      icon: <Dices className="w-7 h-7" />,
      description: 'Set your win chance and multiplier. Classic slider dice game.',
      rtp: 'RTP 99.0%',
      accent: 'gold' as const,
      comingSoon: true,
    },
    {
      id: 'slots' as const,
      title: 'Cyber Slots',
      icon: <GalleryVerticalEnd className="w-7 h-7" />,
      description: 'Jackpot potential. Spin to match symbols on the blockchain.',
      rtp: 'RTP 96.5%',
      accent: 'error' as const,
      comingSoon: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {games.map((game) => (
        <GameCard
          key={game.id}
          title={game.title}
          icon={game.icon}
          description={game.description}
          rtp={game.rtp}
          accent={game.accent}
          comingSoon={game.comingSoon}
          onClick={() => onSelectGame(game.id)}
        />
      ))}
    </div>
  );
};
