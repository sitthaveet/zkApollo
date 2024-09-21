import "reflect-metadata";
import { State, StateMap, assert } from "@proto-kit/protocol";
import {
  RuntimeModule,
  runtimeModule,
  runtimeMethod,
  state,
} from "@proto-kit/module";
import { UInt224, UInt64, Balances } from "@proto-kit/library";
import { PublicKey, Field, Bool, Provable, Signature, Mina, Struct, provable } from "o1js";
import { SyntheticAsset } from "./syntheticAsset";
import { inject } from "tsyringe";

const divisionBase = 1e10; //check scale doesn't overflow if using 224 bit should not?

let custodyAccount = PublicKey.fromBase58(
  "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef"
);

@runtimeModule()
export class CustodyModule extends RuntimeModule<Record<string, never>> {

  // setup state variables
 @state() public totalSupply = State.from<UInt224>(UInt224);
 @state() public usedSupply = State.from<UInt224>(UInt224);
 @state() public assetPrice = State.from<UInt224>(UInt224);
 @state() public admin = State.from<PublicKey>(PublicKey);
 @state() public collateralFactor = State.from<UInt224>(UInt224);
 @state() public minaBalance = State.from<UInt224>(UInt224);
 @state() public oraclePublicKey = State.from<PublicKey>(PublicKey);

 @state() public syntheticAsset = State.from<SyntheticAsset>(SyntheticAsset);
 @state() public minaAsset = State.from<SyntheticAsset>(SyntheticAsset);

