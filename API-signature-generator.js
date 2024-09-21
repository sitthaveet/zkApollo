import Client from 'mina-signer';
const client = new Client({ network: process.env.NETWORK_KIND ?? 'testnet' });
const privateKey = 'EKEa6xS7xD2jDSbhpNZyEcWAgVj9LFQGdb4Q9iHqHhaqfRLrXPeg';
const currentReserve = UInt224.from(123);
const userId = 1;
 
 const signature = client.signFields(
    [BigInt(userId), BigInt(currentReserve)],
    privateKey
  );
  
 console.log(signature);
