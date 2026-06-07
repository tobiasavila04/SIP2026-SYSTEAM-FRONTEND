const { createWalletClient, createPublicClient, http, parseUnits, formatUnits } = require('viem')
const { baseSepolia } = require('viem/chains')
const { privateKeyToAccount } = require('viem/accounts')

const IDEA = '0x04323eC5d192012c29A5D6A1F120489C03033eD7'
const PK = '0xb7ddf518a66ac1b209065717fd07f08aeb78ed3f8235e88bc17935172d72be3e'
const DESTINO = '0x9313EbAcB48D875CcE162EA3989d4118f8e8cbd2'
const MONTO = parseUnits('10000', 18)

const ERC20 = [{ type:'function', name:'transfer', stateMutability:'nonpayable', inputs:[{name:'to',type:'address'},{name:'amount',type:'uint256'}], outputs:[{type:'bool'}] }]
const t = http('https://sepolia.base.org')
const a = privateKeyToAccount(PK)
const w = createWalletClient({ account:a, chain:baseSepolia, transport:t })
const p = createPublicClient({ chain:baseSepolia, transport:t })

;(async () => {
  const bal = await p.readContract({ address:IDEA, abi:[{type:'function',name:'balanceOf',stateMutability:'view',inputs:[{name:'a',type:'address'}],outputs:[{type:'uint256'}]}], functionName:'balanceOf', args:[a.address] })
  console.log('Balance deployer:', formatUnits(bal, 18), '$IDEA')
  const h = await w.writeContract({ address:IDEA, abi:ERC20, functionName:'transfer', args:[DESTINO, MONTO] })
  console.log('Transfer tx:', h)
  const r = await p.waitForTransactionReceipt({ hash:h })
  console.log('Confirmado! Gas usado:', r.gasUsed)
})().catch(e => console.error(e))
