import { getPercentageDiff, getThroughput, sleep } from "./utils.js"

// This function must run only sequential as the order of execution matters
async function dbOperationThatMustBeSequential(taskName, iteration) {
  // console.log(`Sequential Processing for task ${taskName} and iteration=${iteration}`)
  await sleep(20)
}

// This function can run concurrently as the order of execution doesn't matters
async function dbOperationThatCanRunConcurrently(taskName, iteration) {
  // console.log(`Concurrent processing for task ${taskName} and iteration=${iteration}`)
  await sleep(20)
}

// Function without any inner level concurrency applied.
async function processTaskWithoutDbConcurrency(taskName, sequentialCount, concurrentCount) {

  console.log(`Starting processing for task ${taskName}`)
  for (let i = 1; i <= sequentialCount; i++) {
    await dbOperationThatMustBeSequential(taskName, i)
  }
  for (let i = 1; i <= concurrentCount; i++) {
    await dbOperationThatCanRunConcurrently(taskName, i)
  }
  console.log(`Finished processing for task ${taskName}`)
}

// Function take executes things sequentially only when order is required, else concurrency is applied in inner level as well.
async function processTaskWithDbConcurrency(taskName, sequentialCount, concurrentCount) {

  console.log(`Starting processing for task ${taskName}`)
  for (let i = 1; i <= sequentialCount; i++) {
    await dbOperationThatMustBeSequential(taskName, i)
  }

  let concurrentPromises = []
  for (let i = 1; i <= concurrentCount; i++) {
    concurrentPromises.push(dbOperationThatCanRunConcurrently(taskName, i))
  }
  await Promise.all(concurrentPromises)
  console.log(`Finished processing for task ${taskName}`)
}



console.log("Start of app")

const taskList = [
  {
    taskName: "0001",
    dbOperationsSequential: 5,
    dbOperationsConcurrent: 30,
  },
  {
    taskName: "0002",
    dbOperationsSequential: 3,
    dbOperationsConcurrent: 30,
  },
  {
    taskName: "0003",
    dbOperationsSequential: 5,
    dbOperationsConcurrent: 50,
  },
  {
    taskName: "0004",
    dbOperationsSequential: 2,
    dbOperationsConcurrent: 20,
  },
]

// Running tasks one after the other sequentially
const startTimeMaxSequential = performance.now()
for (const m of taskList) {
  await processTaskWithoutDbConcurrency(m.taskName, m.dbOperationsSequential, m.dbOperationsConcurrent)
}
const endTimeMaxSequential = performance.now()

// Running tasks concurrently only on the root
const startTimeTopLevelConcurrent = performance.now()
const promisesProcessTaskWithoutDbConcurrency = taskList.map(m => processTaskWithoutDbConcurrency(m.taskName, m.dbOperationsSequential, m.dbOperationsConcurrent))
await Promise.all(promisesProcessTaskWithoutDbConcurrency)
const endTimeTopLevelConcurrent = performance.now()

// Running tasks sequentially on the root, but concurrency is taken care in the inner levels
const startTimeTopLevelSequentialInnerConcurrent = performance.now()
for (const m of taskList) {
  await processTaskWithDbConcurrency(m.taskName, m.dbOperationsSequential, m.dbOperationsConcurrent)
}
const endTimeTopLevelSequentialInnerConcurrent = performance.now()

// Running tasks concurrently on all levels, except in scenarios where order matters.
const startTimeMaxConcurrent = performance.now()
const promisesProcessTaskWithDbConcurrency = taskList.map(m => processTaskWithDbConcurrency(m.taskName, m.dbOperationsSequential, m.dbOperationsConcurrent))
await Promise.all(promisesProcessTaskWithDbConcurrency)
const endTimeMaxConcurrent = performance.now()


const total = taskList.reduce((acc, inp) => acc + inp.dbOperationsConcurrent + inp.dbOperationsSequential, 0)
const maxSeqTps = getThroughput(total, endTimeMaxSequential - startTimeMaxSequential)
const topConcurTps = getThroughput(total, endTimeTopLevelConcurrent - startTimeTopLevelConcurrent)
const topSeqTps = getThroughput(total, endTimeTopLevelSequentialInnerConcurrent - startTimeTopLevelSequentialInnerConcurrent)
const maxConcurTps = getThroughput(total, endTimeMaxConcurrent - startTimeMaxConcurrent)

console.log("Total DB operations for each test....%s", total)
console.log("[MAX SEQUENTIAL]                   TotalTime taken to process... %sms at rate=%s (tps)", endTimeMaxSequential - startTimeMaxSequential, maxSeqTps)
console.log("[TOP CONCURRENT, INNER SEQUENTIAL] TotalTime taken to process... %sms at rate=%s (tps)", endTimeTopLevelConcurrent - startTimeTopLevelConcurrent, topConcurTps)
console.log("[TOP SEQUENTIAL, INNER CONCURRENT] TotalTime taken to process... %sms at rate=%s (tps)", endTimeTopLevelSequentialInnerConcurrent - startTimeTopLevelSequentialInnerConcurrent, topSeqTps)
console.log("[MAX CONCURRENT]                   TotalTime taken to process... %sms at rate=%s (tps)", endTimeMaxConcurrent - startTimeMaxConcurrent, maxConcurTps)


console.log("Percentage improvement moving from [TOP SEQUENTIAL, INNER CONCURRENT] -> [MAX CONCURRENT] = %s%", getPercentageDiff(topSeqTps, maxConcurTps))
console.log("Percentage improvement moving from [TOP CONCURRENT, INNER SEQUENTIAL] -> [MAX CONCURRENT] = %s%", getPercentageDiff(topConcurTps, maxConcurTps))
console.log("Percentage improvement moving from [MAX SEQUENTIAL] -> [MAX CONCURRENT] = %s%", getPercentageDiff(maxSeqTps, maxConcurTps))


console.log("End of app")

