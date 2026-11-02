import { readFileSync } from 'node:fs';
export const CV_PUBLISHED = /published:\s*true/.test(readFileSync('src/data/cv.ts', 'utf8'));
