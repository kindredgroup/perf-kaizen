import { generateRateControlledLoadMulti, generateRateControlledLoadV2 } from "./generators.js"

interface LoadGeneratorConfig {
  rate: number
  // durationMs?: number
}

interface LoadGeneratorReturn {
  metrics: {
    totalCount: number
    startTimeMs: number
    endTimeMs: number
  }
}

export async function loadGenerator<T>(config: LoadGeneratorConfig, createTestDataFn: () => Generator<T>, submitTestDataFn: (arg: T) => Promise<unknown> ): Promise<LoadGeneratorReturn> {
  // const pond = new Pond(config.concurrencyCount ?? 500)

  let totalCount = 0
  const startTimeMs = Date.now()

  for await (const mockData of generateRateControlledLoadV2(config.rate, createTestDataFn)) {
    await submitTestDataFn(mockData as T)

    totalCount++
  }
  const endTimeMs = Date.now()

  return {
    metrics: {
      totalCount,
      startTimeMs,
      endTimeMs
    }
  }

}

export async function loadGeneratorMulti(config: LoadGeneratorConfig, createTestDataFns: AsyncGenerator[], processTestDataFn: (arg: unknown) => Promise<unknown> | unknown ): Promise<LoadGeneratorReturn> {
  let totalCount = 0
  const startTimeMs = Date.now()

  for await (const mockData of generateRateControlledLoadMulti(config.rate, createTestDataFns)) {
    await Promise.resolve(processTestDataFn(mockData))

    totalCount++
  }
  const endTimeMs = Date.now()

  return {
    metrics: {
      totalCount,
      startTimeMs,
      endTimeMs
    }
  }

}