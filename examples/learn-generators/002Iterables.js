// String Iteration
console.log("Iterators in String")
const someString = "Hi"


// Accessing items using for...of
for (let s of someString) {
  console.log(s)
}
console.log("\n***------------------***\n")


// console.log(someString.next()) // Will throw error as next is not defined on the string

// Accessing directly calling the next() method
// const stringIterator = someString[Symbol.iterator]()
// console.log(stringIterator.next())
// console.log(stringIterator.next())
// console.log(stringIterator.next())


// Array Iteration
// console.log("Iterators in Array")
// const someArray = ["Hello", "World"]


// // Accessing items using for...of
// for (let a of someArray) {
//   console.log(a)
// }
// console.log("\n***------------------***\n")


// // Accessing directly calling the next() method
// const arrayIterator = someArray[Symbol.iterator]()
// console.log(arrayIterator.next())
// console.log(arrayIterator.next())
// console.log(arrayIterator.next())


// Object Iteration
// console.log("Iterators in Object")
// const nameObject = {
//   firstName: "a",
//   middleName: "m",
//   lastName: "z"
// }


// Accessing items using for...of
// for (let name of nameObject) {  // throws error as nameObject is an object and is not iterable.
//   console.log(name)
// }
// console.log("\n***------------------***\n")