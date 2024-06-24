
## Description

An example project showing the differences in rate of consuming messages between `sequential` vs `concurrent` processing of messages received from Kafka.

### Sequential Processing of messages

- Sequential - `normal` mode and `without db results cached` processing messages one by one. (Slowest possible way for sequential processing)
- Sequential - `normal` mode and `with db results cached`
- Sequential - `optimised` mode and `without db results cached`. `optimized` mode processes concurrently all the messages under a specific `messageType`
- Sequential - `optimised` mode and `with db results cached`. (Fastest possible way for sequential processing)


### Concurrent Processing of messages

- Related items under a contest are grouped together to create a graph
- Under each graph, items that need to be processed sequentially will be processed sequentially and rest would be processed concurrently.
- All individual contest graphs will be processed concurrently


## Prerequisites
- Ensure Kafkajs is installed and running

- Use nodejs version `20.x.x` or greater

- Update the `.env` file with values specific to your Kafka broker.

## Getting started

- Install dependencies
```bash
npm i
```

- Building the apps
```bash
npm run build:watch
```


## Running the example

There are three apps
- Load generator app to generate the test load at a specified rate.
```bash
npm run start:load -- -r 10000 --contests 10 --propositions 140 --options 20 --variants 2
```

- App that consumes the messages from kafka and processes it sequentially
```bash
npm run start:consume:seq
```

- App that consumes the messages from Kafka and processes it concurrently
```bash
npm run start:consume:concurrent
```


