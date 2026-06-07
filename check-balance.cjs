const { createPublicClient, http, formatUnits } = require('viem')
const { baseSepolia } = require('viem/chains')
const p = createPublicClient({ chain:baseSepolia, transport:http('https://sepolia.base.org') })
;(async () => {
  const bal = await p.readContract({
    address: '0x04323eC5d192012c29A5D6A1F120489C03033eD7',
    abi: [{type:'function',name:'balanceOf',stateMutability:'view',inputs:[{name:'a',type:'address'}],outputs:[{type:'uint256'}]}],
    functionName: 'balanceOf',
    args: ['0x9313EbAcB48D875CcE162EA3989d4118f8e8cbd2']
  })
  console.log('Balance on-chain:', formatUnits(bal, 18), '$IDEA')
})().catch(e => console.error(e.message))
