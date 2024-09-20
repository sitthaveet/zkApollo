import { zkApollo } from './zkApollo';

import {
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  Signature,
  UInt64,
} from 'o1js';

let proofsEnabled = false;

describe('Begin.js', () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    aliceAccount: Mina.TestPublicKey,
    aliceKey: PrivateKey,
    bobAccount: Mina.TestPublicKey,
    bobKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: zkApollo;

    beforeEach(async () => {
      const Local = await Mina.LocalBlockchain({ proofsEnabled });
      Mina.setActiveInstance(Local);
      deployerAccount = Local.testAccounts[0];
      deployerKey = deployerAccount.key;
      aliceAccount = Local.testAccounts[1];
      aliceKey = aliceAccount.key;
      bobAccount = Local.testAccounts[2];
      bobKey = bobAccount.key;
      zkAppPrivateKey = PrivateKey.random();
      zkAppAddress = zkAppPrivateKey.toPublicKey();
      zkApp = new zkApollo(zkAppAddress);
    });

    async function localDeploy() {
      const txn = await Mina.transaction(deployerAccount, async () => {
        AccountUpdate.fundNewAccount(deployerAccount);
        await zkApp.deploy();
      });
      await txn.prove();
      // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
      await txn.sign([deployerKey, zkAppPrivateKey]).send();
    }

    it('generates and deploys the `zkApollo` smart contract', async () => {
      await localDeploy();

      //we have no state set on initialization to check currently, left in as example
      //const oraclePublicKey = zkApp.oraclePublicKey.get();
      //expect(oraclePublicKey).toEqual(PublicKey.fromBase58(ORACLE_PUBLIC_KEY));
    });

    it('should allow a user to supply tokens via custody', async () => {
      const newSupply = new UInt64(100);
      const txn = await Mina.transaction(aliceAccount, async () => {
        await zkApp.proveCustody(newSupply);
      });
      await txn.prove();
      await txn.sign([aliceKey]).send();

      const events = await zkApp.fetchEvents();

      //TODO add events and check they emit correctly
      
      //const verifiedEventValue = events[0].event.data.toFields(null)[0];
      //expect(verifiedEventValue).toEqual(id);
    });

    it('should allow a user to remove tokens already supplied if not used', async () => {

    });


    it('should allow a user to mint synthetic tokens if token is supplied', async () => {

    });


    it('should not allow a user to remove used tokens', async () => {

    });

    it('should not allow a user to remove more tokens than exist', async () => {
      await localDeploy();
      const tokensToBurn = new UInt64(1);
      expect(async () => {
        const txn = await Mina.transaction(aliceAccount, async () => {
          await zkApp.removeCustody(tokensToBurn);
        });
      }).rejects;
    });

    it('should not allow a user to mint more synthetic tokens than exist', async () => {
      await localDeploy();
      const tokensToMint = new UInt64(1);
      expect(async () => {
        const txn = await Mina.transaction(aliceAccount, async () => {
          await zkApp.mintTokens(tokensToMint);
        });
      }).rejects;
    });



});
