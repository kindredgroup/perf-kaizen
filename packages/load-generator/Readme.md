# @perf-kaizen/load-generator

A simple utility to generate load for a given rate.

## How is this different from other load generators?
While we were exploring solutions for generating loads that cater to our requirements. Two short comings we faced in the existing solutions we had in house or while looking at external solutions were

1.  Lack of creating huge payload to test.
  - General strategy we came across while exploring is,
    a. To generate the test data upfront and publish it at a controlled rate
    b. Or iterate a loop and publish the data and control the rate.
  - While option `b` would still work, option `a` is not suitable for huge number of test data due to risk of exhausting the memory.
2.  Lack of easy way to create multiple types of test data which can be assumed to be part of a Directed Acyclic Graph (DAG)

Therefore we built this load generator, which uses javascript generators under the hood to generate the test data irrespective of whether it is of same type or multiple types, and `yield` each test data based on our testing strategy. This allows for very less memory footprint and a very flexible way to create the test data of same, related or completely different types of test data.


![Image](./drawings/load%20generator.drawio.svg)

## Input Arguments
- Takes the rate at which the message should be created and acted on
- An async generator callback function responsible for creating the data
- An async callback function that will take the data generated and act on it. Example, take the data it received and publish it to an Event/Message Queue.


## Example usage
Refer to [example](../../examples/offer-topic-example/src/entry/generate-load.ts), which uses [Strategy 2](#2-generate-multiple-related-data-at-a-given-rate-sequentially), to generate load.

## Multiple strategies to generate the test data

- [Strategy 1: Generate same type of data at a given rate](#1-generate-same-type-of-data-at-a-given-rate)
- [Strategy 2:Generate multiple related data at a given rate sequentially](#2-generate-multiple-related-data-at-a-given-rate-sequentially)
- Generate multiple related data at a given rate interleaved with similar data
- Generate independant data at different rates

### 1. Generate same type of data at a given rate
Scenarios when we need to generate the same type of data to test `n` number of times at a specified rate.

**Example: Consider a scenario where we need to generate `200,000` number of test data at a rate of `5000` items per second.**

```typescript
async function* generateSameTestData(){
  for (let i=0; i<200_000; i++) {
    yield {
      name: `Test user ${i}`,
      id: i
    }
  }
}
```
 _snippet 1.a: async generator function to generate `200,000` test data of same type._

```typescript
async function publishTestData(testData){
  // We have some publisher that will publish the test data
  somePublisher.publish(testData)
}
```
_snippet 1.b: Pseudo code to publish each test data_


```typescript
// We have some publisher that will publish the test data
await loadGeneratorMulti({rate: 5000}, [generateSameTestData], publishTestData)
```
_snippet 1.c: calling the load generator to generate `200,000` items at a rate of `5000`_


### 2. Generate multiple related data at a given rate sequentially
Scenarios when we need to generate the multiple different types of data related to each other `n` number of times at a specified rate.

**Example: Consider banking scenario, where we need to generate data about `20,000` customers and each customer makes `100` transactions at a rate of `5000`**

```typescript
async function* generateCustomerWithTransferData(){
  for (let i=0; i<20_000; i++) {
    const customerData = {
      name: `Test user ${i}`,
      id: i,
      type: "Customer"
    }

    yield customerData

    for (let j=0; j<100; j++){
      const transferData = {
        id: customerData.id,
        amount: 1,
        dateTime: new Date()
      }

      yield transferData
    }
  }
}
```
_snippet 2.a: calling the load generator to generate for `20,000` customer with each having `100` transfer requets at a rate of `5000`_.

We can reuse `snippet 1.b` from earlier, for publishing the data.

```typescript
// We have some publisher that will publish the test data
await loadGeneratorMulti({rate: 5000}, [generateCustomerWithTransferData], publishTestData)
```
_snippet 2.b: calling the load generator to generate data for `20,000` customer with each customer having `100` transfer requests at a rate of `5000`_

