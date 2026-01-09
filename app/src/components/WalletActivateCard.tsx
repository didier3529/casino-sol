import { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Zap, Shield, Wallet } from 'lucide-react';
import powerButtonIcon from '../assets/power-button.png';

export const WalletActivateCard: FC = () => {
  const { connected } = useWallet();

  if (connected) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-background-secondary via-background-tertiary to-background-secondary">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-gold/5"></div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>
      
      <div 
        className="absolute -top-24 -right-24 w-48 h-48 rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(58, 243, 224, 0.4) 0%, transparent 70%)',
        }}
      ></div>
      <div 
        className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(242, 185, 80, 0.4) 0%, transparent 70%)',
        }}
      ></div>

      <div className="relative p-8 md:p-10">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative cursor-pointer group">
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(242, 185, 80, 0.4) 0%, transparent 70%)',
                animation: 'powerPulse 2s ease-in-out infinite',
              }}
            ></div>
            <img 
              src={powerButtonIcon} 
              alt="Activate Casino" 
              className="w-36 h-36 object-contain relative z-10 group-hover:scale-110 transition-transform duration-300"
              style={{
                filter: 'drop-shadow(0 0 25px rgba(242, 185, 80, 0.6))',
                animation: 'powerButtonPump 1.5s ease-in-out infinite',
              }}
            />
            <div 
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gold/20 border border-gold/40"
              style={{
                animation: 'powerPulse 2s ease-in-out infinite',
              }}
            >
              <span className="text-[10px] font-display font-bold text-gold uppercase tracking-wider whitespace-nowrap">Click to Activate</span>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h3 
              className="text-2xl md:text-3xl font-display font-bold mb-3"
              style={{
                background: 'linear-gradient(135deg, #FAFAFA 0%, #3AF3E0 50%, #F2B950 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Activate the Casino
            </h3>
            <p className="text-white/50 font-body text-base md:text-lg mb-6 max-w-md">
              Connect your Solana wallet to unlock provably fair games and start winning on-chain
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
                <Shield className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-display text-accent">Non-Custodial</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20">
                <Zap className="w-3.5 h-3.5 text-gold" />
                <span className="text-xs font-display text-gold">Instant Payouts</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <Wallet className="w-3.5 h-3.5 text-white/60" />
                <span className="text-xs font-display text-white/60">Phantom & More</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div
              className="relative group"
              style={{
                filter: 'drop-shadow(0 0 20px rgba(58, 243, 224, 0.3))',
              }}
            >
              <div 
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(58, 243, 224, 0.2), rgba(255, 107, 234, 0.2), rgba(242, 185, 80, 0.2))',
                  filter: 'blur(10px)',
                }}
              ></div>
              <WalletMultiButton 
                className="!rounded-xl !font-display !font-bold !text-base !px-8 !py-4 !transition-all !duration-300 hover:!scale-105"
                style={{
                  background: 'linear-gradient(135deg, #3AF3E0 0%, #ff6bea 50%, #F2B950 100%)',
                  color: '#06060A',
                  border: 'none',
                  boxShadow: '0 0 30px rgba(58, 243, 224, 0.4), 0 0 60px rgba(255, 107, 234, 0.2)',
                }}
              />
            </div>
            <span className="text-xs text-white/30 font-body">Secure & Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
};
