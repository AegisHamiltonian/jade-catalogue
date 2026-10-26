import sharp from 'sharp';
import {stat} from 'node:fs/promises';

for (const [source, target] of [
  ['measure-finger','size-ring-finger'],
  ['measure-ring','size-ring-diameter'],
]) {
  const file=`dist/assets/${target}.webp`;
  await sharp(`design/ring-sizing/${source}.png`).webp({quality:92,effort:5}).toFile(file);
  const {width,height}=await sharp(file).metadata();
  console.log(`${target}: ${width} × ${height}, ${(await stat(file)).size} bytes`);
}
