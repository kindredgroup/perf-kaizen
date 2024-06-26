/****************************************************************************************************************
 *
 *  0004topLevelConcurrency.js
 *
 *  Compares the performance difference when the top level async tasks are run sequentially vs concurrently
 *
 *  - Takes an array of tasks with number of dbOperations to do.
 *  - Each task iterates for the number of dbOperations sequentially and calls a fake/mock db operation
 *
 *****************************************************************************************************************/

import { getPercentageDiff, getThroughput, sleep } from "./utils.js"

/**
 * A function that sleeps for the `sleepDurationMs` mocking time taken for a db or network request
 * @param {string} taskName
 * @param {number} iteration
 * @param {number} [sleepDurationMs=25] sleepDurationMs
 *
 */
async function fakeAsyncTask(taskName, iteration, sleepDurationMs = 25) {
  console.log(`Fake async task for ${taskName} and iteration=${iteration}`)
  await sleep(sleepDurationMs)
}


async function processTask(taskName, insertCount, selectCount) {

  console.log(`Starting insert for task ${taskName}`)
  for (let i = 1; i <= insertCount; i++) {
    await fakeAsyncTask(taskName, i)
  }
  console.log(`Finished insert for task ${taskName}`)
}


console.log("Start of app")

const tasksList = [
  {
    taskName: "0001",
    dbOperations: 10
  },
  {
    taskName: "0002",
    dbOperations: 10
  },
  {
    taskName: "0003",
    dbOperations: 50
  },
  {
    taskName: "0004",
    dbOperations: 20
  },
]

// Running tasks one after the other sequentially
const startTimeSequential = performance.now()
for (const m of tasksList) {
  await processTask(m.taskName, m.dbOperations)
}
const endTimeSequential = performance.now()

// Running tasks concurrently
const startTimeConcurrent = performance.now()
const promises = tasksList.map(m => processTask(m.taskName, m.dbOperations))
await Promise.all(promises)
const endTimeConcurrent = performance.now()


const total = tasksList.reduce((acc, inp) => acc + inp.dbOperations, 0)
const seqTps = getThroughput(total, endTimeSequential - startTimeSequential)
const concurTps = getThroughput(total, endTimeConcurrent - startTimeConcurrent)
console.log("Total DB operations....%s", total)
console.log("[SEQUENTIAL] TotalTime taken to process... %sms at rate=%s (tps)", endTimeSequential - startTimeSequential, seqTps)
console.log("[CONCURRENT] TotalTime taken to process... %sms at rate=%s (tps)", endTimeConcurrent - startTimeConcurrent, concurTps)
console.log("Percentage improvement moving from [SEQUENTIAL] -> [CONCURRENT] = %s%", getPercentageDiff(seqTps, concurTps))


console.log("End of app")

