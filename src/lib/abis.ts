export const ERC20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
] as const

export const PROJECT_TOKEN_ABI = [
  ...ERC20_ABI,
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
  {
    type: 'function',
    name: 'burnFrom',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
] as const

export const INVESTMENT_SWAP_ABI = [
  {
    type: 'function',
    name: 'invest',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'proyectoId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'refund',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'proyectoId', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'crearTokenProyecto',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'proyectoId', type: 'uint256' },
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'supplyInicial', type: 'uint256' },
    ],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'obtenerTokenDeProyecto',
    stateMutability: 'view',
    inputs: [{ name: 'proyectoId', type: 'uint256' }],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'event',
    name: 'Invested',
    inputs: [
      { name: 'inversor', type: 'address', indexed: true },
      { name: 'proyectoId', type: 'uint256', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Refunded',
    inputs: [
      { name: 'inversor', type: 'address', indexed: true },
      { name: 'proyectoId', type: 'uint256', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const

export const IDEA_MARKETPLACE_ABI = [
  {
    type: 'function',
    name: 'listTokens',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'subToken', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'pricePerToken', type: 'uint256' }
    ],
    outputs: []
  },
  {
    type: 'function',
    name: 'buyTokens',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'listingId', type: 'uint256' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: []
  },
  {
    type: 'function',
    name: 'cancelListing',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'listingId', type: 'uint256' }],
    outputs: []
  },
  {
    type: 'event',
    name: 'Listed',
    inputs: [
      { name: 'listingId', type: 'uint256', indexed: true },
      { name: 'seller', type: 'address', indexed: true },
      { name: 'subToken', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'pricePerToken', type: 'uint256', indexed: false }
    ]
  }
]

export const IDEA_GOVERNANCE_ABI = [
  {
    type: 'function',
    name: 'vote',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'support', type: 'bool' },
    ],
    outputs: [],
  },
] as const

export const DIVIDEND_DISTRIBUTOR_ABI = [
  {
    type: 'function',
    name: 'claim',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'proyectoId', type: 'uint256' },
    ],
    outputs: [],
  }
] as const

