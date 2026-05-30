import { createWalletClient, createPublicClient, http, parseUnits, formatUnits } from 'viem'
import { baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

const PRIVATE_KEY = "0xb7ddf518a66ac1b209065717fd07f08aeb78ed3f8235e88bc17935172d72be3e"
const IDEA_TOKEN = "0x04323eC5d192012c29A5D6A1F120489C03033eD7"
const OFFERING = "0xdFEf6eF8d9208143D4bFfdfae970fC6DD1Ba0297"

const ERC20_ABI = [
  { type: 'function', name: 'allowance', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
]

const OFFERING_ABI = [
  { type: 'function', name: 'invest', stateMutability: 'nonpayable', inputs: [{ name: 'proyectoId', type: 'uint256' }, { name: 'amount', type: 'uint256' }], outputs: [] },
]

const transport = http("https://sepolia.base.org")
const account = privateKeyToAccount(PRIVATE_KEY)
const walletClient = createWalletClient({ account, chain: baseSepolia, transport })
const publicClient = createPublicClient({ chain: baseSepolia, transport })

async function main() {
  console.log("Wallet:", account.address)

  const balance = await publicClient.readContract({ address: IDEA_TOKEN, abi: ERC20_ABI, functionName: 'balanceOf', args: [account.address] })
  const decimals = await publicClient.readContract({ address: IDEA_TOKEN, abi: ERC20_ABI, functionName: 'decimals', args: [] })
  console.log("Balance:", formatUnits(balance, decimals), "$IDEA")

  const allowance = await publicClient.readContract({ address: IDEA_TOKEN, abi: ERC20_ABI, functionName: 'allowance', args: [account.address, OFFERING] })
  console.log("Allowance:", formatUnits(allowance, decimals), "$IDEA")

  const investAmount = parseUnits("250", decimals)
  const proyectoId = 22n

  if (allowance < investAmount) {
    console.log("Approving...")
    const hash = await walletClient.writeContract({ address: IDEA_TOKEN, abi: ERC20_ABI, functionName: 'approve', args: [OFFERING, investAmount] })
    console.log("Approve tx:", hash)
    await publicClient.waitForTransactionReceipt({ hash })
    console.log("Approved!")
  }

  console.log("Investing 250 $IDEA...")
  const hash = await walletClient.writeContract({ address: OFFERING, abi: OFFERING_ABI, functionName: 'invest', args: [proyectoId, investAmount] })
  console.log("Invest tx:", hash)
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  console.log("Invested! Gas used:", receipt.gasUsed)
}

main().catch(console.error)