 @state() public custodyBalances = StateMap.from<PublicKey, UInt224>(PublicKey, UInt224);
 @state() public collateralBalances = StateMap.from<PublicKey, UInt224>(PublicKey, UInt224);
 @state() public senderId = StateMap.from<PublicKey, UInt224>(PublicKey, UInt224);
 @state() public reserveAmount = State.from<UInt224>(UInt224);

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
  }

  public async fetchMinaOraclePriceForAmount(amount: UInt224): Promise<UInt224> {
    //add calling Doot oracle for MINA/USD value
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

  public async getSenderId(address: PublicKey): Promise<UInt224> {
    return (await this.senderId.get(address)).orElse(UInt224.from(0));
  }

  //currently only the admin can add new asset providers, once KYC or other security measures are added this can be relaxed
  public async setSenderId(address: PublicKey, amount: UInt224) {
    const sender = this.transaction.sender.value;
    const admin = (await this.admin.get()).value;
    const isSenderAdmin = sender.equals(admin);
    assert(isSenderAdmin, "Only admin can update asset price");
    await this.senderId.set(address, amount);
  }

  @runtimeMethod() public async updateAssetPrice(newPrice: UInt224): Promise<void>{
    const sender = this.transaction.sender.value;
    const admin = (await this.admin.get()).value;
    const isSenderAdmin = sender.equals(admin);
    assert(isSenderAdmin, "Only admin can update asset price");
    await this.assetPrice.set(newPrice);
  }

  public async verifyReserveAmount(signature: Signature, requiredReserve: UInt224, currentReserve: UInt224, id : UInt224): Promise<void> {

    const oraclePublicKey = this.oraclePublicKey.get();
    const validSignature = signature.verify(oraclePublicKey, [id, currentReserve]);
    // Check that the signature is valid
    validSignature.assertTrue();
    // Check that the provided credit score is 700 or higher
    currentReserve.assertGreaterThanOrEqual(requiredReserve);
  }

  @runtimeMethod() public async proveCustodyForMinting(
    reserveAmount: UInt224, 
    newSupply: UInt224, 
    minaAmount: UInt224, 
    signature: Signature
    ): Promise<void> {
    //---prove supply of custody asset and add into available supply on Mina, deposit Mina as collateral---

    const sender = this.transaction.sender.value;
    const senderId = this.getSenderId(sender);
    
    //determine value of mina collateral
    const totalMinaValue = await this.fetchMinaOraclePriceForAmount(minaAmount);

    //check Mina collateral value is greater than new custody, transaction fails if not
    const newCustodyValue = await this.fetchSyntheticAssetPriceForAmount(newSupply);
    const collateralFactor = (await this.collateralFactor.get()).value;
    const requiredCollateral = newCustodyValue.mul(collateralFactor);
    totalMinaValue.assertGreaterThanOrEqual(requiredCollateral);

    //transfer amount of Mina Collateral from user
    (await this.minaAsset.get()).value.transferFrom(sender, custodyAccount, minaAmount);

    //Call Verification of Proof of RWA
    await this.verifyReserveAmount(signature, newSupply, reserveAmount, senderId);

    //record accounting changes
    const existingTotalSupply = (await this.totalSupply.get()).value;
    this.totalSupply.set(existingTotalSupply.add(newSupply));

    const currentUserCustodyBalance = await this.getCustodyBalance(sender);
    const newCustodyAmount = currentUserCustodyBalance.add(newSupply);
    this.setCustodyBalance(sender, newCustodyAmount);

    const currentUserCollateralBalance = await this.getCollateralBalance(sender);
    const newCollateralAmount = currentUserCollateralBalance.add(minaAmount);
    this.setCollateralBalance(sender, newCollateralAmount);

}

@runtimeMethod() public async removeCustody(removeSupply: UInt224, minaAmount: UInt224): Promise<void> {
     //---Remove unused existing available supply from Mina, refund mina deposit collateral---

     const sender = this.transaction.sender.value;

     //check there is sufficient unused custody asset to remove
     const existingTotalSupply = (await this.totalSupply.get()).value;
     const existingUsedSupply = (await this.usedSupply.get()).value;

     const freeSupply = existingTotalSupply.sub(existingUsedSupply);
     freeSupply.assertGreaterThanOrEqual(removeSupply);

     //check removing mina collateral doesn't reduce custody below collateral requirements
     const currentUserCustodyBalance = await this.getCustodyBalance(sender);
     const newCustodyAmount = currentUserCustodyBalance.sub(removeSupply);
     const newCustodyValue = await this.fetchSyntheticAssetPriceForAmount(newCustodyAmount);

     const currentUserCollateralBalance = await this.getCollateralBalance(sender);
     const newCollateralAmount = currentUserCollateralBalance.sub(minaAmount);

     const collateralFactor = (await this.collateralFactor.get()).value;
     const requiredCollateral = newCustodyValue.mul(collateralFactor);
     const totalMinaValue = await this.fetchMinaOraclePriceForAmount(newCollateralAmount);
     totalMinaValue.assertGreaterThanOrEqual(requiredCollateral);

     //return mina collateral from custody to user
     (await this.minaAsset.get()).value.transferFrom(custodyAccount, sender, minaAmount);

     //record accounting changes
     this.totalSupply.set(existingTotalSupply.sub(removeSupply));
     this.setCustodyBalance(sender, newCustodyAmount);
     this.setCollateralBalance(sender, newCollateralAmount);

   
  }

@runtimeMethod() public async mintTokens(minaAmount: UInt224): Promise<void> {
    //---User requests to use synthetic token, paying in Mina---
    const sender = this.transaction.sender.value;

    //transfer amount of Mina from user for purchase
    (await this.minaAsset.get()).value.transferFrom(sender, custodyAccount, minaAmount);

    //check value of sent Mina
    
    const minaAmountInUSD = await this.fetchMinaOraclePriceForAmount(minaAmount);

    //convert total amount into syntheticAsset quantity
    const tokenPrice = await this.fetchSyntheticAssetPriceForAmount(UInt224.from(divisionBase));

    const mintTokenAmount = minaAmountInUSD.mul(divisionBase).div(minaAmountInUSD);

    //mint synthetic tokens to user
    (await this.syntheticAsset.get()).value.mint(sender, mintTokenAmount);

    //accounting updates
    const existingUsedSupply = (await this.usedSupply.get()).value;
    this.usedSupply.set(existingUsedSupply.add(mintTokenAmount));
  }

  @runtimeMethod() public async burnTokens(burnTokenAmount: UInt224): Promise<void> {
    //---User requests to return synthetic token, selling in Mina---

    const sender = this.transaction.sender.value;

    //check value of tokens requesting to burn 
    const tokenValue = await this.fetchSyntheticAssetPriceForAmount(burnTokenAmount);

    //determine how many mina tokens this is
    const minaPrice = await this.fetchMinaOraclePriceForAmount(UInt224.from(divisionBase)); //price of 1 Mina token

    const minaReturning = tokenValue.mul(divisionBase).div(minaPrice);

    //send mina tokens from sale of synthetic asset to user
    (await this.minaAsset.get()).value.transferFrom(custodyAccount, sender, minaReturning);

    //burn synthetic tokens held by user
    (await this.syntheticAsset.get()).value.burn(sender, burnTokenAmount);

    //accounting update
    const existingUsedSupply = (await this.usedSupply.get()).value;
    this.usedSupply.set(existingUsedSupply.sub(burnTokenAmount));

  }

}
