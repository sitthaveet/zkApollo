"use client";
import { Faucet } from "@/components/faucet";
import { useFaucet } from "@/lib/stores/balances";
import { useWalletStore } from "@/lib/stores/wallet";
import { useState } from "react";

export default function App() {
  const wallet = useWalletStore();
  const drip = useFaucet();
  const [stakeAmount, setStakeAmount] = useState("");
  const [mintAmount, setMintAmount] = useState("");

  const handleStake = () => {
    // Implement staking logic here
    console.log("Staking:", stakeAmount);
  };

  const handleMint = () => {
    // Implement minting logic here
    console.log("Minting:", mintAmount);
  };

  return (
    <div className="mx-auto w-[100%] -mt-32 h-full pt-16">
      <div className="flex h-full w-full items-center justify-center pt-16">
        <div className="flex basis-4/12 flex-col items-center justify-center 2xl:basis-3/12">
        <div className="flex flex-col w-full max-w-md items-center justify-center bg-white border border-slate-200 rounded-2xl px-6 pt-6">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Stake & Tokenise</h2>
        </div>
          <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6 border border-slate-200">
            {/* Show Balances (Balance Staked, Your Debt) */}
            <div className="mb-6">
              <div className="bg-gray-100 p-4 rounded-lg shadow-inner">
                <h3 className="text-lg font-semibold mb-3">Your Balances</h3>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Balance Staked:</span>
                  <span className="font-medium text-green-600">1000 MINA</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Your Debt:</span>
                  <span className="font-medium text-red-600">500 TSLA</span>
                </div>
              </div>
            </div>
            {/* Staking Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Stake Tokens</h3>
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="w-full p-2 border rounded mb-2"
                placeholder="Amount to stake"
              />
              <div className="flex justify-end items-center">
                <button className="text-gray-600 text-xs">Set Max</button>
              </div>
              <button
                onClick={handleStake}
                className="w-full bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600"
              >
                Stake
              </button>
            </div>

            {/* LP Section */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Add Liquidity</h3>
              <input
                type="number"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                className="w-full p-2 border rounded mb-2"
                placeholder="Amount of TSLA"
              />
              <div className="flex justify-end items-center">
                <button className="text-gray-600 text-xs">Set Max</button>
              </div>              
              <button
                onClick={handleMint}
                className="w-full bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600"
              >
                Add Liquidity
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
