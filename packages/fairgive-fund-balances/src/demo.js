import { fileURLToPath } from 'node:url';
import { giveDemo } from 'fairgive-core';
import { DEMO } from './manifest.js';

export async function demo(manifest) {
  await giveDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), DEMO);
}
