"use client";
import { Faucet } from "@/components/faucet";
import { useBalancesStore, useFaucet, useStake } from "@/lib/stores/balances";
import { useWalletStore } from "@/lib/stores/wallet";
import { Balance } from "@proto-kit/library";
import { useState } from "react";
import Image from "next/image";

export default function App() {
  const wallet = useWalletStore();
  const drip = useFaucet();
  const stake = useStake();
  const {balances} = useBalancesStore();
  const [stakeAmount, setStakeAmount] = useState("");
  const [mintAmount, setMintAmount] = useState("");

  const maxMint = (Number(stakeAmount) + (Number(balances[`${wallet.wallet}_collateral`])) * 0.5 / 2) - (Number(balances[`${wallet.wallet}_custody`]) * 100);
  const availableMina = Number(balances[`${wallet.wallet}_mina`]) || 0;

  const handleStake = () => {
    // Implement staking logic here
    console.log("Staking:", stakeAmount);
    stake(Balance.from(stakeAmount), Balance.from(mintAmount));
  };

  const isStakeDisabled = Number(stakeAmount) > availableMina || Number(stakeAmount) <= 0 || Number(mintAmount) <= 0;

  const handleMaxMina = () => {
    setStakeAmount(availableMina.toString());
  };

  return (
    <div className="mx-auto w-[100%] -mt-32 h-full pt-16">
      <div className="flex h-full w-full items-center justify-center pt-16">
        <div className="flex basis-4/12 flex-col items-center justify-center 2xl:basis-3/12">
        <div className="flex flex-col w-full max-w-md items-center justify-center bg-white border border-slate-200 rounded-2xl px-6 pt-6">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Lock & Mint</h2>
        </div>
          <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-xl border border-slate-200">
            {/* Show Balances (Balance Staked, Your Debt) */}
            <div className="mb-6">
              <div className="bg-gray-100 p-4 rounded-lg shadow-inner">
                <h3 className="text-lg font-semibold mb-3">Your Position</h3>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Locked Balance:</span>
                  <span className="font-medium text-green-600">{balances[`${wallet.wallet}_collateral`]} MINA</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Your Reserve:</span>
                  <span className="font-medium text-red-600">{balances[`${wallet.wallet}_custody`]} TSLA</span>
                </div>

                {/* Progress Bar showing % of MAX */}
                <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(Number(balances[`${wallet.wallet}_custody`]) * 100 / maxMint) * 100}%` }}></div>
                </div>
              </div>
            </div>
            {/* Staking Section */}
            <div className="space-y-4">
              <div className="p-4 bg-gray-100 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">Lock Tokens</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="w-full bg-transparent text-2xl font-semibold text-gray-900 focus:outline-none"
                    placeholder="0.0"
                    max={availableMina}
                  />
                  <div className="ml-2 font-semibold text-gray-700 flex items-center">
                    <Image src="/mina.svg" alt="MINA" width={20} height={20} className="rounded-full"/>
                    <span className="ml-1">MINA</span>
                  </div>
                </div>
                  <button
                    onClick={handleMaxMina}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Max
                  </button>
              </div>

              {/* LP Section */}
              <div className="p-4 bg-gray-100 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">Add RWA Backup</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={mintAmount}
                    onChange={(e) => setMintAmount(e.target.value)}
                    className="w-full bg-transparent text-2xl font-semibold text-gray-900 focus:outline-none"
                    placeholder="0.0"
                    max={maxMint}
                  />
                  <div className="ml-2 font-semibold text-gray-700 flex items-center">
                    <Image src="/tsla.svg" alt="TSLA" width={20} height={20} className="rounded-full"/>
                    <span className="ml-1">TSLA</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleStake}
                className={`w-full font-bold py-3 px-4 rounded-xl transition duration-200 ease-in-out transform hover:-translate-y-1 ${
                  isStakeDisabled
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
                disabled={isStakeDisabled}
              >
                Stake & Add Reserve
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
