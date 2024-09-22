import "reflect-metadata";
import { State, StateMap, assert } from "@proto-kit/protocol";
import {
  RuntimeModule,
  runtimeModule,
  runtimeMethod,
  state,
} from "@proto-kit/module";
import { UInt64, Balances } from "@proto-kit/library";
import { PublicKey, Field, Bool, Provable, Signature, Mina, Struct, provable } from "o1js";
//import { SyntheticAsset } from "./syntheticAsset";
import { inject } from "tsyringe";

const divisionBase = 1e10; //check scale doesn't overflow if using 224 bit should not?

let custodyAccount = PublicKey.fromBase58(
  "B62qkE417nEiCGQphoA68xEGCx6AvvJ3rzoY6dVA6hiV54B98vvPRk2"
);

@runtimeModule()
export class CustodyModule extends RuntimeModule<Record<string, never>> {

  // setup state variables
 @state() public totalSupply = State.from<UInt64>(UInt64);
 @state() public usedSupply = State.from<UInt64>(UInt64);
 @state() public assetPrice = State.from<UInt64>(UInt64);
 @state() public minaPrice = State.from<UInt64>(UInt64);
 @state() public admin = State.from<PublicKey>(PublicKey);
 @state() public collateralFactor = State.from<UInt64>(UInt64);
 @state() public minaBalance = State.from<UInt64>(UInt64);
 @state() public oraclePublicKey = State.from<PublicKey>(PublicKey);

 //@state() public syntheticAsset = State.from<SyntheticAsset>(SyntheticAsset);
 //@state() public minaAsset = State.from<SyntheticAsset>(SyntheticAsset);

 @state() public custodyBalances = StateMap.from<PublicKey, UInt64>(PublicKey, UInt64);
 @state() public collateralBalances = StateMap.from<PublicKey, UInt64>(PublicKey, UInt64);
 @state() public senderId = StateMap.from<PublicKey, UInt64>(PublicKey, UInt64);
 @state() public reserveAmount = State.from<UInt64>(UInt64);

  // constructor (can't set value in state here), required by sequencers
  public constructor(
    @inject("Balances") public balances: Balances
  ) {
    super();
  }

  // init method to set value in state
  @runtimeMethod() public async init(
  ): Promise<void> {
    await this.admin.set(await this.transaction.sender.value);
    await this.totalSupply.set(UInt64.from(0));
    await this.usedSupply.set(UInt64.from(0));
    await this.collateralFactor.set(UInt64.from(2));
    await this.reserveAmount.set(UInt64.from(0));
    await this.oraclePublicKey.set(custodyAccount);
    await this.custodyBalances.set(custodyAccount, UInt64.from(0));
    await this.collateralBalances.set(custodyAccount, UInt64.from(0));
    await this.assetPrice.set(UInt64.from(200));
    await this.minaPrice.set(UInt64.from(1));
    await this.collateralFactor.set(UInt64.from(2));
  }

  public async fetchMinaOraclePriceForAmount(amount: UInt64): Promise<UInt64> {
    //add calling Doot oracle for MINA/USD value
    const minaPrice = (await this.minaPrice.get()).value;
    // return (minaPrice.mul(amount)).div(divisionBase);
    return amount;
  }

  public async fetchSyntheticAssetPriceForAmount(amount: UInt64): Promise<UInt64> {
    const price = (await this.assetPrice.get()).value;
    // return (price.mul(amount)).div(divisionBase);
    return price;
  }

  public async getCustodyBalance(address: PublicKey): Promise<UInt64> {
    return (await this.custodyBalances.get(address)).orElse(UInt64.from(0));
  }

  public async setCustodyBalance(address: PublicKey, amount: UInt64) {
    await this.custodyBalances.set(address, amount);
  }

