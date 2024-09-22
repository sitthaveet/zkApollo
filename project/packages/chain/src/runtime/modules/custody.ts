import "reflect-metadata";
import { State, StateMap, assert } from "@proto-kit/protocol";
import {
	RuntimeModule,
	runtimeModule,
	runtimeMethod,
	state,
} from "@proto-kit/module";
import {
	UInt64,
	Balance,
	Balances as BaseBalances,
	TokenId,
} from "@proto-kit/library";
import {
	PublicKey,
	Field,
	Bool,
	Provable,
	Signature,
	Mina,
	Struct,
	provable,
} from "o1js";

import { inject } from "tsyringe";

const MINA_PRICE = 5;
const TSLA_PRICE = 1000;
const COLLATERAL_FACTOR = 2;

interface BalancesConfig {
	totalSupply: Balance;
}

@runtimeModule()
export class CustodyModule extends BaseBalances<BalancesConfig> {
	// setup state variables
	@state() public totalSupply = State.from<UInt64>(UInt64);
	@state() public usedSupply = State.from<UInt64>(UInt64);
	@state() public assetPrice = State.from<UInt64>(UInt64);
	@state() public admin = State.from<PublicKey>(PublicKey);
	@state() public collateralFactor = State.from<UInt64>(UInt64);

	@state() public oraclePublicKey = State.from<PublicKey>(PublicKey);

	@state() public minaCirculatingSupply = State.from<Balance>(Balance);
	@state() public tslaCirculatingSupply = State.from<Balance>(Balance);

	@state() public custodyBalances = StateMap.from<PublicKey, UInt64>(
		PublicKey,
		UInt64
	);
	@state() public collateralBalances = StateMap.from<PublicKey, UInt64>(
		PublicKey,
		UInt64
	);
	@state() public senderId = StateMap.from<PublicKey, UInt64>(
		PublicKey,
		UInt64
	);
	@state() public reserveAmount = State.from<UInt64>(UInt64);

	// constructor (can't set value in state here), required by sequencers
	public constructor() {
		super();
	}

	// init method to set value in state
	@runtimeMethod() public async init(): Promise<void> {
		await this.admin.set(await this.transaction.sender.value);
		await this.totalSupply.set(UInt64.from(0));
		await this.usedSupply.set(UInt64.from(0));
		await this.collateralFactor.set(UInt64.from(2));
		await this.reserveAmount.set(UInt64.from(0));
	}

	// Faucet for MINA
	@runtimeMethod()
	public async addBalance(
		tokenId: TokenId,
		address: PublicKey,
		amount: Balance
	): Promise<void> {
		const circulatingSupply = await this.minaCirculatingSupply.get();
		const newCirculatingSupply = Balance.from(circulatingSupply.value).add(
			amount
		);
		assert(
			newCirculatingSupply.lessThanOrEqual(this.config.totalSupply),
			"Circulating supply would be higher than total supply"
		);
		await this.minaCirculatingSupply.set(newCirculatingSupply);
		await this.mint(tokenId, address, amount);
	}

	public async minaToUsd(amount: UInt64): Promise<UInt64> {
		// TODO: add calling Doot oracle for MINA/USD value
		const minaPrice = UInt64.from(MINA_PRICE);
		return minaPrice.mul(amount);
	}

	public async tslaToUsd(amount: UInt64): Promise<UInt64> {
		const price = UInt64.from(TSLA_PRICE);
		return price.mul(amount);
	}

	public async getCustodyBalance(address: PublicKey): Promise<UInt64> {
		return (await this.custodyBalances.get(address)).orElse(UInt64.from(0));
	}

	public async setCustodyBalance(address: PublicKey, amount: UInt64) {
		await this.custodyBalances.set(address, amount);
	}

	public async getCollateralBalance(address: PublicKey): Promise<UInt64> {
		return (await this.collateralBalances.get(address)).orElse(
			UInt64.from(0)
		);
	}

	public async setCollateralBalance(address: PublicKey, amount: UInt64) {
		await this.collateralBalances.set(address, amount);
	}

	public async getSenderId(address: PublicKey): Promise<UInt64> {
		return (await this.senderId.get(address)).orElse(UInt64.from(0));
	}

	//currently only the admin can add new asset providers, once KYC or other security measures are added this can be relaxed
	public async setSenderId(address: PublicKey, amount: UInt64) {
		const sender = await this.transaction.sender.value;
		const admin = (await this.admin.get()).value;
		const isSenderAdmin = sender.equals(admin);
		assert(isSenderAdmin, "Only admin can update asset price");
		await this.senderId.set(address, amount);
	}

