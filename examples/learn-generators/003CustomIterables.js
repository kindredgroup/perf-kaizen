

// Making an object iterable
const nameObject = {
  firstName: "a",
  middleName: "m",
  lastName: "z"
}

// *** returning just the value without the done
// nameObject[Symbol.iterator] = function () {
//   const keys = Object.keys(this)

//   let keyIdx = 0
//   return {
//     next: () => {
//       if (keyIdx > keys.length - 1) {
//         return undefined
//       } else {
//         keyIdx++
//         return this[keys[keyIdx]]
//       }
//     }
//   }
// }

// *** returning correct way of iterator
// nameObject[Symbol.iterator] = function () {
//   const keys = Object.keys(this)

//   let keyIdx = 0
//   return {
//     next: () => {
//       if (keyIdx > keys.length - 1) {
//         return {
//           done: true,
//           value: undefined
//         }
//       } else {
//         const returnItem = {
//           value: this[keys[keyIdx]],
//           done: false
//         }

//         keyIdx++
//         return returnItem
//       }
//     }
//   }
// }

// console.log("Accesing iterator values by calling `next()` method one by one")
// const objectIterator = nameObject[Symbol.iterator]()
// console.log(objectIterator.next())
// console.log(objectIterator.next())
// console.log(objectIterator.next())
// console.log(objectIterator.next())

// console.log("Accesing iterator values using for...of")
// for (let value of nameObject) {
//   console.log("Value access by for...of ==> %s", value)
// }

