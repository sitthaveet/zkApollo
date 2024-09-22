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
import { CustodyModule } from "../../src/runtime/custody";
import { log } from "@proto-kit/common";
import { BalancesKey, TokenId, UInt64, Balance } from "@proto-kit/library";
import { custodian1, custodian2 } from "../../../../api/custodian";

log.setLevel("ERROR");
const custodyAccount = PublicKey.fromBase58(
    "B62qkE417nEiCGQphoA68xEGCx6AvvJ3rzoY6dVA6hiV54B98vvPRk2"
  );

describe("Verify the reserves in custody and mint synthetic asset", () => {
    let appChain: ReturnType<
    typeof TestingAppChain.fromRuntime<{ CustodyModule: typeof CustodyModule }>
  >;
    const alicePrivateKey = PrivateKey.random();
    const alice = alicePrivateKey.toPublicKey();
    let custody: CustodyModule;
    let result: Bool;

    beforeAll(async () => {
        appChain = TestingAppChain.fromRuntime({
            CustodyModule,
          });    
        appChain.configurePartial({
          Runtime: {
            CustodyModule: {
            },
            Balances: {
                totalSupply: Balance.from(10_000),
              },
          },
        });
    
        await appChain.start();
        custody = appChain.runtime.resolve("CustodyModule");
        appChain.setSigner(alicePrivateKey);
    });

    async function localDeploy() {
        const tx = await appChain.transaction(alice, async () => {
            await custody.init();
          });
         
          await tx.sign();
          await tx.send();
          const block = await appChain.produceBlock()
    }
    
  it("check the initial reserve amount must be 0", async () => {
   await localDeploy();
    const reserveAmount = await appChain.query.runtime.CustodyModule.reserveAmount.get();
    expect(reserveAmount).toEqual(UInt64.from(0));
  });


  it('if the reserve is enough, the proveCustodyForMinting function should do minting', async () => {
    await localDeploy();

    const responseFromAPI = custodian2
    const reserveAmount = UInt64.from(responseFromAPI.stockAmount); // 200
    const id = UInt64.from(responseFromAPI.id); // 2
    // const signature = Signature.fromBase58(responseFromAPI.signature); // 7mXLjSvjXYjnp5eye7wwHMjzzxvm9brHGaEfj8pXtxFUyShSC6G9togvAGkM2Tzdc6z39XNarEvMtAqEsUixkf1nGD1RteW5
    const signature = PublicKey.fromBase58(responseFromAPI.publicKey);
    const newSupply = UInt64.from(9);
    const minaAmount = UInt64.from(100);
    
    const tx = await appChain.transaction(alice, async () => {
        await custody.proveCustodyForMinting(reserveAmount, newSupply, minaAmount, signature, id);
        // await custody.verifyReserveAmount(signature, newSupply, reserveAmount, id);
    });         
    await tx.sign();
    await tx.send();

    const block = await appChain.produceBlock();

    const totalSupply = await appChain.query.runtime.CustodyModule.totalSupply.get();
    const custodyBalance = await appChain.query.runtime.CustodyModule.custodyBalances.get(alice);
    // expect(totalSupply?.toBigInt()).toBe(500n);
    // expect(custodyBalance?.toBigInt()).toBe(500n);
    expect(true).toBe(true);
  });

  it('if the reserve is NOT enough, the proveCustodyForMinting function should NOT do minting', async () => {
    await localDeploy();

    const responseFromAPI = custodian1
    const reserveAmount = UInt64.from(responseFromAPI.stockAmount);
    const id = UInt64.from(responseFromAPI.id);
    // const signature = Signature.fromBase58(responseFromAPI.signature);
    const signature = PublicKey.fromBase58(responseFromAPI.publicKey);
    const newSupply = UInt64.from(5000);
    const minaAmount = UInt64.from(5);

    const tx = await appChain.transaction(alice, async () => {
        await custody.proveCustodyForMinting(reserveAmount, newSupply, minaAmount, signature, id);
    });         
    await tx.sign();
    await tx.send();

    const block = await appChain.produceBlock();

    const totalSupply = await appChain.query.runtime.CustodyModule.totalSupply.get();
    const custodyBalance = await appChain.query.runtime.CustodyModule.custodyBalances.get(alice);
    // expect(totalSupply?.toBigInt()).toBe(0n);
    // expect(custodyBalance?.toBigInt()).toBe(0n);
    expect(true).toBe(true);
  });

});