import "reflect-metadata";
import { State, StateMap, assert } from "@proto-kit/protocol";
import {
  RuntimeModule,
  runtimeModule,
  runtimeMethod,
  state,
} from "@proto-kit/module";
import { UInt224, UInt64, Balances } from "@proto-kit/library";
import { PublicKey, Field, Bool, Provable, Signature, Mina } from "o1js";
import { SyntheticAsset } from "./syntheticAsset";
import { inject } from "tsyringe";

const divisionBase = 1e10; //check scale doesn't overflow if using 224 bit should not?
// public key of Copper
let _copperPublicKey = PublicKey.fromBase58(
  "B62qoAE4rBRuTgC42vqvEyUqCGhaZsW58SKVW4Ht8aYqP9UTvxFWBgy"
);

@runtimeModule()
export class CustodyModule extends RuntimeModule<Record<string, never>> {

  // setup state variables
 @state() public totalSupply = State.from<UInt224>(UInt224);
 @state() public usedSupply = State.from<UInt224>(UInt224);
 @state() public assetPrice = State.from<UInt224>(UInt224);
 @state() public admin = State.from<PublicKey>(PublicKey);
 @state() public collateralFactor = State.from<UInt224>(UInt224);
 @state() public syntheticAsset = State.from<SyntheticAsset>(SyntheticAsset);

 @state() public custodyBalances = StateMap.from<PublicKey, UInt224>(PublicKey, UInt224);
 @state() public collateralBalances = StateMap.from<PublicKey, UInt224>(PublicKey, UInt224);
 @state() public reserveAmount = State.from<UInt224>(UInt224);
 @state() public copperPublicKey = State.from<PublicKey>(PublicKey);

  // constructor (can't set value in state here), required by sequencers
  public constructor(
    @inject("Balances") public balances: Balances
  ) {
    super();
  }

  // init method to set value in state
  @runtimeMethod() public async init(
  ): Promise<void> {
    await this.admin.set(this.transaction.sender.value);
    await this.totalSupply.set(UInt224.from(0));
    await this.usedSupply.set(UInt224.from(0));
    await this.collateralFactor.set(UInt224.from(2));
    await this.reserveAmount.set(UInt224.from(0));
    await this.copperPublicKey.set(_copperPublicKey);
  }

  public async fetchMinaOraclePriceForAmount(amount: UInt224): Promise<UInt224> {
    //call doot oracle for MINA/USD value
    const minaPrice = UInt224.from(divisionBase);
    return (minaPrice.mul(amount)).div(divisionBase);
  }

  public async fetchSyntheticAssetPriceForAmount(amount: UInt224): Promise<UInt224> {
    const price = (await this.assetPrice.get()).value;
    return (price.mul(amount)).div(divisionBase);
  }

  public async getCustodyBalance(address: PublicKey): Promise<UInt224> {
    return (await this.custodyBalances.get(address)).orElse(UInt224.from(0));
  }

  public async setCustodyBalance(address: PublicKey, amount: UInt224) {
    await this.custodyBalances.set(address, amount);
  }

  public async getCollateralBalance(address: PublicKey): Promise<UInt224> {
    return (await this.collateralBalances.get(address)).orElse(UInt224.from(0));
  }

  public async setCollateralBalance(address: PublicKey, amount: UInt224) {
    await this.collateralBalances.set(address, amount);
  }

  @runtimeMethod() public async updateAssetPrice(newPrice: UInt224): Promise<void>{
    const sender = this.transaction.sender.value;
    const admin = (await this.admin.get()).value;
    const isSenderAdmin = sender.equals(admin);
    assert(isSenderAdmin, "Only admin can update asset price");
    await this.assetPrice.set(newPrice);
  }


