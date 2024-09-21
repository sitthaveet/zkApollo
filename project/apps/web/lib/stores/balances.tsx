import { create } from "zustand";
import { Client, useClientStore } from "./client";
import { immer } from "zustand/middleware/immer";
import { PendingTransaction, UnsignedTransaction } from "@proto-kit/sequencer";
import { Balance, BalancesKey, TokenId } from "@proto-kit/library";
import { PublicKey, UInt64 } from "o1js";
import { useCallback, useEffect } from "react";
import { useChainStore } from "./chain";
import { useWalletStore } from "./wallet";

export interface BalancesState {
  loading: boolean;
  balances: {
    // address - balance
    [key: string]: string;
  };
  loadBalance: (client: Client, address: string) => Promise<void>;
  faucet: (client: Client, address: string) => Promise<PendingTransaction>;
  stake: (client: Client, address: string, amount: Balance, reserve: Balance) => Promise<PendingTransaction>;
  swap: (client: Client, address: string, amount: Balance) => Promise<PendingTransaction>;
}

function isPendingTransaction(
  transaction: PendingTransaction | UnsignedTransaction | undefined,
): asserts transaction is PendingTransaction {
  if (!(transaction instanceof PendingTransaction))
    throw new Error("Transaction is not a PendingTransaction");
}

export const mina_tokenId = TokenId.from(0);
export const tsla_tokenId = TokenId.from(1);

export const useBalancesStore = create<
  BalancesState,
  [["zustand/immer", never]]
>(
  immer((set) => ({
    loading: Boolean(false),
    balances: {},
    async loadBalance(client: Client, address: string) {
      set((state) => {
        state.loading = true;
      });

      const mina_key = BalancesKey.from(mina_tokenId, PublicKey.fromBase58(address));
      const tsla_key = BalancesKey.from(tsla_tokenId, PublicKey.fromBase58(address));

      const mina_balance = await client.query.runtime.CustodyModule.balances.get(mina_key);
      const tsla_balance = await client.query.runtime.CustodyModule.balances.get(tsla_key);
      const collateral_balance = await client.query.runtime.CustodyModule.collateralBalances.get(PublicKey.fromBase58(address));
      const custody_balance = await client.query.runtime.CustodyModule.custodyBalances.get(PublicKey.fromBase58(address));
      const used_supply = await client.query.runtime.CustodyModule.usedSupply.get();
      const total_supply = await client.query.runtime.CustodyModule.totalSupply.get();
      set((state) => {
        state.loading = false;
        state.balances[`${address}_mina`] = mina_balance?.toString() ?? "0";
        state.balances[`${address}_tsla`] = tsla_balance?.toString() ?? "0";
        state.balances[`${address}_custody`] = custody_balance?.toString() ?? "0";
        state.balances[`${address}_collateral`] = collateral_balance?.toString() ?? "0";
        state.balances[`used_supply`] = used_supply?.toString() ?? "0";
        state.balances[`total_supply`] = total_supply?.toString() ?? "0";
      });
    },
    async faucet(client: Client, address: string) {
      const balances = client.runtime.resolve("CustodyModule");
      const sender = PublicKey.fromBase58(address);

      const tx = await client.transaction(sender, async () => {
        await balances.addBalance(mina_tokenId, sender, Balance.from(100_000));
      });

      await tx.sign();
      await tx.send();

      isPendingTransaction(tx.transaction);
      return tx.transaction;
    },

    async stake(client: Client, address: string, amount: Balance, reserve: Balance) {
      const balances = client.runtime.resolve("CustodyModule");
      const sender = PublicKey.fromBase58(address);

      const tx = await client.transaction(sender, async () => {
        await balances.stakeAndAddReserve(
          sender,
          mina_tokenId,
          amount,
          tsla_tokenId,
          reserve
        );
      });

      await tx.sign();
      await tx.send();

      isPendingTransaction(tx.transaction);
      return tx.transaction;
    },

    async swap(client: Client, address: string, amount: Balance) {
      const balances = client.runtime.resolve("CustodyModule");
      const sender = PublicKey.fromBase58(address);

      const tx = await client.transaction(sender, async () => {
        await balances.swap(sender, mina_tokenId, amount, tsla_tokenId);
      });

      await tx.sign();
      await tx.send();

      isPendingTransaction(tx.transaction);
      return tx.transaction;
    }
  })),
);

export const useObserveBalance = () => {
  const client = useClientStore();
  const chain = useChainStore();
  const wallet = useWalletStore();
  const balances = useBalancesStore();

  useEffect(() => {
    if (!client.client || !wallet.wallet) return;

    balances.loadBalance(client.client, wallet.wallet);
  }, [client.client, chain.block?.height, wallet.wallet]);
};

export const useFaucet = () => {
  const client = useClientStore();
  const balances = useBalancesStore();
  const wallet = useWalletStore();

  return useCallback(async () => {
    if (!client.client || !wallet.wallet) return;

    const pendingTransaction = await balances.faucet(
      client.client,
      wallet.wallet,
    );

    wallet.addPendingTransaction(pendingTransaction);
  }, [client.client, wallet.wallet]);
};

export const useStake = () => {
  const client = useClientStore();
  const wallet = useWalletStore();
  const balances = useBalancesStore();

  return useCallback(async (amount: Balance, reserve: Balance) => {
    if (!client.client || !wallet.wallet) return;
    const pendingTransaction = await balances.stake(
      client.client,
      wallet.wallet,
      amount,
      reserve
    );
    wallet.addPendingTransaction(pendingTransaction);
  }, [client.client, wallet.wallet]);
};

export const useSwap = () => {
  const client = useClientStore();
  const wallet = useWalletStore();
  const balances = useBalancesStore();

  return useCallback(async (amount: Balance) => {
    if (!client.client || !wallet.wallet) return;
    const pendingTransaction = await balances.swap(
      client.client,
      wallet.wallet,
      amount
    );
    wallet.addPendingTransaction(pendingTransaction);
  }, [client.client, wallet.wallet]);
};