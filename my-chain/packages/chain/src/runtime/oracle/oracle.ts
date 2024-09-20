import { State, StateMap, assert } from "@proto-kit/protocol";
import {
  RuntimeModule,
  runtimeModule,
  runtimeMethod,
  state,
} from "@proto-kit/module";
import { UInt224, UInt64 } from "@proto-kit/library";
import { PublicKey, Field, Bool, Provable } from "o1js";

@runtimeModule()

// public key of Copper
let _copperPublicKey = PublicKey.fromBase58("B62qoAE4rBRuTgC42vqvEyUqCGhaZsW58SKVW4Ht8aYqP9UTvxFWBgy");


export class OracleModule extends RuntimeModule {

  // setup state variables
  @state() public realAmount = State.from(UInt224);
  @state() public copperPublicKey = State.from(PublicKey);

  // define event
  events = {
    verified: Field,
  };

  // init method
  @runtimeMethod() public async init(

  ): Promise<void> {
    this.realAmount.set(UInt224.from(0));
    this.copperPublicKey.set(_copperPublicKey);
  }

  // method oracle verify from Copper API
  @runtimeMethod() public async verifyAmount(realAmount: UInt224, targetAmount: UInt224) {
    // Get the oracle public key from the zkApp state
    const copperPublicKey = this.copperPublicKey.get();
    assert(this.copperPublicKey.get().equals(copperPublicKey), "Copper public key does not match");


    // Evaluate whether the signature is valid for the provided data
    const validSignature = signature.verify(copperPublicKey, []); // to be implemented
    validSignature.assertTrue();

    // Check that the provided credit score is 700 or higher
    realAmount.assertGreaterThanOrEqual(UInt224.from(targetAmount));

    // set realAmount to the state
    this.realAmount.set(realAmount);

    // Emit an event
    this.emitEvent('verified', realAmount);
  }
}
