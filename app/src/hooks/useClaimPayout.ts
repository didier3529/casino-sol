import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, SYSVAR_CLOCK_PUBKEY } from '@solana/web3.js';
import { useState, useMemo } from 'react';
import { useCasino } from './useCasino';
import toast from 'react-hot-toast';

export function useClaimPayout() {
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet();
  const casino = useCasino();
  const [isClaiming, setIsClaiming] = useState(false);

  const claimPayout = useMemo(
    () => async (sessionPubkey: PublicKey, playerPubkey: PublicKey) => {
      if (!anchorWallet || !casino.program) {
        throw new Error('Wallet not connected or program not initialized');
      }

      setIsClaiming(true);
      try {
        const casinoPda = PublicKey.findProgramAddressSync(
          [Buffer.from('casino')],
          casino.program.programId
        )[0];

        const vaultPda = PublicKey.findProgramAddressSync(
          [Buffer.from('vault'), casinoPda.toBuffer()],
          casino.program.programId
        )[0];

        const tx = await casino.program.methods
          .claimPayout()
          .accounts({
            casino: casinoPda,
            session: sessionPubkey,
            vault: vaultPda,
            player: playerPubkey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        return tx;
      } catch (error: any) {
        console.error('Claim payout error:', error);
        throw error;
      } finally {
        setIsClaiming(false);
      }
    },
    [anchorWallet, casino.program]
  );

  return { claimPayout, isClaiming };
}


