"use client";
import "reflect-metadata";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

export default function Home() {
  const [email, setEmail] = useState("");

  return (
    <div className="text-gray-800 font-sans">
      <main className="container mx-auto px-4 py-12">
        <section className="text-center min-h-[calc(100vh-10rem)] flex flex-col justify-center">
          <h1 className="text-4xl md:text-7xl max-w-[90%] mx-auto font-bold font-mono mb-6">Tokenize Real-World Assets with ZK Proofs</h1>
          <p className="text-xl mb-8">Unlock the potential of your assets through blockchain technology</p>
          <a className="flex justify-center" href="/swap">
            <button className="flex items-center gap-4 text-white pl-6 pr-3 py-3 rounded-full text-lg font-semibold transition-all bg-blue-600 hover:bg-blue-700">
             <p>
              Get Started 
             </p>
             <div className="flex items-center justify-center text-black w-10 h-10 bg-white rounded-full">
                <ArrowRightIcon className="w-6 h-6" />
              </div>
          </button>
          </a>
        </section>

        <section className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Add feature cards here */}
        </section>

        <section className="rounded-lg p-8 text-center bg-orange-400">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="mb-6">Subscribe to our newsletter for the latest updates and opportunities</p>
          <div className="flex max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-grow px-4 py-2 rounded-l-full border-2 border-blue-600 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="bg-blue-600 text-white px-6 py-2 rounded-r-full font-semibold hover:bg-blue-700 transition-colors">
              Subscribe
            </button>
          </div>
        </section>
      </main>

      
    </div>
  );
}
