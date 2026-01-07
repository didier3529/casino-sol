import { FC } from 'react';
import { Coins, Dices, GalleryVerticalEnd, Clock, Zap, Star, Play } from 'lucide-react';

interface GameCardProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  rtp: string;
  accent: 'accent' | 'gold' | 'error';
  comingSoon?: boolean;
  featured?: boolean;
  onClick: () => void;
}

const GameCard: FC<GameCardProps> = ({ title, icon, description, rtp, accent, comingSoon, featured, onClick }) => {
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
      className={`relative overflow-hidden rounded-2xl border ${colors.border} transition-all duration-500 group ${
        comingSoon ? 'opacity-70' : 'cursor-pointer'
      } ${colors.glow} bg-gradient-to-br from-background-secondary to-background-tertiary`}
      onClick={comingSoon ? undefined : onClick}
    >
      <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b ${colors.gradient} opacity-50`}></div>
      
      {featured && !comingSoon && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 bg-accent/20 rounded-full border border-accent/30">
          <Zap className="w-3 h-3 text-accent" />
          <span className="text-[10px] font-display font-bold text-accent uppercase tracking-wider">Live</span>
        </div>
      )}
      
      {comingSoon && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full border border-white/20">
          <Clock className="w-3 h-3 text-white/60" />
          <span className="text-[10px] font-display font-semibold text-white/60 uppercase tracking-wider">Soon</span>
        </div>
      )}
      
      <div className="relative p-6">
        <div className={`relative w-20 h-20 rounded-2xl ${colors.bg} flex items-center justify-center ${colors.text} mb-6 group-hover:scale-110 transition-all duration-500`}>
          <div className={`absolute inset-0 rounded-2xl ${colors.bg} blur-xl opacity-50 group-hover:opacity-80 transition-opacity`}></div>
          <div className="relative">
            {icon}
          </div>
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
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-display font-bold transition-all duration-300 ${
            comingSoon 
              ? 'bg-white/5 text-white/30 cursor-not-allowed' 
              : `${colors.btnBg} ${colors.btnText} hover:opacity-90 hover:scale-[1.02]`
          }`}
          disabled={comingSoon}
        >
          {comingSoon ? (
            <>
              <Clock className="w-4 h-4" />
              Coming Soon
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Play Now
            </>
          )}
        </button>
        
        {!comingSoon && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="text-[11px] text-white/30 font-body text-center">
              Video trailer coming soon
            </div>
          </div>
        )}
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
      icon: <Coins className="w-10 h-10" />,
      description: 'Double or nothing. 50/50 odds powered by Switchboard VRF for provably fair results.',
      rtp: 'RTP 99%',
      accent: 'accent' as const,
      comingSoon: false,
      featured: true,
    },
    {
      id: 'dice' as const,
      title: 'Neon Dice',
      icon: <Dices className="w-10 h-10" />,
      description: 'Set your win chance and multiplier. Classic slider dice with customizable risk.',
      rtp: 'RTP 99%',
      accent: 'gold' as const,
      comingSoon: true,
      featured: false,
    },
    {
      id: 'slots' as const,
      title: 'Cyber Slots',
      icon: <GalleryVerticalEnd className="w-10 h-10" />,
      description: 'Jackpot potential. Spin to match symbols and win big on the blockchain.',
      rtp: 'RTP 96.5%',
      accent: 'error' as const,
      comingSoon: true,
      featured: false,
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
          comingSoon={game.comingSoon}
          featured={game.featured}
          onClick={() => onSelectGame(game.id)}
        />
      ))}
    </div>
  );
};
