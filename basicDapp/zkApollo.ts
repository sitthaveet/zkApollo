import { Field, SmartContract, state, State, method, UInt64, PublicKey, MerkleMapWitness, PrivateKey } from 'o1js';
import { FungibleToken, FungibleTokenAdmin } from "./index.ts"

export class zkApollo extends SmartContract {
    @state(UInt64) totalSupply = State<UInt64>();
    @state(UInt64) usedSupply = State<UInt64>();
    //@state(FungibleToken) mintableToken = State<FungibleToken>();

    @state(Field) suppliedCustodyRoot = State<Field>();
    

    ////@MINA how can add args to init or use setter function restricted to contract owner?
    init() {
    //init(tokenContract: PublicKey, initialRoot: Field) {
        super.init();
        this.totalSupply.set(new UInt64(0)); //@MINA do we need to do this, do default values need initializing?
        //const token = new FungibleToken(tokenContract);
        //this.mintableToken.set(token);
        //this.suppliedCustodyRoot.set(initialRoot);
    }

    @method async proveCustody(
        newSupply: UInt64, 
        userSupplyBefore: UInt64, 
        keyWitness: MerkleMapWitness, 
        signerPrivateKey: PrivateKey
    ) {
        //prove supply of custody asset and mint into available supply on Mina
        const currentSupply = this.totalSupply.get();
        this.totalSupply.requireEquals(currentSupply);

        //do verification of custody here

        const newTotalSupply = currentSupply.add(newSupply);
        this.totalSupply.set(newTotalSupply);

        //check merkle map root is the same
        const suppliedCustodyRoot = this.suppliedCustodyRoot.get();
        this.suppliedCustodyRoot.requireEquals(suppliedCustodyRoot);

        // check the initial state matches what we expect
        const [ rootBefore, key ] = keyWitness.computeRootAndKeyV2(userSupplyBefore.value);
        rootBefore.assertEquals(suppliedCustodyRoot);

        //add user mapping to supplied tokens
        //determine sender public key
        const keyToChange = signerPrivateKey.toPublicKey();

        //compute new userSupplyRoot after adding newSupply
        const [ rootAfter, _] = keyWitness.computeRootAndKeyV2((userSupplyBefore.value).add(newSupply.value)); //@Mina keyToChange not included?



        //add event emission
    }

    @method async removeCustody(
        tokensToBurn: UInt64, 
        userSupplyBefore: UInt64, 
        signerPrivateKey: PrivateKey, 
        keyWitness: MerkleMapWitness
    ) {
        //remove unused tokens from supply
        const currentSupply = this.totalSupply.get();
        this.totalSupply.requireEquals(currentSupply);

        const currentUsedSupply = this.usedSupply.get();
        this.usedSupply.requireEquals(currentUsedSupply);

        //fetch who sender is
        const msgSender = signerPrivateKey.toPublicKey();

        //check merkle map root is the same
        const suppliedCustodyRoot = this.suppliedCustodyRoot.get();
        this.suppliedCustodyRoot.requireEquals(suppliedCustodyRoot);

        // check the initial custody supply state matches what we expect
        const [ rootBefore, key ] = keyWitness.computeRootAndKeyV2(userSupplyBefore.value);
        rootBefore.assertEquals(suppliedCustodyRoot);
        //key.assertEquals(Field(msgSender)); //ignore check for the moment

        //check user has already supplied tokens >= tokensToBurn
        userSupplyBefore.assertGreaterThanOrEqual(tokensToBurn);

        //check there is sufficient unused tokens to burn
        const freeSupply = currentSupply.sub(currentUsedSupply);
        tokensToBurn.assertLessThanOrEqual(freeSupply);

        //decrease total supply
        const newTotalSupply = currentSupply.sub(tokensToBurn);
        this.totalSupply.set(newTotalSupply);

        //decrease user supply
        const newUserSupply = userSupplyBefore.sub(tokensToBurn);

        //compute new userSupplyRoot after adding newSupply
        const [ rootAfter, _] = keyWitness.computeRootAndKeyV2(userSupplyBefore.sub(newUserSupply).value); //@Mina keyToChange not included?

        //add event emission
    }

    @method async mintTokens(
        tokensToMint: UInt64, 
        signerPrivateKey: PrivateKey
    ) {
        //request to mint against unused tokens
        const currentSupply = this.totalSupply.get();
        this.totalSupply.requireEquals(currentSupply);

        const currentUsedSupply = this.usedSupply.get();
        this.usedSupply.requireEquals(currentUsedSupply);

        //check there is sufficient unused tokens to mint
        const freeSupply = currentSupply.sub(currentUsedSupply);
        tokensToMint.assertLessThanOrEqual(freeSupply);

        //validate token contract is the same
        //const tokenContract = this.mintableToken.get();
        //this.mintableToken.requireEquals(tokenContract);

        //mint tokens 
        //@MINA how can I grab msgsender? Or must I use some signature method to verify who is sending?
        // Compute signerPublicKey/User  from signerPrivateKey argument
        const msgSender = signerPrivateKey.toPublicKey();
        //await tokenContract.mint(msgSender, tokensToMint); //@MINA is this the correct way to call another function? Or must I verify the external call happened correctly?

        //send minted tokens to user


        //increase used supply
        const newUsedSupply = currentUsedSupply.add(tokensToMint);
        this.usedSupply.set(newUsedSupply);

        //add event emission
    }

    @method async burnTokens(
        tokensToBurn: UInt64, 
        signerPrivateKey: PrivateKey
    ){
        //validate token contract is the same
        //const tokenContract = this.mintableToken.get();
        //this.mintableToken.requireEquals(tokenContract);

        //check user has tokens they propose to burn
        // Compute signerPublicKey/User  from signerPrivateKey argument
        const msgSender = signerPrivateKey.toPublicKey();

        //burn tokens from user
        //await tokenContract.burn(msgSender, tokensToBurn);
    }
}