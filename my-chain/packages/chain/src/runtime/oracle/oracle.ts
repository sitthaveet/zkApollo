import "reflect-metadata";
import { State, StateMap, assert } from "@proto-kit/protocol";
import {
  RuntimeModule,
  runtimeModule,
  runtimeMethod,
  state,
} from "@proto-kit/module";
import { UInt224, UInt64, Balances, TokenId } from "@proto-kit/library";
import { PublicKey, Field, Bool, Provable, Signature } from "o1js";
import { inject } from "tsyringe";

// public key of Copper
let _copperPublicKey = PublicKey.fromBase58(
  "B62qoAE4rBRuTgC42vqvEyUqCGhaZsW58SKVW4Ht8aYqP9UTvxFWBgy"
);

@runtimeModule()
export class OracleModule extends RuntimeModule<Record<string, never>> {
  // setup state variables
  @state() public realAmount = State.from<UInt224>(UInt224);
  @state() public copperPublicKey = State.from<PublicKey>(PublicKey);
  @state() public lockAmount = State.from<UInt224>(UInt224);

  // constructor (can't set value in state here)
  public constructor(
    @inject("Balances") public balances: Balances
  ) {
    super();
  }

  // set value in state
  @runtimeMethod()
  public async init() {
    await this.realAmount.set(UInt224.from(0));
    await this.copperPublicKey.set(_copperPublicKey);
    await this.lockAmount.set(UInt224.from(0));
  }

  public async getRealAmount(): Promise<UInt224> {
    const realAmount = await this.realAmount.get();
    return realAmount.value;
  }

  public async getLockAmount(): Promise<UInt224> {
    const lockAmount = await this.lockAmount.get();
    return lockAmount.value;
  }

  // method oracle verify response from API for minting
  @runtimeMethod()
  public async verifyReserveForMinting(
    realAmount: UInt224,
    targetAmount: UInt224
  ): Promise<Bool> {

    // set realAmount to the state
    await this.realAmount.set(realAmount);

    // check if real amount is greater or equal to the target amount
    const isReserveAmountMoreThanTarget = targetAmount.lessThanOrEqual(realAmount)

    assert(
      isReserveAmountMoreThanTarget,
      "You have not enough reserves to mint the synthetic asset"
    );

    return isReserveAmountMoreThanTarget;

    // TODO: implement lock MINA on-chain

    // TODO: implement minting synthetic asset

  }

  // method oracle verify response from Copper API for checking from their client
  @runtimeMethod()
  public async verifyReserve(
    realAmount: UInt224,
    targetAmount: UInt224
  ) {
    // set realAmount to the state
    await this.realAmount.set(realAmount);

    // Check if real amount is greater or equal to the target amount
    const isReserveAmountMoreThanTarget = targetAmount.lessThanOrEqual(realAmount)

    // TODO: implement penalty for Alice

    // const penaltyAction = Provable.if(
    //   isReserveAmountMoreThanTarget,
    //   do nothing,
    //   penalty action
    // );
  }
}
