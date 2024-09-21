import { State, StateMap, assert } from "@proto-kit/protocol";
import {
  RuntimeModule,
  runtimeModule,
  runtimeMethod,
  state,
} from "@proto-kit/module";
import { UInt224, UInt64 } from "@proto-kit/library";
import { PublicKey, Field, Bool, Provable, Signature, Mina } from "o1js";

const divisionBase = 1e10; //check scale doesn't overflow if using 224 bit should not?

/*
interface BalancesConfig {
    totalSupply: UInt64;
  }

@runtimeModule()
export class Balances extends RuntimeModule<BalancesConfig> {
  
}
*/ //do you need the above?

@runtimeModule()
export class CustodyModule extends RuntimeModule<Record<string, never>> {

  // setup state variables
 @state() public totalSupply = State.from<UInt224>(UInt224);
 @state() public usedSupply = State.from<UInt224>(UInt224);
 @state() public assetPrice = State.from<UInt224>(UInt224);
 @state() public admin = State.from<PublicKey>(PublicKey);
 @state() public collateralFactor = State.from<UInt224>(UInt224);

 @state() public custodyBalances = StateMap.from<PublicKey, UInt224>(PublicKey, UInt224);
 @state() public collateralBalances = StateMap.from<PublicKey, UInt224>(PublicKey, UInt224);

  // define event
  events = {
    verified: UInt224,
  };

  // init method
  @runtimeMethod() public async init(

  ): Promise<void> {
    this.admin.set(this.transaction.sender.value);
    this.totalSupply.set(UInt224.from(0));
    this.usedSupply.set(UInt224.from(0));
    this.collateralFactor.set(UInt224.from(2));
  }

  public async fetchMinaOraclePriceForAmount(amount: UInt224): Promise<UInt224> {
    //call doot oracle for MINA/USD value
    const minaPrice = UInt224.from(1);
    return (minaPrice.mul(amount)).div(divisionBase);
  }

  public async fetchSyntheticAssetPriceForAmount(amount: UInt224): Promise<UInt224> {
    const price = (await this.assetPrice.get()).value;
    return (price.mul(amount)).div(divisionBase);
  }

  public async getCustodyBalance(address: PublicKey): Promise<UInt224> {
    const balance = (await this.custodyBalances.get(address)); //.orElse(UInt224.from(0));
    // Instantiate the UInt64 struct, only required if you're storing structs in the state
    return balance.value;
  }

  public setCustodyBalance(address: PublicKey, amount: UInt224) {
    this.custodyBalances.set(address, amount);
  }

  public async getCollateralBalance(address: PublicKey): Promise<UInt224> {
    const balance = (await this.collateralBalances.get(address)); //.orElse(UInt224.from(0));
    // Instantiate the UInt64 struct, only required if you're storing structs in the state
    return balance.value;
  }

  public setCollateralBalance(address: PublicKey, amount: UInt224) {
    this.collateralBalances.set(address, amount);
  }

  @runtimeMethod() public async updateAssetPrice(newPrice: UInt224): Promise<void>{
    const sender = this.transaction.sender.value;
    const admin = (await this.admin.get()).value;
    sender.assertEquals(admin);

    this.assetPrice.set(newPrice);

  }


  @runtimeMethod() public async proveCustody(newSupply: UInt224): Promise<void> {
    //prove supply of custody asset and add into available supply on Mina, deposit Mina as collateral
    
    

    //check amount of transfered Mina Collateral

    //Mina.getBalance(sender);

    //determine value of mina collateral
    const minaAmount = UInt224.from(1);
    const totalMinaValue = await this.fetchMinaOraclePriceForAmount(minaAmount);

    //check Mina collateral value is greater than new custody 
    const newCustodyValue = await this.fetchSyntheticAssetPriceForAmount(newSupply);
    const collateralFactor = (await this.collateralFactor.get()).value;
    const requiredCollateral = newCustodyValue.mul(collateralFactor);
    totalMinaValue.assertGreaterThanOrEqual(requiredCollateral);

    //Call Verification of Proof of RWA here!

    //record accounting changes
    const sender = this.transaction.sender.value;
    const existingTotalSupply = (await this.totalSupply.get()).value;
    this.totalSupply.set(existingTotalSupply.add(newSupply));

    const currentUserCustodyBalance = await this.getCustodyBalance(sender);
    const newCustodyAmount = currentUserCustodyBalance.add(newSupply);
    this.setCustodyBalance(sender, newCustodyAmount);

    const currentUserCollateralBalance = await this.getCollateralBalance(sender);
    const newCollateralAmount = currentUserCollateralBalance.add(minaAmount);
    this.setCollateralBalance(sender, newCollateralAmount);



}

@runtimeMethod() public async removeCustody(removeSupply: UInt224): Promise<void> {
    //Remove unused existing available supply from Mina, refund mina deposit collateral

    //check there is sufficient unused custody asset to remove
    const existingTotalSupply = (await this.totalSupply.get()).value;
    const existingUsedSupply = (await this.usedSupply.get()).value;

    const freeSupply = existingTotalSupply.sub(existingUsedSupply);
    freeSupply.assertGreaterThanOrEqual(removeSupply);

    //return mina collateral

    const minaReturned = 1;

    //record accounting changes
    const sender = this.transaction.sender.value
    this.totalSupply.set(existingTotalSupply.sub(removeSupply));

    const currentUserCustodyBalance = await this.getCustodyBalance(sender);
    const newCustodyAmount = currentUserCustodyBalance.sub(removeSupply);
    this.setCustodyBalance(sender, newCustodyAmount);

    const currentUserCollateralBalance = await this.getCollateralBalance(sender);
    const newCollateralAmount = currentUserCollateralBalance.sub(minaReturned);
    this.setCollateralBalance(sender, newCollateralAmount);

    
  }

@runtimeMethod() public async mintTokens(mintTokenAmount: UInt224): Promise<void> {
    //User requests to use synthetic token, paying in Mina

    //check value of sent Mina

    //check value of requested tokens to mint is less than or equal to sent mina value

    //mint synthetic tokens to user

    //accounting updates
  }

@runtimeMethod() public async burnTokens(burnTokenAmount: UInt224): Promise<void> {
    //User requests to return synthetic token, selling in Mina

    //check value of tokens requesting to burn 

    //determine how many mina tokens this is

    //send mina tokens to user

    //burn synthetic tokens held by user

    //accounting update
  }

}
