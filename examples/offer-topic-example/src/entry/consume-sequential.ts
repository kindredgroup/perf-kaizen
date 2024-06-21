import { logger } from "@perf-kaizen/logger/build/logger.js"
import { KafkaClient } from "../kafka/kafka-client.js"
import { SequentialMessageHandler } from "../message-consumers/sequential.js"
import { ConsumerHandler, TopicConsumerHandler } from "../kafka/consumers/handler.js"
import { MockDbService } from "../datastore/mockDbService.js"
import { MockDbContest, MockDbMarket, MockDbProposition } from "../datastore/mockDbAdapters.js"
import { program } from "commander"
import { ConsumerMode } from "../message-consumers/types.js"

program.description("Consume messages sequentially")
       .option("-m, --mode <normal|optimized>", "Normal or optimized mode", "normal")
       .option("-wc, --with-cache", "Cache the db results till end of each batch")
       .parse()


const options = program.opts();

const consumerMode:ConsumerMode = options.mode ?? "normal"
const cacheEnabled = options.withCache ?? false


logger.info("Starting Sequential Consumer")
logger.info("Mode: %s", consumerMode)
logger.info("Use Caching?: %s ", cacheEnabled)


// Hard coded variables to be moved to env variables
const KAFKA_BROKERS = process.env.KAFKA_BROKERS
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID
const KAFKA_USERNAME = process.env.KAFKA_USERNAME
const KAFKA_PASSWORD = process.env.KAFKA_PASSWORD


// Kafka Client
const setupKafka = (): KafkaClient => {

  const kafkaClient = new KafkaClient({
    brokers:   KAFKA_BROKERS?.split(",") || [],
    clientId:  KAFKA_CLIENT_ID,
    mechanism: "scram-sha-512",
    password:  KAFKA_USERNAME,
    username:  KAFKA_PASSWORD,
  })

  return kafkaClient
}

const kafka = setupKafka()

const kafkaConsumer = kafka.getClient().consumer({groupId: process.env.KAFKA_GROUP_ID_SEQ})

await kafkaConsumer.connect()


const offerTopic = process.env.KAFKA_TOPIC

if (!offerTopic){
  throw new Error("Offer topic not passed")
}

const datastoreService = new MockDbService(new MockDbContest(), new MockDbProposition(), new MockDbMarket(), cacheEnabled)

const offerHandler = new SequentialMessageHandler(consumerMode, datastoreService)

const consumerHandler: Map<string, TopicConsumerHandler> = new Map()
consumerHandler.set(offerTopic, offerHandler)

await kafkaConsumer.subscribe({
  fromBeginning: true,
  topics:        [
    ...consumerHandler.keys(),
  ],
})

logger.info("Subscribing to topics", [ offerTopic ])

const handler = new ConsumerHandler(consumerHandler)

await kafkaConsumer.run({
  autoCommit:                     false,
  eachBatch:                      handler.batchHandler,
  eachBatchAutoResolve:           false,
  partitionsConsumedConcurrently: 3,
})