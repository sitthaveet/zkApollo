import { TestingAppChain } from "@proto-kit/sdk";
import {
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  Signature,
  method,
  Bool,
} from "o1js";
import { OracleModule } from "../../../src/runtime/oracle/oracle";
import { log } from "@proto-kit/common";
import { BalancesKey, TokenId, UInt64, UInt224, Balance } from "@proto-kit/library";

log.setLevel("ERROR");

let COPPER_PUBLIC_KEY =
  "B62qoAE4rBRuTgC42vqvEyUqCGhaZsW58SKVW4Ht8aYqP9UTvxFWBgy";
  

describe("Oracle", () => {
    let appChain: ReturnType<
    typeof TestingAppChain.fromRuntime<{ OracleModule: typeof OracleModule }>
  >;
    const alicePrivateKey = PrivateKey.random();
    const alice = alicePrivateKey.toPublicKey();
    let oracle: OracleModule;
    let result: Bool;

    beforeAll(async () => {
        appChain = TestingAppChain.fromRuntime({
            OracleModule,
          });    
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
        oracle = appChain.runtime.resolve("OracleModule");
        appChain.setSigner(alicePrivateKey);
    });

    async function localDeploy() {
        const tx = await appChain.transaction(alice, async () => {
            await oracle.init();
          });
         
          await tx.sign();
          await tx.send();
          const block = await appChain.produceBlock()
    }
    
  it("check the initial reserve amount must be 0", async () => {
   await localDeploy();
    const realAmount = await appChain.query.runtime.OracleModule.realAmount.get();
    expect(realAmount).toEqual(UInt224.from(0));
  });


  it('if the reserve is enough, the verifyReserveForMinting should return true', async () => {
    await localDeploy();

    const response = await fetch(
        "https://07-oracles.vercel.app/api/credit-score?user=1"
    );
    const data = await response.json() as { data: { creditScore: number } };;
    const realAmount = UInt224.from(data.data.creditScore);
    const targetAmount = UInt224.from(500);

    const tx = await appChain.transaction(alice, async () => {
        result = await oracle.verifyReserveForMinting(realAmount, targetAmount);
    });         
    await tx.sign();
    await tx.send();

    expect(result.toBoolean()).toBe(true);
  });

  it('if the reserve is not enough, the verifyReserveForMinting should return false', async () => {
    await localDeploy();

    const response = await fetch(
        "https://07-oracles.vercel.app/api/credit-score?user=1"
    );
    const data = await response.json() as { data: { creditScore: number } };;
    const realAmount = UInt224.from(data.data.creditScore);

    const targetAmount = UInt224.from(1000);

    const tx = await appChain.transaction(alice, async () => {
        result = await oracle.verifyReserveForMinting(realAmount, targetAmount);
    });         
    await tx.sign();
    await tx.send();

    expect(result.toBoolean()).toBe(false);
  });


//   it("send API data to check reserve", async () => {

//       const response = await fetch(
//         "https://07-oracles.vercel.app/api/credit-score?user=1"
//       );
//       const data = await response.json();

//       const creditScore = Field(data.data.creditScore);
//       const signature = Signature.fromBase58(data.signature);

//       const txn = await Mina.transaction(senderAccount, async () => {
//         await zkApp.verify(id, creditScore, signature);
//       });
//       await txn.prove();
//       await txn.sign([senderKey]).send();

//       const events = await zkApp.fetchEvents();
//       const verifiedEventValue = events[0].event.data.toFields(null)[0];
//       expect(verifiedEventValue).toEqual(id);
//     });
});
