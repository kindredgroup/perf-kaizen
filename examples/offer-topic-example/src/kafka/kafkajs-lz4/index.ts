import {
  EncoderOptions,
  decode,
  encode,
} from "lz4"

export const createLZ4Codec = (encoderOptions?: EncoderOptions) => {
  const compress = (encoder: { buffer: Buffer }): Promise<Buffer> =>
    new Promise<Buffer>(resolve => {
      const compressedBuffer: Buffer = encode(encoder.buffer, encoderOptions)
      resolve(compressedBuffer)
    })

  const decompress = (buffer: Buffer): Promise<Buffer> =>
    new Promise<Buffer>(resolve => {
      const decompressedBuffer = decode(buffer)
      resolve(decompressedBuffer)
    })

  return () => ({
    compress,
    decompress,
  })
}
