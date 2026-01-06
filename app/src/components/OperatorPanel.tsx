import { FC, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import BN from 'bn.js';
import { useCasino } from '../hooks/useCasino';
import { useDrainVault } from '../hooks/useDrainVault';
import { useFundVault } from '../hooks/useFundVault';
import { useRefundExpired } from '../hooks/useRefundExpired';
import { formatLamportsToSol } from '../utils/format';
import { BuybackPanel } from './BuybackPanel';
import { isOperatorPublicKey } from '../utils/operatorGate';
import toast from 'react-hot-toast';
import { RefreshCw, Trash2, DollarSign, Zap, ChevronDown, Wallet, Clock, Database, AlertCircle, Flame, Info } from 'lucide-react';

/**
 * Operator Panel - Private UI for casino operators
 * 
 * This component is ONLY shown when:
 * - VITE_OPERATOR_BUILD=true (separate build)
 * - Connected wallet is in VITE_OPERATOR_WALLETS allowlist
 * - Wallet is the casino authority
 */
export const OperatorPanel: FC = () => {
  const { publicKey } = useWallet();
  const { fetchCasino, fetchVaultBalance } = useCasino();
  const { drainVault, isDraining } = useDrainVault();
  const { fundVault, isFunding } = useFundVault();
  const { findExpiredSessions, refundExpiredSessions, isRefunding } = useRefundExpired();
  
  const [casinoData, setCasinoData] = useState<any>(null);
  const [vaultBalance, setVaultBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [drainAmount, setDrainAmount] = useState<string>('');
  const [fundAmount, setFundAmount] = useState<string>('');
  const [expiredCount, setExpiredCount] = useState<number>(0);
  
  // Collapsible sections state
  const [vaultExpanded, setVaultExpanded] = useState(true);
  const [sessionExpanded, setSessionExpanded] = useState(true);
  const [buybackExpanded, setBuybackExpanded] = useState(true);

  // Check if user is authorized operator
  const isOperator = isOperatorPublicKey(publicKey);
  const isAuthority = casinoData && publicKey && 
    casinoData.authority.toBase58() === publicKey.toBase58();

  const loadCasinoInfo = async () => {
    setIsLoading(true);
    try {
      const casino = await fetchCasino();
      const balance = await fetchVaultBalance();
      setCasinoData(casino);
      setVaultBalance(balance);
    } catch (error) {
      console.error('Error loading casino info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExpiredSessions = async () => {
    const expired = await findExpiredSessions();
    setExpiredCount(expired.length);
  };

  useEffect(() => {
    if (publicKey && isOperator) {
      loadCasinoInfo();
      loadExpiredSessions();
      
      // Auto-refresh
      const interval = setInterval(() => {
        loadCasinoInfo();
        loadExpiredSessions();
      }, 15000);
      
      return () => clearInterval(interval);
    }
  }, [publicKey, isOperator]);

  if (!publicKey || !isOperator || !isAuthority) {
    return null;
  }

  const handleDrainVault = async () => {
    const amountSol = parseFloat(drainAmount);
    if (isNaN(amountSol) || amountSol <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    const amountLamports = new BN(Math.floor(amountSol * LAMPORTS_PER_SOL));
    const vaultLamports = new BN(vaultBalance);
    
    if (amountLamports.gt(vaultLamports)) {
      toast.error('Amount exceeds vault balance');
      return;
    }
    
    const result = await drainVault(amountLamports);
    if (result) {
      setDrainAmount('');
      setTimeout(loadCasinoInfo, 2000);
    }
  };

  const handleDrainAll = async () => {
    if (vaultBalance === 0) {
      toast.error('Vault is empty');
      return;
    }
    const result = await drainVault(new BN(vaultBalance));
    if (result) {
      setTimeout(loadCasinoInfo, 2000);
    }
  };

  const handleFundVault = async (solAmount: number) => {
    const amountLamports = new BN(Math.floor(solAmount * LAMPORTS_PER_SOL));
    const result = await fundVault(amountLamports);
    if (result) {
      setFundAmount('');
      setTimeout(loadCasinoInfo, 2000);
    }
  };

  const handleRebootSessions = async () => {
    const result = await refundExpiredSessions(10);
    if (result.success > 0) {
      setTimeout(loadExpiredSessions, 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Operator Header */}
      <div className="aura-card group border-2 border-brand-accent/50">
        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-brand-accent/20 to-brand-purple/20">
                <Zap className="w-7 h-7 text-brand-accent" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-1">Operator Controls</h2>
                <p className="text-sm text-slate-400 font-mono">
                  Authority: {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-6)}
                </p>
              </div>
            </div>
            <div className="px-4 py-2 rounded-full bg-brand-accent/20 border border-brand-accent/30">
              <span className="text-xs font-bold text-brand-accent uppercase tracking-wider">Private</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vault Management Section */}
      <div className="aura-card group">
        <div className="relative z-10 p-6">
          <button
            onClick={() => setVaultExpanded(!vaultExpanded)}
            className="w-full flex items-center justify-between text-left group/header"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-brand-emerald/20 to-brand-accent/20 group-hover/header:from-brand-emerald/30 group-hover/header:to-brand-accent/30 transition-all">
                <Wallet className="w-6 h-6 text-brand-emerald" />
              </div>
              <h3 className="text-2xl font-bold text-white">Vault Management</h3>
              <span className="text-sm px-4 py-1.5 rounded-full bg-brand-emerald/20 text-brand-emerald font-mono font-bold border border-brand-emerald/30">
                {formatLamportsToSol(vaultBalance)} SOL
              </span>
            </div>
            <ChevronDown className="w-6 h-6 text-slate-400 transition-transform duration-300" style={{ transform: vaultExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </button>
        
          {vaultExpanded && (
            <div className="mt-6 space-y-6 animate-fadeIn">
              {/* Vault Balance Display */}
              <div className="relative overflow-hidden rounded-xl bg-slate-900/50 border border-white/10 p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-emerald/10 to-brand-emerald/0" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <Database className="w-5 h-5 text-brand-emerald" />
                    <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">Current Vault Balance</div>
                  </div>
                  <div className="text-4xl font-bold text-brand-emerald font-mono">
                    {formatLamportsToSol(vaultBalance)} SOL
                  </div>
                </div>
              </div>

              {/* Fund Vault Controls */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                  <DollarSign className="w-4 h-4 text-brand-emerald" />
                  Fund Vault
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="Amount (SOL)"
                    className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 transition-all outline-none"
                    step="0.1"
                    min="0"
                  />
                  <button
                    onClick={() => handleFundVault(parseFloat(fundAmount))}
                    disabled={isFunding || !fundAmount}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-emerald to-brand-accent text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all flex items-center gap-2"
                  >
                    <DollarSign className="w-4 h-4" />
                    {isFunding ? 'Funding...' : 'Fund'}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleFundVault(0.5)}
                    disabled={isFunding}
                    className="px-4 py-2 rounded-lg bg-slate-900/50 border border-white/10 hover:border-brand-emerald/50 hover:bg-brand-emerald/10 text-white text-sm font-semibold transition-all disabled:opacity-50"
                  >
                    +0.5 SOL
                  </button>
                  <button
                    onClick={() => handleFundVault(1)}
                    disabled={isFunding}
                    className="px-4 py-2 rounded-lg bg-slate-900/50 border border-white/10 hover:border-brand-emerald/50 hover:bg-brand-emerald/10 text-white text-sm font-semibold transition-all disabled:opacity-50"
                  >
                    +1 SOL
                  </button>
                  <button
                    onClick={() => handleFundVault(5)}
                    disabled={isFunding}
                    className="px-4 py-2 rounded-lg bg-slate-900/50 border border-white/10 hover:border-brand-emerald/50 hover:bg-brand-emerald/10 text-white text-sm font-semibold transition-all disabled:opacity-50"
                  >
                    +5 SOL
                  </button>
                </div>
              </div>

              {/* Drain Vault Controls */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                  <Trash2 className="w-4 h-4 text-red-400" />
                  Drain Vault
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={drainAmount}
                    onChange={(e) => setDrainAmount(e.target.value)}
                    placeholder="Amount (SOL)"
                    className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:border-red-400 focus:ring-2 focus:ring-red-400/20 transition-all outline-none"
                    step="0.1"
                    min="0"
                    max={vaultBalance / LAMPORTS_PER_SOL}
                  />
                  <button
                    onClick={handleDrainVault}
                    disabled={isDraining || !drainAmount}
                    className="px-6 py-3 rounded-xl bg-slate-900/50 border border-red-400/30 hover:border-red-400 hover:bg-red-400/10 text-red-400 font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDraining ? 'Draining...' : 'Drain'}
                  </button>
                </div>
                <button
                  onClick={handleDrainAll}
                  disabled={isDraining || vaultBalance === 0}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-900/50 border border-red-400/30 hover:border-red-400 hover:bg-red-400/10 text-red-400 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Drain All ({formatLamportsToSol(vaultBalance)} SOL)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Session Management Section */}
      <div className="aura-card group">
        <div className="relative z-10 p-6">
          <button
            onClick={() => setSessionExpanded(!sessionExpanded)}
            className="w-full flex items-center justify-between text-left group/header"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 group-hover/header:from-yellow-500/30 group-hover/header:to-orange-500/30 transition-all">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">Session Management</h3>
              {expiredCount > 0 && (
                <span className="text-sm px-4 py-1.5 rounded-full bg-yellow-500/20 text-yellow-400 font-mono font-bold border border-yellow-500/30">
                  {expiredCount} expired
                </span>
              )}
            </div>
            <ChevronDown className="w-6 h-6 text-slate-400 transition-transform duration-300" style={{ transform: sessionExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </button>
          
          {sessionExpanded && (
            <div className="mt-6 space-y-6 animate-fadeIn">
              <div className="relative overflow-hidden rounded-xl bg-slate-900/50 border border-white/10 p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-yellow-500/0" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                    <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">Expired Pending Sessions</div>
                  </div>
                  <div className="text-4xl font-bold text-yellow-400 font-mono">
                    {expiredCount} session{expiredCount !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              <button
                onClick={handleRebootSessions}
                disabled={isRefunding || expiredCount === 0}
                className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(234,179,8,0.5)] transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-5 h-5 ${isRefunding ? 'animate-spin' : ''}`} />
                {isRefunding ? 'Refunding...' : `Reboot My Sessions (${expiredCount})`}
              </button>
              
              <div className="p-4 rounded-lg bg-slate-900/30 border border-white/5">
                <p className="text-xs text-slate-400 flex items-start gap-2">
                  <Info className="w-4 h-4 text-brand-accent flex-shrink-0 mt-[1px]" />
                  <span>Refunds expired pending sessions for your wallet. Bets are returned from the vault and session accounts are closed.</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Buyback & Burn Section */}
      <div className="aura-card group">
        <div className="relative z-10 p-6">
          <button
            onClick={() => setBuybackExpanded(!buybackExpanded)}
            className="w-full flex items-center justify-between text-left group/header"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 group-hover/header:from-orange-500/30 group-hover/header:to-red-500/30 transition-all">
                <Flame className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">Buyback & Burn</h3>
            </div>
            <ChevronDown className="w-6 h-6 text-slate-400 transition-transform duration-300" style={{ transform: buybackExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </button>
          
          {buybackExpanded && (
            <div className="mt-6 animate-fadeIn">
              <BuybackPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
