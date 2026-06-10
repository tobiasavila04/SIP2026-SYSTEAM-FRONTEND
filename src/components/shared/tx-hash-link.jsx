import { ExternalLink } from 'lucide-react'

export function TxHashLink({ hash, short = true, chain = 'base-sepolia' }) {
  const cleanHash = hash?.trim() || ''
  const formattedHash = cleanHash.startsWith('0x') ? cleanHash : `0x${cleanHash}`
  
  const url = chain === 'base-sepolia' 
    ? `https://sepolia.basescan.org/tx/${formattedHash}`
    : `https://basescan.org/tx/${formattedHash}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors font-mono"
    >
      {short ? `${hash.slice(0, 10)}...${hash.slice(-8)}` : hash}
      <ExternalLink className="w-3 h-3" />
    </a>
  )
}
