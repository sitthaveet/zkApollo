import { Button } from "@/components/ui/button";
import protokit from "@/public/protokit-zinc.svg";
import Image from "next/image";
// @ts-ignore
import truncateMiddle from "truncate-middle";
import { Skeleton } from "@/components/ui/skeleton";
import { Chain } from "./chain";
import { Separator } from "./ui/separator";
import { ArrowUpRight } from "lucide-react";

export interface HeaderProps {
  loading: boolean;
  wallet?: string;
  onConnectWallet: () => void;
  balance?: string;
  balanceLoading: boolean;
  tslaBalance?: string;
  blockHeight?: string;
}

export default function Header({
  loading,
  wallet,
  onConnectWallet,
  balance,
  balanceLoading,
  blockHeight,
  tslaBalance
}: HeaderProps) {
  return (
    <div>
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex bg-white/90 backdrop-blur-md rounded-full shadow-lg p-2 max-w-5xl w-[70vw] border border-gray-200">
        <div className="container flex items-center justify-between px-2">
          <div className="flex items-center">
            <a className="flex items-center gap-2 mr-4" href="/">
              <Image src="/logo.svg" alt="Apollo" width={32} height={32} />
              <div className="text-xl font-bold font-mono">zkApollo</div>
            </a>
            <Separator className="mr-4 h-8 hidden md:block" orientation="vertical" />
            <div className="flex gap-6">
              <a className="text-sm font-bold font-mono hover:text-blue-600 transition-colors" href="/swap">Buy</a>
              <a className="text-sm font-bold font-mono hover:text-blue-600 transition-colors" href="/app">Liquidity</a>
              <a className="text-sm font-bold font-mono hover:text-blue-600 transition-colors" href="/about">About</a>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
          <a href="/faucet" className=" flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-full text-sm font-bold font-mono hover:bg-blue-700 transition-colors">
              Faucet 💧
            </a>
            {wallet && (
              <div className="flex flex-col items-end justify-center mx-2">
                <p className="text-xs">Your balance</p>
                <div className="w-28 pt-0.5 text-right">
                  {balanceLoading && balance === undefined ? (
                    <Skeleton className="h-4 w-full" />
                  ) : (
                    <p className="text-xs font-bold">{balance} MINA | {tslaBalance} TSLA</p>
                  )}
                </div>
              </div>
            )}
            <Button loading={loading} onClick={onConnectWallet}>
              <div className="text-sm">
                {wallet ? truncateMiddle(wallet, 4, 4, "...") : "Connect wallet"}
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
    {/* <div className="h-10 w-full bg-blue-600" /> */}
    </div>
  );
}
