import { TestingAppChain } from "@proto-kit/sdk";
import {
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  Signature,
  method,
} from "o1js";
import { OracleModule } from "../../../src/runtime/oracle/oracle";
import { log } from "@proto-kit/common";
import { BalancesKey, TokenId, UInt64, UInt224, Balance } from "@proto-kit/library";

log.setLevel("ERROR");

let COPPER_PUBLIC_KEY =
  "B62qoAE4rBRuTgC42vqvEyUqCGhaZsW58SKVW4Ht8aYqP9UTvxFWBgy";

describe("Oracle", () => {
    beforeAll(async () => {
        // const appChain = TestingAppChain.fromRuntime({
        //     OracleModule,
        //   });
    
        // const alicePrivateKey = PrivateKey.random();
        // const alice = alicePrivateKey.toPublicKey();
    
        // appChain.configurePartial({
        //   Runtime: {
        //     OracleModule: {
        //     },
        //     Balances: {
        //         totalSupply: Balance.from(10_000),
        //       },
        //   },
        // });
    
        // await appChain.start();
        // const oracle = appChain.runtime.resolve("OracleModule");
        // appChain.setSigner(alicePrivateKey);
    });
    
  it("check the initial reserve amount must be 0", async () => {
    const appChain = TestingAppChain.fromRuntime({
        OracleModule,
      });

    const alicePrivateKey = PrivateKey.random();
    const alice = alicePrivateKey.toPublicKey();

    appChain.configurePartial({
      Runtime: {
        OracleModule: {
        },
        Balances: {
            totalSupply: Balance.from(10_000),
          },
      },
    });

    await appChain.start();
    appChain.setSigner(alicePrivateKey);
    const oracle = appChain.runtime.resolve("OracleModule");
    const tx = await appChain.transaction(alice, async () => {
        await oracle.init();
      });
     
      await tx.sign();
      await tx.send();
      const block = await appChain.produceBlock()
    const realAmount = await appChain.query.runtime.OracleModule.realAmount.get();
    expect(realAmount).toEqual(UInt224.from(0));
  });




  // it("send API data to check reserve", async () => {

  //     const response = await fetch(
  //       "https://07-oracles.vercel.app/api/credit-score?user=1"
  //     );
  //     const data = await response.json();

  //     const id = Field(data.data.id);
  //     const creditScore = Field(data.data.creditScore);
  //     const signature = Signature.fromBase58(data.signature);

  //     const txn = await Mina.transaction(senderAccount, async () => {
  //       await zkApp.verify(id, creditScore, signature);
  //     });
  //     await txn.prove();
  //     await txn.sign([senderKey]).send();

  //     const events = await zkApp.fetchEvents();
  //     const verifiedEventValue = events[0].event.data.toFields(null)[0];
  //     expect(verifiedEventValue).toEqual(id);
  //   });
});
