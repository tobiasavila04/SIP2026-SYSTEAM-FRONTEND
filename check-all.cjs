const { createPublicClient, http, formatUnits } = require('viem')
const { baseSepolia } = require('viem/chains')
const p = createPublicClient({ chain:baseSepolia, transport:http('https://sepolia.base.org') })
;(async () => {
  const [balDeployer, balDest, totalSupply] = await Promise.all([
    p.readContract({ address:'0x04323eC5d192012c29A5D6A1F120489C03033eD7', abi:[{type:'function',name:'balanceOf',stateMutability:'view',inputs:[{name:'a',type:'address'}],outputs:[{type:'uint256'}]}], functionName:'balanceOf', args:['0x7eEA865D2f47B5cC0fF4c8967C1cCf667fEBE50A'] }),
    p.readContract({ address:'0x04323eC5d192012c29A5D6A1F120489C03033eD7', abi:[{type:'function',name:'balanceOf',stateMutability:'view',inputs:[{name:'a',type:'address'}],outputs:[{type:'uint256'}]}], functionName:'balanceOf', args:['0x9313EbAcB48D875CcE162EA3989d4118f8e8cbd2'] }),
    p.readContract({ address:'0x04323eC5d192012c29A5D6A1F120489C03033eD7', abi:[{type:'function',name:'totalSupply',stateMutability:'view',inputs:[],outputs:[{type:'uint256'}]}], functionName:'totalSupply', args:[] })
  ]);
  console.log('Deployer:', formatUnits(balDeployer, 18));
  console.log('Destino:', formatUnits(balDest, 18));
  console.log('Total Supply:', formatUnits(totalSupply, 18));
  console.log('Sum deployer+destino:', formatUnits(balDeployer + balDest, 18));
})().catch(e => console.error(e.message))
