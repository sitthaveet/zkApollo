import Client from 'mina-signer';

const client = new Client({ network: process.env.NETWORK_KIND ?? 'testnet' });
const privateKey = 'EKEDVVxSAB9ZfEVq846q7wFT444NqwnRj7MzSJ3hqh4xB5S7Le8h';
const publicKey = 'B62qkE417nEiCGQphoA68xEGCx6AvvJ3rzoY6dVA6hiV54B98vvPRk2';
const currentReserve = UInt224.from(100);
const userId = 1;
 
 const signature = client.signFields(
    [BigInt(userId), BigInt(currentReserve)],
    privateKey
  );
  
 console.log(signature);
