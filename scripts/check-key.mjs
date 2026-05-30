import { privateKeyToAccount } from 'viem/accounts'
const PRIVATE_KEY = '0xb7ddf518a66ac1b209065717fd07f08aeb78ed3f8235e88bc17935172d72be3e'
const account = privateKeyToAccount(PRIVATE_KEY)
console.log('Dirección de la private key:', account.address)
