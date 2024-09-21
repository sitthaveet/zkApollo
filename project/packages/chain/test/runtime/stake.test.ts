import { TestingAppChain } from "@proto-kit/sdk";
import {
  PrivateKey,
  PublicKey,
  AccountUpdate,
  Signature,
  method,
  Bool,
} from "o1js";
import { CustodyModule } from "../../src/runtime/modules/custody";
import { log } from "@proto-kit/common";
import { BalancesKey, TokenId, UInt64, UInt224, Balance } from "@proto-kit/library";

log.setLevel("ERROR");

const divisionBase = 100000;

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
                totalSupply: Balance.from(10000),
              },
              Balances: {
                totalSupply: Balance.from(10000),
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
    const realAmount = await appChain.query.runtime.CustodyModule.reserveAmount.get();
    expect(realAmount).toEqual(UInt224.from(0));
  });

  it("check stake", async () => {
    await localDeploy();
    console.log("alice", alice.toBase58());
    // get 1000 mina from addBalance
    const tx = await appChain.transaction(alice, async () => {
      await custody.addBalance(TokenId.from(0), alice, Balance.from(1000 * divisionBase));
    });
    
    await tx.sign();
    await tx.send();

    await appChain.produceBlock();

    // stake 1000 mina
    const tx2 = await appChain.transaction(alice, async () => {
      await custody.stakeMina(alice, TokenId.from(0), Balance.from(1000 * divisionBase));
    });

    await tx2.sign();
    await tx2.send();

    await appChain.produceBlock();

    // ensure getCollateralBalance > 0
    const collateralBalance = await appChain.query.runtime.CustodyModule.collateralBalances.get(alice);
    expect(collateralBalance).toBeDefined();
    expect(collateralBalance?.toBigInt()).toBeGreaterThan(BigInt(0));
    console.log("DEBUG ----- Collateral Balance [inTest]", alice.toBase58(), "is", collateralBalance?.toBigInt());
    
    await appChain.produceBlock();

    // mint tsla
    const tx3 = await appChain.transaction(alice, async () => {
      await custody.addReserve(alice, TokenId.from(1), Balance.from(1));
    });

    await tx3.sign();
    await tx3.send();
  })

  it("check stakeAndAddReserve", async () => {
    await localDeploy();
    // get 1000 mina from addBalance
    const tx = await appChain.transaction(alice, async () => {
        await custody.addBalance(TokenId.from(0), alice, Balance.from(200_000 * divisionBase));
      });

    await tx.sign();
    await tx.send();

    await appChain.produceBlock();

    const tx2 = await appChain.transaction(alice, async () => {
      await custody.stakeAndAddReserve(alice, TokenId.from(0), Balance.from(100_000 * divisionBase), TokenId.from(1), Balance.from(10 * divisionBase));
    });

    await tx2.sign();
    await tx2.send();

    await appChain.produceBlock();

    // Check custody balance
    const custodyBalance = await appChain.query.runtime.CustodyModule.custodyBalances.get(alice);
    expect(custodyBalance).toBeDefined();
    expect(custodyBalance?.toBigInt()).toBeGreaterThan(BigInt(0));
    // Check available supply
    const usedSupply = await appChain.query.runtime.CustodyModule.usedSupply.get();
    expect(usedSupply?.toBigInt()).toBe(BigInt(0));
    // Check total supply
    const totalSupply = await appChain.query.runtime.CustodyModule.totalSupply.get();
    expect(totalSupply?.toBigInt()).toBe(BigInt(1));

    await appChain.produceBlock();

    // Swap 100 mina for .1 tsla
    const tx3 = await appChain.transaction(alice, async () => {
      await custody.swap(alice, TokenId.from(0), Balance.from(100 * divisionBase), TokenId.from(1));
    });

    await tx3.sign();
    await tx3.send();

    await appChain.produceBlock();

    // Check custody balance
  })
});
