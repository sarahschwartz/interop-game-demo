import { http, createConfig } from '@wagmi/core';
import { defineChain } from 'viem';

export const zkChain1 = defineChain({
  id: 62348,
  name: 'ZK Chain 1',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:3650/'],
      webSocket: ['ws://localhost:3651/'],
    },
  },
})

export const zkChain2 = defineChain({
  id: 299,
  name: 'ZK Chain 2',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:3450/'],
      webSocket: ['ws://localhost:3451/'],
    },
  },
})

export const wagmiConfig = createConfig({
  chains: [zkChain1, zkChain2],
  transports: {
    [zkChain1.id]: http(),
    [zkChain2.id]: http(),
  },
});