	public async setOraclePublicKey(oraclePublicKey: PublicKey) {
		const sender = await this.transaction.sender.value;
		const admin = (await this.admin.get()).value;
		const isSenderAdmin = sender.equals(admin);
		assert(isSenderAdmin, "Only admin can update asset price");
		await this.oraclePublicKey.set(oraclePublicKey);
	}

	@runtimeMethod() public async updateAssetPrice(
		newPrice: UInt64
	): Promise<void> {
		const sender = await this.transaction.sender.value;
		const admin = (await this.admin.get()).value;
		const isSenderAdmin = sender.equals(admin);
		assert(isSenderAdmin, "Only admin can update asset price");
		await this.assetPrice.set(newPrice);
	}

	public async verifyReserveAmount(
		signature: Signature,
		requiredReserve: UInt64,
		currentReserve: UInt64,
		id: UInt64
	): Promise<void> {
		const oraclePublicKey = (await this.oraclePublicKey.get()).value;
		const currentReserveField: Field = Field.from(currentReserve.value);
		const validSignature = signature.verify(oraclePublicKey, [
			id.value,
			currentReserveField,
		]);
		// Check that the signature is valid
		validSignature.assertTrue();
		// Check that the provided reserve is equal to or higher than required
		currentReserve.assertGreaterThanOrEqual(requiredReserve);
	}

	@runtimeMethod() public async proveCustodyForMinting(
		reserveAmount: UInt64,
		newSupply: UInt64,
		minaAmount: UInt64,
		signature: Signature
	): Promise<void> {
		//---prove supply of custody asset and add into available supply on Mina, deposit Mina as collateral---

		const sender = await this.transaction.sender.value;
		const senderId = await this.getSenderId(sender);

		//determine value of mina collateral
		const totalMinaValue = await this.minaToUsd(minaAmount);

		//check Mina collateral value is greater than new custody, transaction fails if not
		const newCustodyValue = await this.tslaToUsd(newSupply);
		const collateralFactor = (await this.collateralFactor.get()).value;
		const requiredCollateral = newCustodyValue.mul(collateralFactor);
		totalMinaValue.assertGreaterThanOrEqual(requiredCollateral);

		//Call Verification of Proof of RWA
		await this.verifyReserveAmount(
			signature,
			newSupply,
			reserveAmount,
			senderId
		);

		//record accounting changes
		const existingTotalSupply = (await this.totalSupply.get()).value;
		await this.totalSupply.set(existingTotalSupply.add(newSupply));

		const currentUserCustodyBalance = await this.getCustodyBalance(sender);
		const newCustodyAmount = currentUserCustodyBalance.add(newSupply);
		await this.setCustodyBalance(sender, newCustodyAmount);

		const currentUserCollateralBalance =
			await this.getCollateralBalance(sender);
		const newCollateralAmount =
			currentUserCollateralBalance.add(minaAmount);
		await this.setCollateralBalance(sender, newCollateralAmount);
	}

	@runtimeMethod() public async removeCustody(
		removeSupply: UInt64,
		minaAmount: UInt64
	): Promise<void> {
		//---Remove unused existing available supply from Mina, refund mina deposit collateral---

		const sender = await this.transaction.sender.value;

		//check there is sufficient unused custody asset to remove
		const existingTotalSupply = (await this.totalSupply.get()).value;
		const existingUsedSupply = (await this.usedSupply.get()).value;

		const freeSupply = existingTotalSupply.sub(existingUsedSupply);
		freeSupply.assertGreaterThanOrEqual(removeSupply);

		//check removing mina collateral doesn't reduce custody below collateral requirements
		const currentUserCustodyBalance = await this.getCustodyBalance(sender);
		const newCustodyAmount = currentUserCustodyBalance.sub(removeSupply);
		const newCustodyValue = await this.tslaToUsd(newCustodyAmount);

		const currentUserCollateralBalance =
			await this.getCollateralBalance(sender);
		const newCollateralAmount =
			currentUserCollateralBalance.sub(minaAmount);

		const collateralFactor = (await this.collateralFactor.get()).value;
		const requiredCollateral = newCustodyValue.mul(collateralFactor);
		const totalMinaValue = await this.minaToUsd(newCollateralAmount);
		totalMinaValue.assertGreaterThanOrEqual(requiredCollateral);

		//record accounting changes
		await this.totalSupply.set(existingTotalSupply.sub(removeSupply));
		await this.setCustodyBalance(sender, newCustodyAmount);
		await this.setCollateralBalance(sender, newCollateralAmount);
	}

