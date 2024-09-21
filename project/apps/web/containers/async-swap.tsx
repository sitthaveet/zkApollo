"use client";
import { useState } from "react";
import { ArrowDownIcon } from "lucide-react"
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { useBalancesStore, useSwap } from "@/lib/stores/balances";
import { useWalletStore } from "@/lib/stores/wallet";
import { Balance } from "@proto-kit/library";

export default function App() {
  const [swapAmount, setSwapAmount] = useState("");
  const [estimatedTSLA, setEstimatedTSLA] = useState("0");
  const { balances } = useBalancesStore();
  const wallet = useWalletStore();
  const swap = useSwap();
  
  const userMinaBalance = parseFloat(balances[`${wallet.wallet}_mina`] || "0");
  const availableLiquidity = Number(balances["total_supply"]) - Number(balances["used_supply"]);

  const handleSwapAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = e.target.value;
    setSwapAmount(amount);
    const estimatedAmount = (parseFloat(amount) / 200).toFixed(2);
    setEstimatedTSLA(estimatedAmount);
  };

  const handleMaxClick = () => {
    setSwapAmount(userMinaBalance.toString());
    setEstimatedTSLA((userMinaBalance / 200).toFixed(2));
  };

  const handleSwap = () => {
    console.log("Swapping MINA to TSLA:", swapAmount);
    swap(Balance.from(swapAmount));
  };

  const isSwapDisabled = 
    parseFloat(swapAmount) <= 0 || 
    parseFloat(swapAmount) > userMinaBalance ||
    parseFloat(estimatedTSLA) > availableLiquidity;

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <div>
        <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl px-6 pt-6">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Buy</h2>
        </div>
      <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-xl border border-slate-200">
        <div className="space-y-4">
          {/* MINA Input */}
          <div className="p-4 bg-gray-100 rounded-xl">
            <label className="block text-sm font-medium text-gray-700 mb-2">You pay</label>
            <div className="flex items-center">
              <input
                className="w-full bg-transparent text-2xl font-semibold text-gray-900 focus:outline-none"
                type="number"
                placeholder="0.0"
                value={swapAmount}
                onChange={handleSwapAmountChange}
              />
              <div className="ml-2 font-semibold text-gray-700 flex items-center">
                <Image src="/mina.svg" alt="MINA" width={20} height={20} className="rounded-full"/>
                <span className="ml-1">MINA</span>
              </div>
            </div>
              <button
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                onClick={handleMaxClick}
              >
                Max
              </button>
          </div>

          {/* Swap arrow */}
          <div className="flex justify-center -my-2">
            <div className="bg-gray-50 p-2 rounded-full">
              <ArrowDownIcon className="h-6 w-6 text-gray-600" />
            </div>
          </div>

          {/* TSLA Output */}
          <div className="p-4 bg-gray-100 rounded-xl">
            <label className="block text-sm font-medium text-gray-700 mb-2">You receive</label>
            <div className="flex items-center">
              <input
                className="w-full bg-transparent text-2xl font-semibold text-gray-900 focus:outline-none"
                type="text"
                placeholder="0.0"
                value={estimatedTSLA}
                readOnly
              />
              <div className="ml-2 font-semibold text-gray-700 flex items-center">
                <Image src="/tsla.svg" alt="TSLA" width={20} height={20} className="rounded-full"/>
                <span className="ml-1">TSLA</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center border border-slate-200 rounded-xl p-2">
          <p className="text-center text-sm text-gray-600">
            1 MINA = {200} TSLA
          </p>
          <Separator className="my-2" />
          <p className="text-center text-sm text-gray-600">
            Liquidity: {availableLiquidity} TSLA
          </p>
          </div>

          {/* Swap button */}
          <button
            className={`w-full font-bold py-3 px-4 rounded-xl transition duration-200 ease-in-out transform hover:-translate-y-1 ${
              isSwapDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
            onClick={handleSwap}
            disabled={isSwapDisabled}
          >
            {isSwapDisabled ? "Insufficient balance or liquidity" : "Swap"}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
