export async function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

export function getThroughput(total, timeMs) {
  return total / timeMs * 1000
}

export function getPercentageDiff(value1, value2) {
  return (value2 - value1) / value1 * 100
}