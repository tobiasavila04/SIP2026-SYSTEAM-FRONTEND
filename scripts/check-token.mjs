import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'

const client = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org'),
})

const token = '0x33B18AEC70b0855B2b74e133e33e5d4Ba2Cd6ED3'

try {
  const [name, symbol, decimals, totalSupply, balance] = await Promise.all([
    client.readContract({ address: token, abi: [{ type: 'function', name: 'name', inputs: [], outputs: [{ type: 'string' }] }], functionName: 'name' }),
    client.readContract({ address: token, abi: [{ type: 'function', name: 'symbol', inputs: [], outputs: [{ type: 'string' }] }], functionName: 'symbol' }),
    client.readContract({ address: token, abi: [{ type: 'function', name: 'decimals', inputs: [], outputs: [{ type: 'uint8' }] }], functionName: 'decimals' }),
    client.readContract({ address: token, abi: [{ type: 'function', name: 'totalSupply', inputs: [], outputs: [{ type: 'uint256' }] }], functionName: 'totalSupply' }),
  ])
  console.log('Name:', name)
  console.log('Symbol:', symbol)
  console.log('Decimals:', decimals)
  console.log('Total Supply:', totalSupply?.toString())
} catch (e) {
  console.error('Error:', e.message)
}
