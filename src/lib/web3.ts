import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sepolia } from 'wagmi/chains'

export const wagmiConfig = getDefaultConfig({
  appName: 'IDEAFY',
  projectId: import.meta.env.VITE_WC_PROJECT_ID!,
  chains: [sepolia],
  ssr: false,
})