  public async getCollateralBalance(address: PublicKey): Promise<UInt64> {
    return (await this.collateralBalances.get(address)).orElse(UInt64.from(0));
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

  @runtimeMethod() public async updateAssetPrice(newPrice: UInt64): Promise<void>{
    const sender = await this.transaction.sender.value;
    const admin = (await this.admin.get()).value;
    const isSenderAdmin = sender.equals(admin);
    assert(isSenderAdmin, "Only admin can update asset price");
    await this.assetPrice.set(newPrice);
  }

  public async verifyReserveAmount(signature: PublicKey, requiredReserve: UInt64, currentReserve: UInt64, id : UInt64): Promise<void> {

    const oraclePublicKey = (await this.oraclePublicKey.get()).value;
    const currentReserveField: Field = Field.from(currentReserve.value);
    const idField: Field = Field.from(id.value);
    // const validSignature = signature.verify(oraclePublicKey, [idField, currentReserveField]);
    const validSignature = oraclePublicKey.equals(signature);
    assert(validSignature, "Invalid signature");
    const isSufficientReserve = currentReserve.greaterThanOrEqual(requiredReserve);
    assert(isSufficientReserve, "Insufficient reserve");
  }

  @runtimeMethod() public async proveCustodyForMinting(
    reserveAmount: UInt64, 
    newSupply: UInt64, 
    minaAmount: UInt64, 
    signature: PublicKey,
    id: UInt64
    ): Promise<void> {
    //---prove supply of custody asset and add into available supply on Mina, deposit Mina as collateral---

    const sender = await this.transaction.sender.value;
    
    //determine value of mina collateral
    const totalMinaValue = await this.fetchMinaOraclePriceForAmount(minaAmount);

    //check Mina collateral value is greater than new custody, transaction fails if not
    const newCustodyValue = await this.fetchSyntheticAssetPriceForAmount(newSupply);
    const collateralFactor = (await this.collateralFactor.get()).value;
    // const requiredCollateral = newCustodyValue.mul(collateralFactor);
    const requiredCollateral = UInt64.from(100);
    const isSufficientCollateral = requiredCollateral.lessThanOrEqual(totalMinaValue);
    await assert(isSufficientCollateral, "Insufficient collateral");

    //transfer amount of Mina Collateral from user
    //(await this.minaAsset.get()).value.transferFrom(sender, custodyAccount, minaAmount);

    //Call Verification of Proof of RWA
    // await this.verifyReserveAmount(signature, newSupply, reserveAmount, id);

    //record accounting changes
    const existingTotalSupply = (await this.totalSupply.get()).value;
    await this.totalSupply.set(existingTotalSupply.add(newSupply));

    const currentUserCustodyBalance = await this.getCustodyBalance(sender);
    const newCustodyAmount = currentUserCustodyBalance.add(newSupply);
    await  this.setCustodyBalance(sender, newCustodyAmount);

    const currentUserCollateralBalance = await this.getCollateralBalance(sender);
    const newCollateralAmount = currentUserCollateralBalance.add(minaAmount);
    await this.setCollateralBalance(sender, newCollateralAmount);

}

@runtimeMethod() public async removeCustody(removeSupply: UInt64, minaAmount: UInt64): Promise<void> {
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
     const newCustodyValue = await this.fetchSyntheticAssetPriceForAmount(newCustodyAmount);

     const currentUserCollateralBalance = await this.getCollateralBalance(sender);
     const newCollateralAmount = currentUserCollateralBalance.sub(minaAmount);

     const collateralFactor = (await this.collateralFactor.get()).value;
    //  const requiredCollateral = newCustodyValue.mul(collateralFactor);
     const requiredCollateral = UInt64.from(100);
     const totalMinaValue = await this.fetchMinaOraclePriceForAmount(newCollateralAmount);
     const isSufficientCollateral = requiredCollateral.lessThanOrEqual(totalMinaValue);
     assert(isSufficientCollateral, "Insufficient collateral");

     //return mina collateral from custody to user
     //(await this.minaAsset.get()).value.transferFrom(custodyAccount, sender, minaAmount);

     //record accounting changes
     await this.totalSupply.set(existingTotalSupply.sub(removeSupply));
     await this.setCustodyBalance(sender, newCustodyAmount);
     await this.setCollateralBalance(sender, newCollateralAmount);

   
  }

@runtimeMethod() public async mintTokens(minaAmount: UInt64): Promise<void> {
    //---User requests to use synthetic token, paying in Mina---
    const sender = await this.transaction.sender.value;

    //transfer amount of Mina from user for purchase
    //(await this.minaAsset.get()).value.transferFrom(sender, custodyAccount, minaAmount);

    //check value of sent Mina
    
    const minaAmountInUSD = await this.fetchMinaOraclePriceForAmount(minaAmount);

    //convert total amount into syntheticAsset quantity
    const tokenPrice = await this.fetchSyntheticAssetPriceForAmount(UInt64.from(divisionBase));

    const mintTokenAmount = minaAmountInUSD.mul(divisionBase).div(minaAmountInUSD);

    //mint synthetic tokens to user
    //(await this.syntheticAsset.get()).value.mint(sender, mintTokenAmount);

    //accounting updates
    const existingUsedSupply = (await this.usedSupply.get()).value;
    await this.usedSupply.set(existingUsedSupply.add(mintTokenAmount));
  }

  @runtimeMethod() public async burnTokens(burnTokenAmount: UInt64): Promise<void> {
    //---User requests to return synthetic token, selling in Mina---

    const sender = await this.transaction.sender.value;

    //check value of tokens requesting to burn 
    const tokenValue = await this.fetchSyntheticAssetPriceForAmount(burnTokenAmount);

    //determine how many mina tokens this is
    const minaPrice = await this.fetchMinaOraclePriceForAmount(UInt64.from(divisionBase)); //price of 1 Mina token

    const minaReturning = tokenValue.mul(divisionBase).div(minaPrice);

    //send mina tokens from sale of synthetic asset to user
    //(await this.minaAsset.get()).value.transferFrom(custodyAccount, sender, minaReturning);

    //burn synthetic tokens held by user
    //(await this.syntheticAsset.get()).value.burn(sender, burnTokenAmount);

    //accounting update
    const existingUsedSupply = (await this.usedSupply.get()).value;
    await this.usedSupply.set(existingUsedSupply.sub(burnTokenAmount));

  }

}
