

function* genFunction() {

  yield "abc"

  console.log("After the first yield")

  yield "xyz"
  console.log("After the second yield")
}



for (let item of genFunction()) {
  console.log("Item yielded .... %s", item)
}