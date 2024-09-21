import React from 'react'
import Image from 'next/image'
import { Separator } from './ui/separator'
import { Chain } from './chain'

export default function Footer({blockHeight}: {blockHeight: string}) {
  return (
    <footer className='bg-[#ffffffc6] p-4 flex justify-between'>
        <div className='flex items-center'>
            <Image src="/logo.svg" alt="Apollo" width={32} height={32} />
            <Separator className="mx-4 h-8" orientation={"vertical"} />
            <div className="flex grow">
            <Chain height={blockHeight} />
            </div>
        </div>
        <div className='flex items-center gap-2 '>
            <div>
                Built on 
            </div>
            <Image src="/mina.svg" alt="Mina" width={32} height={32} />
            <div>
              at ETH Global Singapore 2024
            </div>
        </div>
    </footer>
  )
}
