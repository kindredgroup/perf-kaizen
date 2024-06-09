import { sleep } from "./common/utils.js";

/**
 * Generates data for a performance test at a specific throughput.
 * @param throughput The desired throughput in data items per second.
 * @param duration The duration of the test in seconds.
 * @param generator A function that generates a single data item.
 * @returns An async iterable that yields data items at the specified rate.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export async function* generateRateControlledLoad<T>(throughput: number, duration: number, generator: () => T) {
  const perItemTimeMs = 1 / throughput * 1000; // Time between data items in milliseconds
  const totalRecordsToProduce = duration * throughput // Total number of records for test

  const startTimeMs = Date.now();
  let nextItemTimeMs = startTimeMs;

  for (let i = 0; i < totalRecordsToProduce; i++) {
    const dataItem = generator();
    yield dataItem;

    const now = Date.now();
    const delay = nextItemTimeMs - now;
    if (delay > 0) {
      await sleep(delay);
    }
    nextItemTimeMs += perItemTimeMs;
  }
}

/**
 * Generates data for a performance test at a specific throughput.
 * @param throughput The desired throughput in data items per second.
 * @param generator A generator function that generates all the mock data required for the test.
 * @returns An async iterable that yields data items at the specified rate.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export async function* generateRateControlledLoadV2(throughput: number, generator: () => Generator<unknown, void, unknown>) {
  const perItemTimeMs = 1 / throughput * 1000; // Time between data items in milliseconds
  // const totalRecordsToProduce = duration * throughput // Total number of records for test

  const startTimeMs = Date.now();
  let nextItemTimeMs = startTimeMs;

  for (const dataItem of generator()) {
    yield dataItem;

    const now = Date.now();
    const delay = nextItemTimeMs - now;
    if (delay > 0) {
      await sleep(delay);
    }
    nextItemTimeMs += perItemTimeMs;
  }
}

/**
 * Generates data for a performance test at a specific rate from multiple sources.
 *
 * Scenarios to use this:
 *  1. Use same generator multiple times to divide the same type of test data generated concurrently.
 *  2. Use multiple different generators creating different test data but at the same expected rate.
 *
 * @param throughput The desired rate to produce the data per second.
 * @param generators An array of async generator functions used to generate the test data
 * @yield Yields the test data to the caller of this function to act on the data and resume.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export async function* generateRateControlledLoadMulti(throughput: number, generators: AsyncGenerator<any, void, unknown>[]) {
  const perItemTimeMs = 1 / throughput * 1000; // Time between data items in milliseconds
  // const totalRecordsToProduce = duration * throughput // Total number of records for test

  const startTimeMs = Date.now();
  let nextItemTimeMs = startTimeMs;

  for await (const dataItem of processMultiAsyncGenerators(generators)) {
    yield dataItem;

    const now = Date.now();
    const delay = nextItemTimeMs - now;
    if (delay > 0) {
      await sleep(delay);
    }
    nextItemTimeMs += perItemTimeMs;
  }
}

/**
 * Process multiple async generators concurrently
*
* @param throughput The desired rate to produce the data per second.
* @param generators An array of async generator functions to be executed
* @yield Yields the test data to the caller of this function to act on the data and resume.
*/
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function* processMultiAsyncGenerators(generators: AsyncGenerator[]) {
  const asyncGeneratorsMap = new Map()

  generators.forEach((g, i) => {
    asyncGeneratorsMap.set(i, g)
  })

  while (asyncGeneratorsMap.size > 0) {
    // const totalSize = promises.size
    const result = await Promise.all([...asyncGeneratorsMap.entries()].map(([key, asyncGen]) => {
        return asyncGen.next().then(res => {
        // console.log("res...", res)
        // console.log(`res is done for key=${key}`, res)
        if (res.done) {
          asyncGeneratorsMap.delete(key)
        }
        return res.value
      })
    }))

    for await (const res of result) {
      if (res) {
        yield res
      }
    }
  }
}
