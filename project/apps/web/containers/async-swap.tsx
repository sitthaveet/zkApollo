"use client";
import { useState } from "react";
import { ArrowDownIcon } from "lucide-react"
import Image from "next/image";

export default function App() {
  const [swapAmount, setSwapAmount] = useState("");
  const [estimatedTSLA, setEstimatedTSLA] = useState("0");

  const handleSwapAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = e.target.value;
    setSwapAmount(amount);
    setEstimatedTSLA((parseFloat(amount) * 0.5).toFixed(2));
  };

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

          {/* Swap button */}
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition duration-200 ease-in-out transform hover:-translate-y-1"
            onClick={() => console.log("Swapping MINA to TSLA:", swapAmount)}
          >
            Swap
          </button>

          {/* Exchange rate */}
          <p className="text-center text-sm text-gray-600">
            1 MINA = 0.5 TSLA
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
