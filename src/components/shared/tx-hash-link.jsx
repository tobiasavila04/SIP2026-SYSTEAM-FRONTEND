import { ExternalLink } from 'lucide-react'

export function TxHashLink({ hash, short = true, chain = 'sepolia' }) {
  const url = `https://${chain}.etherscan.io/tx/${hash}`

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
