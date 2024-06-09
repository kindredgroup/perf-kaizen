import lodash from "lodash"

const { sample } = lodash

/**
 * Sleeps for the given time in milliseconds
 * @param time Time in milliseconds to sleep
 */
export const sleep = (time: number) => new Promise(resolve => setTimeout(resolve, time))


export function randomArr<T>(arr: T[]): T {
  return sample(arr)
}

export function randomEnum<T extends object>(anEnum: T): T[keyof T] {
  return randomArr(Object.values(anEnum))
}