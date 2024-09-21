import { State, StateMap, assert } from "@proto-kit/protocol";
import {
  RuntimeModule,
  runtimeModule,
  runtimeMethod,
  state,
} from "@proto-kit/module";
import { UInt224, UInt64 } from "@proto-kit/library";
import { PublicKey, Field, Bool, Provable, Signature } from "o1js";

// public key of Copper
let _copperPublicKey = PublicKey.fromBase58(
  "B62qoAE4rBRuTgC42vqvEyUqCGhaZsW58SKVW4Ht8aYqP9UTvxFWBgy"
);

@runtimeModule()
export class OracleModule extends RuntimeModule<Record<string, never>> {
  // setup state variables
  @state() public realAmount = State.from(UInt224);
  @state() public copperPublicKey = State.from(PublicKey);
  @state() public lockAmount = State.from(UInt224);

  // init method
  public constructor() {
    super();
    this.realAmount.set(UInt224.from(0));
    this.copperPublicKey.set(_copperPublicKey);
    this.lockAmount.set(UInt224.from(0));
  }

  @runtimeMethod() public async init(): Promise<void> {
    this.realAmount.set(UInt224.from(0));
    this.copperPublicKey.set(_copperPublicKey);
    this.lockAmount.set(UInt224.from(0));
  }

  public async getRealAmount(): Promise<UInt224> {
    const realAmount = await this.realAmount.get();
    return UInt224.from(realAmount.value.toString());
  }

  public async getLockAmount(): Promise<UInt224> {
    const lockAmount = await this.lockAmount.get();
    return UInt224.from(lockAmount.value.toString());
  }

  public async verifyIfRealAmountIsMoreThanTarget(
    targetAmount: UInt224
  ): Promise<Bool> {
    const realAmount = await this.realAmount.get();
    const isRealAmountMoreThanTarget = targetAmount.lessThanOrEqual(
      UInt224.from(realAmount.value.toString())
    );
    return isRealAmountMoreThanTarget;
  }

  private async penaltyOwner(): Promise<UInt224> {
    // TODO: implement penalty for Alice
    return UInt224.from(0);
  }

  // method oracle verify response from Copper API for checking from their client
  @runtimeMethod()
  public async verifyReserve(
    realAmount: UInt224,
    signature: Signature,
    targetAmount: UInt224
  ) {
    // // Get the oracle public key from the zkApp state
    // const copperPublicKey = this.copperPublicKey.get();

    // // Evaluate whether the signature is valid for the provided data
    // const validSignature = signature.verify(copperPublicKey, [realAmount.toString()]);
    // assert(validSignature, "Invalid signature");

    // set realAmount to the state
    this.realAmount.set(realAmount);

    // Check if real amount is greater or equal to the target amount
    const isRealAmountMoreThanTarget =
      await this.verifyIfRealAmountIsMoreThanTarget(targetAmount);

    // penalty action if the reserve is below target
    // const penaltyAction = Provable.if(
    //   // check if real amount is more than target amount
    //   isRealAmountMoreThanTarget,
    //   // if reserve > target
    //   await this.getLockAmount(),
    //   // if reserve < target, penalty Alice and return false
    //   await this.penaltyOwner()
    // );

    // set lock amount to the state
    // this.lockAmount.set(UInt224.from(penaltyAction));
  }

  // method oracle verify response from Copper API for minting
  @runtimeMethod()
  public async verifyReserveForMinting(
    realAmount: UInt224,
    targetAmount: UInt224
  ) {
    // set realAmount to the state
    this.realAmount.set(realAmount);

    // Check if real amount is greater or equal to the target amount
    const isRealAmountMoreThanTarget =
      await this.verifyIfRealAmountIsMoreThanTarget(targetAmount);
    assert(
      isRealAmountMoreThanTarget,
      "You have not enough reserves to mint the synthetic asset"
    );

    // implement lock MINA on-chain

    // implement minting synthetic asset
  }
}
