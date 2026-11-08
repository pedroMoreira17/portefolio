/// <reference lib="webworker" />
import { samplePortrait } from './sampler';
import type { SamplerOptions } from './types';

interface Request {
  url: string;
  options: SamplerOptions;
}

self.onmessage = async (event: MessageEvent<Request>) => {
  try {
    const { url, options } = event.data;
    const blob = await (await fetch(url)).blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('2D context unavailable in worker');
    ctx.drawImage(bitmap, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    bitmap.close();

    const result = samplePortrait(data, width, height, options);
    (self as unknown as Worker).postMessage({ ok: true, result }, [
      result.face.buffer,
      result.cloud.buffer,
      result.line.buffer,
      result.start.buffer,
      result.color.buffer,
      result.rand.buffer,
    ]);
  } catch (error) {
    (self as unknown as Worker).postMessage({ ok: false, error: String(error) });
  }
};
