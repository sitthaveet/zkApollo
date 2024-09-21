import { TestingAppChain } from "@proto-kit/sdk";
import {
  PrivateKey,
  PublicKey,
  AccountUpdate,
  Signature,
  method,
  Bool,
  Field,
} from "o1js";
import { CustodyModule } from "../../src/runtime/modules/custody";
import { log } from "@proto-kit/common";
import { BalancesKey, TokenId, UInt64, UInt224, Balance } from "@proto-kit/library";
import { custodian1, custodian2 } from "../../../../api/custodian";

log.setLevel("ERROR");
const custodyAccount = PublicKey.fromBase58(
    "B62qkE417nEiCGQphoA68xEGCx6AvvJ3rzoY6dVA6hiV54B98vvPRk2"
  );

describe("Verify the reserves in custody and mint synthetic asset", () => {
    let appChain: ReturnType<
    typeof TestingAppChain.fromRuntime<{ CustodyModule: typeof CustodyModule }>
  >;
//     const alicePrivateKey = PrivateKey.random();
//     const alice = alicePrivateKey.toPublicKey();
//     let custody: CustodyModule;
//     let result: Bool;

//     beforeAll(async () => {
//         appChain = TestingAppChain.fromRuntime({
//             CustodyModule,
//           });    
//         appChain.configurePartial({
//           Runtime: {
//             CustodyModule: {
//                 totalSupply: Balance.from(10000),
//               },
//               Balances: {
//                 totalSupply: Balance.from(10000),
//               },
//           },
//         });
    
//         await appChain.start();
//         custody = appChain.runtime.resolve("CustodyModule");
//         appChain.setSigner(alicePrivateKey);
//     });

//     async function localDeploy() {
//         const tx = await appChain.transaction(alice, async () => {
//             await custody.init();
//           });
         
//           await tx.sign();
//           await tx.send();
//           const block = await appChain.produceBlock()
//     }
  
//   it("check the initial reserve amount must be 0", async () => {
//    await localDeploy();
//     const realAmount = await appChain.query.runtime.CustodyModule.reserveAmount.get();
//     expect(realAmount).toEqual(UInt224.from(0));
//   });


// //   it('if the reserve is enough, the verifyReserveForMinting should return true', async () => {
// //     await localDeploy();

// //     const response = await fetch(
// //         "https://07-oracles.vercel.app/api/credit-score?user=1"
// //     );
// //     const data = await response.json() as { data: { creditScore: number } };;
// //     const realAmount = UInt224.from(data.data.creditScore);
// //     const targetAmount = UInt224.from(500);

// //     const tx = await appChain.transaction(alice, async () => {
// //         result = await custody.proveCustodyForMinting(realAmount, targetAmount);
// //     });         
// //     await tx.sign();
// //     await tx.send();

// //     expect(result.toBoolean()).toBe(true);
// //   });

// //   it('if the reserve is not enough, the verifyReserveForMinting should return false', async () => {
// //     await localDeploy();

// //     const response = await fetch(
// //         "https://07-oracles.vercel.app/api/credit-score?user=1"
// //     );
// //     const data = await response.json() as { data: { creditScore: number } };;
// //     const realAmount = UInt224.from(data.data.creditScore);

// //     const targetAmount = UInt224.from(1000);

// //     const tx = await appChain.transaction(alice, async () => {
// //         result = await custody.proveCustodyForMinting(realAmount, targetAmount);
// //     });         
// //     await tx.sign();
// //     await tx.send();

// //     expect(result.toBoolean()).toBe(false);
// //   });
});
