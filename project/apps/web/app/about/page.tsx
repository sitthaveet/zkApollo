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
            Our project aims to bridge the gap between real-world assets and the Web3 ecosystem 
            using the power of Mina Protocol and zero-knowledge proofs.
          </p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-3">The Team</h3>
          <ul className="list-disc list-inside">
            <li>Developer 1: [Name] - [Role/Expertise]</li>
            <li>Developer 2: [Name] - [Role/Expertise]</li>
            <li>Developer 3: [Name] - [Role/Expertise]</li>
          </ul>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-semibold mb-3">Our Solution</h3>
        <p>
          [Brief description of your project, how it uses Mina Protocol and ZK proofs 
          to bring real-world assets to Web3, and its potential impact]
        </p>
      </div>
    </div>
  );
}
