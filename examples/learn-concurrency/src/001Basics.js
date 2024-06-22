
/****************************************************************************************************************
 *
 *  001Basics.js
 *
 *  A simple app that does addition between two number using:-
 *  -  synchronously
 *  -  asynchronously using Promise
 *  -  asynchronously using Async/Await syntax
 *
 *  This app helps to mentally map how items are deferred and picked later by the eventloop.
 *
 *****************************************************************************************************************/

/**
 * Add two numbers and returns the sum
 * @param {number} a
 * @param {number} b
 * @returns {number} sum
 */
function addNumber(a, b) {
  const sum = a + b
  return sum
}


/**
 * Add number asynchronously
 * @param {number} a
 * @param {number} b
 * @returns {Promise<number>} sum of two numbers
 */
async function addNumberAsync(a, b) {
  return new Promise(resolve => {
    resolve(addNumber(a, b))
  })
}

console.log("Start of app")
// Sync
{
  const a = 5
  const b = 5
  console.log("[SUM-1] Adding %s and %s synchronously", a, b)
  const syncSum = addNumber(5, 5)
  console.log(`[SUM-1 RESULT] Sync addition of ${a} + ${b} = %s`, syncSum)
} // <-- constants wrapped in block scope
// timeout callback
{
  const a = 1
  const b = 1
  console.log("[SUM-TO] Adding %s and %s asynchronously using SetTimeout", a, b)
  setTimeout(() => {
    console.log(`[SUM-TO RESULT] Addition of ${a} + ${b} from SetTimeout callback = %s`, addNumber(a, b))
  }, 0) // <--- Notice 0 here.

}
// Promise + timeout callback
{
  const a = 6
  const b = 6
  console.log("[SUM-2] Adding %s and %s asynchronously using Promise", a, b)
  addNumberAsync(a, b).then(s => {
    console.log("[SUM-2] Sleeping for 20ms before printing result for addition of %s + %s", a, b)
    setTimeout(() => {
      console.log(`[SUM-2 RESULT] Async addition of ${a} + ${b} from promise.then() callback = %s`, s)
    }, 20)
  })
}
// Async Await
{
  const a = 10
  const b = 10
  console.log("[SUM-3] Adding %s and %s asynchronously using Async/Await", a, b)
  const sumAsync = await addNumberAsync(10, 10)
  console.log(`[SUM-3 RESULT] Async addition of ${a} + ${b} after awaiting the async fn to complete = %s`, sumAsync)
}

// Sync
{
  const a = 20
  const b = 20
  console.log("[SUM-4] Adding %s and %s synchronously", a, b)
  const syncSum = addNumber(5, 5)
  console.log(`[SUM-4 RESULT] Sync addition of ${a} + ${b} = %s`, syncSum)
}
// Promise callback
{
  const a = 30
  const b = 30
  console.log("[SUM-5] Adding %s and %s asynchronously using Promise", a, b)
  addNumberAsync(a, b).then(s => {
    console.log(`[SUM-5 RESULT] Async addition of ${a} + ${b} from promise.then() callback = %s`, s)
  })
}
console.log("End of app")

