
import { State, StateMap, assert } from "@proto-kit/protocol";
import {
  RuntimeModule,
  runtimeModule,
  runtimeMethod,
  state,
} from "@proto-kit/module";
import { UInt224, UInt64 } from "@proto-kit/library";
import { PublicKey, Field, Bool, Provable, Struct, Hashed } from "o1js";

export interface TokenConfig {}

@runtimeModule()
export class SyntheticAsset extends RuntimeModule<TokenConfig> {
  @state() public tokenBalances = StateMap.from<PublicKey, UInt224>(PublicKey, UInt224);

  //simulate (USER, USER) > (AMOUNT) mapping using hash as field
  @state() public approvalBalances = StateMap.from<Field, UInt224>(PublicKey, UInt224); 
  @state() public totalTokenSupply = State.from<UInt224>(UInt224);
  @state() public owner = State.from<PublicKey>(PublicKey)

  @state() public decimals = State.from(UInt224);

  
  /*
  class TwoAddresses extends Struct({ user1: PublicKey, user2: PublicKey }) {
  }
  
  let HashedTwoAddress = Hashed.create(TwoAddresses);
  */

  /// SETTER METHODS ==============================================

  @runtimeMethod() public async init(
    decimals: UInt224 
  ): Promise<void> {
    await this.decimals.set(decimals);
  }

  /// GETTER METHODS ==============================================

  @runtimeMethod() public async getTokenBalance(
    address: PublicKey
  ): Promise<UInt224> {
    return (await this.tokenBalances.get(address)).orElse(UInt224.from(0));
  }

  @runtimeMethod() public async getTotalTokenSupply(): Promise<UInt224> {
    return (await this.totalTokenSupply.get()).orElse(UInt224.from(0));
  }

  @runtimeMethod() public async getTokenApprovalBalance(
    tokenOwner: PublicKey,
    approved: PublicKey,
  ): Promise<UInt224> {
    const key = Hashed
    return (await this.approvalBalances.get(address)).orElse(UInt224.from(0));
  }


  //Mint tokens to a user, only custody contract can call this function
  @runtimeMethod() public async mint(
    user: PublicKey,
    amount: UInt224,
  ): Promise<void> {
    const sender = this.transaction.sender.value;

    sender.assertEquals(user);

    const currentBalance = await this.getTokenBalance(user);

    //increase user's balance
    await this.tokenBalances.set(
      user,
      currentBalance.add(amount)
    );
   

    //Increase total token supply
    const currentSupply = await this.getTotalTokenSupply();
    await this.totalTokenSupply.set(currentSupply.add(amount));
  }

  //Burn tokens from a user, only custody contract can call this function
  @runtimeMethod() public async burn(
    user: PublicKey, 
    amount: UInt224
  ): Promise<void> {
    const sender = this.transaction.sender.value;

    sender.assertEquals(user);

    const currentBalance = await this.getTokenBalance(user);

    currentBalance.assertGreaterThanOrEqual(amount);

    //decrease user's balance
    await this.tokenBalances.set(user, currentBalance.sub(amount));

    //decrease total token supply
    const currentSupply = await this.getTotalTokenSupply();
    await this.totalTokenSupply.set(currentSupply.sub(amount));
  }

  //transfer tokens from one user to another, user can only transfer their own tokens, anyone can call.
  @runtimeMethod()
  public async transfer(to: PublicKey, amount: UInt224): Promise<void> {
    const sender = this.transaction.sender.value;

    // Get sender's current balance
    const senderBalance = await this.getTokenBalance(sender);

    // Ensure sender has sufficient balance
    senderBalance.assertGreaterThanOrEqual(amount);

    // Get recipient's current balance
    const recipientBalance = await this.getTokenBalance(to);

    // Update sender's balance
    await this.tokenBalances.set(sender, senderBalance.sub(amount));

    // Update recipient's balance
    await this.tokenBalances.set(to, recipientBalance.add(amount));
  }

  //transfer on behalf of the user LOCK THIS DOWN so only the contract can send on users behalf or add an approval system
  @runtimeMethod()
  public async transferFrom(from: PublicKey, to: PublicKey, amount: UInt224): Promise<void> {
    const sender = from;

    // Get sender's current balance
    const senderBalance = await this.getTokenBalance(sender);

    // Ensure sender has sufficient balance
    senderBalance.assertGreaterThanOrEqual(amount);

    // Get recipient's current balance
    const recipientBalance = await this.getTokenBalance(to);

    // Update sender's balance
    await this.tokenBalances.set(sender, senderBalance.sub(amount));

    // Update recipient's balance
    await this.tokenBalances.set(to, recipientBalance.add(amount));
  }

}
