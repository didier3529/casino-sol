import { FC } from 'react';
import { Zap, Star, Play } from 'lucide-react';
import coinflipIcon from '../assets/game-icons/coinflip.jpg';
import diceIcon from '../assets/game-icons/dice.png';
import slotsIcon from '../assets/game-icons/slots.png';

interface GameCardProps {
  title: string;
  iconSrc: string;
  description: string;
  rtp: string;
  accent: 'accent' | 'gold' | 'error';
  iconSize?: 'normal' | 'large';
  onClick: () => void;
}

const GameCard: FC<GameCardProps> = ({ title, iconSrc, description, rtp, accent, iconSize = 'normal', onClick }) => {
  const sizeClasses = iconSize === 'large' ? 'w-56 h-56' : 'w-40 h-40';
  const accentColors = {
    accent: {
      bg: 'bg-accent/20',
      text: 'text-accent',
      border: 'border-accent/20 hover:border-accent/40',
      glow: 'shadow-[0_0_40px_rgba(58,243,224,0.15)] hover:shadow-[0_0_60px_rgba(58,243,224,0.25)]',
      gradient: 'from-accent/10 via-transparent to-transparent',
      btnBg: 'bg-accent',
      btnText: 'text-background',
    },
    gold: {
      bg: 'bg-gold/20',
      text: 'text-gold',
      border: 'border-gold/20 hover:border-gold/40',
      glow: 'shadow-[0_0_40px_rgba(242,185,80,0.15)] hover:shadow-[0_0_60px_rgba(242,185,80,0.25)]',
      gradient: 'from-gold/10 via-transparent to-transparent',
      btnBg: 'bg-gold',
      btnText: 'text-background',
    },
    error: {
      bg: 'bg-error/20',
      text: 'text-error',
      border: 'border-error/20 hover:border-error/40',
      glow: 'shadow-[0_0_40px_rgba(248,113,113,0.15)] hover:shadow-[0_0_60px_rgba(248,113,113,0.25)]',
      gradient: 'from-error/10 via-transparent to-transparent',
      btnBg: 'bg-error',
      btnText: 'text-white',
    },
  };

  const colors = accentColors[accent];

  return (
    <div 
      className={`relative overflow-hidden rounded-2xl border ${colors.border} transition-all duration-500 group cursor-pointer ${colors.glow} bg-gradient-to-br from-background-secondary to-background-tertiary`}
      onClick={onClick}
    >
      <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b ${colors.gradient} opacity-50`}></div>
      
      <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 bg-accent/20 rounded-full border border-accent/30">
        <Zap className="w-3 h-3 text-accent" />
        <span className="text-[10px] font-display font-bold text-accent uppercase tracking-wider">Live</span>
      </div>
      
      <div className="relative p-6">
        <div className={`relative ${sizeClasses} mb-6 group-hover:scale-110 transition-all duration-500`}>
          <img 
            src={iconSrc} 
            alt={title} 
            className={`${sizeClasses} object-contain rounded-2xl`}
          />
        </div>
        
        <h3 className="text-2xl font-display font-bold text-white mb-2 group-hover:text-white/90 transition-colors">{title}</h3>
        
        <p className="text-sm text-white/50 font-body mb-6 leading-relaxed min-h-[3rem]">
          {description}
        </p>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg">
            <Star className="w-3 h-3 text-gold" />
            <span className="text-xs font-mono text-white/60">{rtp}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg">
            <span className="text-xs font-mono text-white/40">House Edge 1%</span>
          </div>
        </div>

        <button 
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-display font-bold transition-all duration-300 text-background hover:scale-[1.02]"
          style={{
            background: 'linear-gradient(135deg, #3AF3E0 0%, #ff6bea 50%, #F2B950 100%)',
            boxShadow: '0 0 20px rgba(58, 243, 224, 0.4), 0 0 40px rgba(255, 107, 234, 0.2)',
            animation: 'neonButtonPulse 2s ease-in-out infinite',
          }}
        >
          <Play className="w-4 h-4" />
          Play Now
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
      iconSrc: coinflipIcon,
      description: 'Double or nothing. 50/50 odds powered by Switchboard VRF for provably fair results.',
      rtp: 'RTP 99%',
      accent: 'accent' as const,
      iconSize: 'normal' as const,
    },
    {
      id: 'dice' as const,
      title: 'Neon Dice',
      iconSrc: diceIcon,
      description: 'Set your win chance and multiplier. Classic slider dice with customizable risk.',
      rtp: 'RTP 99%',
      accent: 'gold' as const,
      iconSize: 'large' as const,
    },
    {
      id: 'slots' as const,
      title: 'Cyber Slots',
      iconSrc: slotsIcon,
      description: 'Jackpot potential. Spin to match symbols and win big on the blockchain.',
      rtp: 'RTP 96.5%',
      accent: 'error' as const,
      iconSize: 'large' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {games.map((game) => (
        <GameCard
          key={game.id}
          title={game.title}
          iconSrc={game.iconSrc}
          description={game.description}
          rtp={game.rtp}
          accent={game.accent}
          iconSize={game.iconSize}
          onClick={() => onSelectGame(game.id)}
        />
      ))}
    </div>
  );
};
