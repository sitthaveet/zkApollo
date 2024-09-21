<p align="center" width="100%">
    <img width="100%" src="cover.png"> 
</p>

# zkApollo
Verifiable Proof of Reserve for RWAs Tokenization

## Why
RWAs Tokenization promises the next wave of finanial revolution. But, we are still lacking a standard way to verify the reserves backing the RWA tokens. Since TradFi players are joining Mina ecosystem (eg. Mirae Asset Financial Group and Copper as an institutional custodian), we believe zkApollo can be the solution to verify the reserve for RWA tokenized securities, supporting the mission of *Proof of Everything*.


## How It Works

1. Alice holds a RWA (eg. TSLA stock) in their offchain account i.e. Copper.
2. Another user, Bob, wants exposure to the TSLA on Mina. Our service offers mTSLA, a synthetic version of TSLA onchain.
3. Alice can generate a proof that they hold the TSLA asset in their Copper account, this, coupled with locked MINA tokens to make sure that they won't sell their token backing offchain TSLA in the personal account. (We are working on a more elegant solution for this)
4. The mTSLA token is then minted on Mina and Bob can purchase and hold it onchain on Mina protocol.
5. Anyone can call the function `verifyReserve()` (runtime method) to see the proof of reserve anytime. If the reserve is not found then some of Alice's locked Mina tokens are slashed as punishment.


## Challenges

- Valuing offchain assets is difficult as since we can't current access the price onchain.
- Currently there are no relevant Oracle services on Mina, zkPass hasn't been deployed yet and ZKon isn't compatible with Protokit. 
- Designing a rigourous system that maintains the offchain backing of onchain assets is difficult. 


## Technology
Our AppChain was built on top of ProtoKit for Mina, we can fetch the trading account data via API provided by the offchain data. 
Frontend was written in NextJs. 

## Project Structure

- `project/packages/chain`: contains the zkapp
- `project/packages/apps`: contains the frontend app

## How to run on your computer

1. git clone the repo
2. `cd project/`
3. `nvm use` : make sure you use node v18
4. `pnpm install`
5. `pnpm env:inmemory dev` : starts both UI and sequencer locally

If you want to running test, run `pnpm run test --filter=chain -- --watchAll`


## Future Developments

- Implement more ways to reduce the amount of MINA that users have to lock (eg. integrate existing KYC services, multi-signature accounts, working with more custodians)
- Implement a new way to proof the reserve without required collaboration with the custodian, preferably make the proof of reserve mechanism decentralised and shock-resistant. 
