"use client";
import "reflect-metadata";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2">About Our Project</h1>
      <h2 className="text-2xl font-semibold mb-6">
        Bringing Real World Assets to Web3 with Mina Protocol & ZK Proofs
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-3">Our Mission</h3>
          <p>
            We're a team of 3 passionate developers participating in ETHGlobal Singapore. 
            Our project aims to provide better way to do verifiable proof of reserve in privacy-preserving way.
          </p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-3">The Team</h3>
          <ul className="list-disc list-inside">
            <li>Developer 1: [Prasad]</li>
            <li>Developer 2: [Callum]</li>
            <li>Developer 3: [Son]</li>
          </ul>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-semibold mb-3">Motivation</h3>
        <p>
        RWAs Tokenization promises the next wave of finanial revolution. But, we are still lacking a standard way to verify the reserves backing the RWA tokens. Since TradFi players are joining Mina ecosystem (eg. Mirae Asset Financial Group and Copper as an institutional custodian), we believe zkApollo can be the solution to verify the reserve for RWA tokenized securities, supporting the mission of Proof of Everything.
        </p>
      </div>
    </div>
  );
}
