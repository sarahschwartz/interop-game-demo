import { http, createConfig } from '@wagmi/core';
import { defineChain } from 'viem';
import { GAME_CHAIN_1_CONTRACT_ADDRESS, GAME_CHAIN_2_CONTRACT_ADDRESS, LEADERBOARD_ADDRESS } from './constants';

export const leaderboardChain = defineChain({
  id: 3423,
  name: 'Leaderboard Chain',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:3050/'],
      webSocket: ['ws://localhost:3051/'],
    },
  },
})

export const gameChain1 = defineChain({
  id: 5328,
  name: 'Game Chain 1',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:3150/'],
      webSocket: ['ws://localhost:3151/'],
    },
  },
})

export const gameChain2 = defineChain({
  id: 9313,
  name: 'Game Chain 2',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:3250/'],
      webSocket: ['ws://localhost:3251/'],
    },
  },
})

export const wagmiConfig = createConfig({
  chains: [leaderboardChain, gameChain1, gameChain2],
  transports: {
    [leaderboardChain.id]: http(),
    [gameChain1.id]: http(),
    [gameChain2.id]: http(),
  },
});

export function getChainInfo(chainId: number){
  return wagmiConfig.chains.find((c) => c.id === chainId);
}

export function getContractAddress(chainId: number){
  switch(chainId){
    case leaderboardChain.id:
    return LEADERBOARD_ADDRESS;
    break;
  case gameChain1.id:
    return GAME_CHAIN_1_CONTRACT_ADDRESS;
    break;
  case gameChain2.id:
    return GAME_CHAIN_2_CONTRACT_ADDRESS;
    break;
  default:
    return null;
  }
}