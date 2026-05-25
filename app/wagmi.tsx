'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { bsc } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Guess the Score',
  projectId: '42cedd42ee3f029a1efbff1b26216ca0',
  chains: [bsc],
  ssr: true,
});