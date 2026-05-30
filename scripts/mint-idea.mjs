import { createWalletClient, http, parseEther } from 'viem'
import { baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

const IDEA_TOKEN = '0x9f2c766d0bd9bbb640422decdf0125be02c7d144'
const PRIVATE_KEY = '0xb7ddf518a66ac1b209065717fd07f08aeb78ed3f8235e88bc17935172d72be3e'

const to = process.argv[2]
if (!to) {
  console.error('Uso: node scripts/mint-idea.mjs <direccion_wallet>')
  process.exit(1)
}

const account = privateKeyToAccount(PRIVATE_KEY)
const client = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http('https://sepolia.base.org'),
})

const hash = await client.writeContract({
  address: IDEA_TOKEN,
  abi: [
    {
      type: 'function',
      name: 'mint',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      outputs: [],
    },
  ],
  functionName: 'mint',
  args: [to, parseEther('100')], // 100 $IDEA
})

console.log('Mint exitoso! Hash:', hash)
console.log(`Ver: https://sepolia.basescan.org/tx/${hash}`)