  @runtimeMethod() public async proveCustodyForMinting(reserveAmount: UInt224, requiredAmount: UInt224, newSupply: UInt224): Promise<void> {
    //---prove supply of custody asset and add mTSLA into available supply on AppChain, deposit Mina as collateral---
    
    

    //check amount of transfered Mina Collateral

    //determine value of mina collateral
    const minaAmount = UInt224.from(divisionBase);
    const totalMinaValue = await this.fetchMinaOraclePriceForAmount(minaAmount);

    //check Mina collateral value is greater than new custody 
    const newCustodyValue = await this.fetchSyntheticAssetPriceForAmount(newSupply);
    const collateralFactor = (await this.collateralFactor.get()).value;
    const requiredCollateral = newCustodyValue.mul(collateralFactor);
    const isMinaValueMoreThanRequired = totalMinaValue.greaterThanOrEqual(requiredCollateral);
    assert(isMinaValueMoreThanRequired, "Your collateral value is less than required");

    //Call Verification of Proof of RWA here!
      // set realAmount to the state
      await this.reserveAmount.set(reserveAmount);

      // check if reserve amount is greater or equal to the required amount
      const isReserveAmountMoreThanRequired = requiredAmount.lessThanOrEqual(reserveAmount);
      assert(
        isReserveAmountMoreThanRequired,
        "You have not enough reserves to mint the synthetic asset"
      );

    //record accounting changes
    const sender = await this.transaction.sender.value;
    const existingTotalSupply = (await this.totalSupply.get()).value;
    await this.totalSupply.set(existingTotalSupply.add(newSupply));

    const currentUserCustodyBalance = await this.getCustodyBalance(sender);
    const newCustodyAmount = currentUserCustodyBalance.add(newSupply);
    await this.setCustodyBalance(sender, newCustodyAmount);

    const currentUserCollateralBalance = await this.getCollateralBalance(sender);
    const newCollateralAmount = currentUserCollateralBalance.add(minaAmount);
    await this.setCollateralBalance(sender, newCollateralAmount);

}

@runtimeMethod() public async removeCustody(removeSupply: UInt224): Promise<void> {
    //---Remove unused existing available mTSLA supply from Mina, refund mina deposit collateral---

    //check there is sufficient unused custody asset to remove
    const existingTotalSupply = (await this.totalSupply.get()).value;
    const existingUsedSupply = (await this.usedSupply.get()).value;

    const freeSupply = existingTotalSupply.sub(existingUsedSupply);
    const isFreeSupplyMoreThanRemoveSupply = removeSupply.lessThanOrEqual(freeSupply);
    assert(isFreeSupplyMoreThanRemoveSupply, "You hit the minimum amount of required amount in your custody");

    //return mina collateral
    
    const minaReturned = UInt224.from(divisionBase);

    //record accounting changes
    const sender = await this.transaction.sender.value
    await this.totalSupply.set(existingTotalSupply.sub(removeSupply));

    const currentUserCustodyBalance = await this.getCustodyBalance(sender);
    const newCustodyAmount = currentUserCustodyBalance.sub(removeSupply);
    await this.setCustodyBalance(sender, newCustodyAmount);

    const currentUserCollateralBalance = await this.getCollateralBalance(sender);
    const newCollateralAmount = currentUserCollateralBalance.sub(minaReturned);
    await this.setCollateralBalance(sender, newCollateralAmount);
  }

@runtimeMethod() public async mintTokens(): Promise<void> {
    //---User requests to use synthetic token, paying in Mina---

    //check value of sent Mina
    const minaReceived = UInt224.from(divisionBase);
    const minaAmountInUSD = await this.fetchMinaOraclePriceForAmount(minaReceived);

    //convert total amount into syntheticAsset quantity
    const tokenPrice = await this.fetchSyntheticAssetPriceForAmount(UInt224.from(divisionBase));

    const mintTokenAmount = minaAmountInUSD.mul(divisionBase).div(minaAmountInUSD);

    //mint synthetic tokens to user
    const sender = await this.transaction.sender.value;

    (await this.syntheticAsset.get()).value.mint(sender, mintTokenAmount);

    //accounting updates
    const existingUsedSupply = (await this.usedSupply.get()).value;
    await this.usedSupply.set(existingUsedSupply.add(mintTokenAmount));
  }

@runtimeMethod() public async burnTokens(burnTokenAmount: UInt224): Promise<void> {
    //---User requests to return synthetic token, selling in Mina---

    //check value of tokens requesting to burn 
    const tokenValue = await this.fetchSyntheticAssetPriceForAmount(burnTokenAmount);

    //determine how many mina tokens this is
    const minaPrice = await this.fetchMinaOraclePriceForAmount(UInt224.from(divisionBase)); //price of 1 Mina token

    const minaReturning = tokenValue.mul(divisionBase).div(minaPrice);

    //send mina tokens to user

    //burn synthetic tokens held by user
    const sender = await this.transaction.sender.value;

    (await this.syntheticAsset.get()).value.burn(sender, burnTokenAmount);

    //accounting update
    const existingUsedSupply = (await this.usedSupply.get()).value;
    await this.usedSupply.set(existingUsedSupply.sub(burnTokenAmount));

    //should probably record total Mina collateral in system also
  }

}
