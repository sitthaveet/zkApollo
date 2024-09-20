import { Field, SmartContract, state, State, method, UInt64 } from 'o1js';

export class zkApollo extends SmartContract {
    @state(UInt64) totalSupply = State<UInt64>();
    @state(UInt64) usedSupply = State<UInt64>();

    init() {
        super.init();
        this.totalSupply.set(new UInt64(0)); //do we need to do this, surely zero is default value?
    }

    @method async proveCustody(newSupply: UInt64) {
        //prove supply of custody asset and mint into available supply on Mina
        const currentSupply = this.totalSupply.get();
        this.totalSupply.requireEquals(currentSupply);

        //do verification of custody here

        const newTotalSupply = currentSupply.add(newSupply);
        this.totalSupply.set(newTotalSupply);

        //add event emission
    }

    @method async removeCustody(tokensToBurn: UInt64) {
        //remove unused tokens from supply
        const currentSupply = this.totalSupply.get();
        this.totalSupply.requireEquals(currentSupply);

        const currentUsedSupply = this.usedSupply.get();
        this.usedSupply.requireEquals(currentUsedSupply);

        //check there is sufficient unused tokens to mint
        const freeSupply = currentSupply.sub(currentUsedSupply);
        tokensToBurn.assertLessThanOrEqual(freeSupply);

        //any burning logic here?

        //decrease total supply
        const newTotalSupply = currentSupply.sub(tokensToBurn);
        this.totalSupply.set(newTotalSupply);

        //add event emission
    }

    @method async mintTokens(tokensToMint: UInt64) {
        //request to mint against unused tokens
        const currentSupply = this.totalSupply.get();
        this.totalSupply.requireEquals(currentSupply);

        const currentUsedSupply = this.usedSupply.get();
        this.usedSupply.requireEquals(currentUsedSupply);

        //check there is sufficient unused tokens to mint
        const freeSupply = currentSupply.sub(currentUsedSupply);
        tokensToMint.assertLessThanOrEqual(freeSupply);

        //mint tokens 


        //send minted tokens to user


        //increase used supply
        const newUsedSupply = currentUsedSupply.add(tokensToMint);
        this.usedSupply.set(newUsedSupply);

        //add event emission
    }
}