	@runtimeMethod() public async stakeMina(
		account: PublicKey,
		minaTokenId: TokenId,
		minaAmount: Balance
	): Promise<void> {
		//---User requests to use synthetic token, paying in Mina---
		assert(
			this.transaction.sender.value.equals(account),
			"Staking can only be done by the owner of the address"
		);
		//transfer amount of Mina from user for purchase
		await this.burn(minaTokenId, account, Balance.from(minaAmount));

		// Add collateral balance for sender
		const currentCollateralBalance =
			await this.getCollateralBalance(account);
		const newCollateralBalance = currentCollateralBalance.add(minaAmount);
		await this.setCollateralBalance(account, newCollateralBalance);
	}

	@runtimeMethod() public async addReserve(
		account: PublicKey,
		tslaTokenId: TokenId,
		tslaAmount: Balance
	): Promise<void> {
		assert(
			this.transaction.sender.value.equals(account),
			"Staking can only be done by the owner of the address"
		);
		// check value of collateral balance of sender
		const maxMint = await this.maxMint(account);
		tslaAmount.assertLessThanOrEqual(maxMint);

		// Add to their custody balance
		const currentCustodyBalance = await this.getCustodyBalance(account);
		const newCustodyBalance = currentCustodyBalance.add(tslaAmount);
		await this.setCustodyBalance(account, newCustodyBalance);

		// Update total supply of custody tokens
		const existingTotalSupply = (await this.totalSupply.get()).value;
		await this.totalSupply.set(existingTotalSupply.add(tslaAmount));
	}

	@runtimeMethod() public async stakeAndAddReserve(
		account: PublicKey,
		minaTokenId: TokenId,
		minaAmount: Balance,
		tslaTokenId: TokenId,
		tslaAmount: Balance
	): Promise<void> {
		await this.stakeMina(account, minaTokenId, minaAmount);
		await this.addReserve(account, tslaTokenId, tslaAmount);
	}

	// method to view max mint
	public async maxMint(sender: PublicKey): Promise<UInt64> {
		const currentCollateralBalance =
			await this.getCollateralBalance(sender);
		const minaAmountInUSD = await this.minaToUsd(currentCollateralBalance);

		// already custody balance in USD
		const currentCustodyBalance = await this.getCustodyBalance(sender);
		const custodyValue = await this.tslaToUsd(currentCustodyBalance);

		return minaAmountInUSD
			.div(UInt64.from(COLLATERAL_FACTOR))
			.sub(custodyValue);
	}

	// Swap MINA for TSLA
	@runtimeMethod() public async swap(
		account: PublicKey,
		minaTokenId: TokenId,
		minaAmount: Balance,
		tslaTokenId: TokenId
	): Promise<void> {
		// Check if there is available supply to mint
		const usedSupply = (await this.usedSupply.get()).value;
		const totalSupply = (await this.totalSupply.get()).value;
		const availableTslaSupply = totalSupply.sub(usedSupply);
		const tslaAmount = minaAmount
			.mul(MINA_PRICE)
			.div(UInt64.from(TSLA_PRICE));

		Provable.log("Available Supply", availableTslaSupply);
		Provable.log("TSLA Amount", tslaAmount);
		Provable.log("Mina Amount", minaAmount);

		availableTslaSupply.assertGreaterThanOrEqual(tslaAmount);

		// Take in MINA from user
		await this.burn(minaTokenId, account, Balance.from(minaAmount));

		// Mint TSLA to user
		await this.mint(tslaTokenId, account, Balance.from(tslaAmount));

		// Update used supply
		const existingUsedSupply = (await this.usedSupply.get()).value;
		await this.usedSupply.set(existingUsedSupply.add(tslaAmount));
	}

	// @runtimeMethod() public async burnTokens(burnTokenAmount: UInt64): Promise<void> {
	//   //---User requests to return synthetic token, selling in Mina---

	//   const sender = await this.transaction.sender.value;

	//   //check value of tokens requesting to burn
	//   const tokenValue = await this.fetchSyntheticAssetPriceForAmount(burnTokenAmount);

	//   //determine how many mina tokens this is
	//   const minaPrice = await this.fetchMinaOraclePriceForAmount(UInt64.from(divisionBase)); //price of 1 Mina token

	//   const minaReturning = tokenValue.mul(divisionBase).div(minaPrice);

	//   //send mina tokens from sale of synthetic asset to user
	//   //(await this.minaAsset.get()).value.transferFrom(custodyAccount, sender, minaReturning);

	//   //burn synthetic tokens held by user
	//   //(await this.syntheticAsset.get()).value.burn(sender, burnTokenAmount);

	//   //accounting update
	//   const existingUsedSupply = (await this.usedSupply.get()).value;
	//   await this.usedSupply.set(existingUsedSupply.sub(burnTokenAmount));

	// }
}
