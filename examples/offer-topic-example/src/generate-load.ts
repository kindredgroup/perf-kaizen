import { loadGeneratorMulti } from "@perf-kaizen/load-generator/build/load-generator.js"
import { generateMockOfferingsData } from "./offer-message/mocks.js"
import { OfferingLoadGeneratorParams } from "./offer-message/types.js"
import { getOfferingsByTypeCountToGenerate } from "./offer-message/utils.js"
import { logger } from "@perf-kaizen/logger/build/logger.js"
import { KafkaClient } from "./kafka/kafka-client.js"

logger.info("🏁 Starting offer message load generator...")

// The input use to generate the load.
const loadToGenerateInput: OfferingLoadGeneratorParams = {
  contests: 3,
  propositionsPerContest: 240,
  optionsPerProposition: 20,
  variantsPerProposition: 2
}

// Hard coded variables to be moved to env variables
const KAFKA_BROKERS = process.env.KAFKA_BROKERS
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID
const KAFKA_USERNAME = process.env.KAFKA_USERNAME
const KAFKA_PASSWORD = process.env.KAFKA_PASSWORD
const KAFKA_TOPIC = process.env.KAFKA_TOPIC


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

const kafkaProducer = kafka.getClient().producer()

await kafkaProducer.connect()

const offeringsCount = getOfferingsByTypeCountToGenerate(loadToGenerateInput)

// Function used to generate mock data
const generateMockDataSet1 = generateMockOfferingsData(offeringsCount)
const generateMockDataSet2 = generateMockOfferingsData(offeringsCount)
// Function used to send out the load
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const publishToKafka = async (arg) => {

  // logger.info(`Producer will send message with key = ${arg.contestKey} and size = ${JSON.stringify(arg).length}`)
    try {

      await kafkaProducer.send({
       acks: 0,
       topic: KAFKA_TOPIC,
       messages: [
         {
           key: arg.payload.contestKey,
           value: JSON.stringify(arg.payload),
           headers: {
            messageType: arg.type
           }
         }
       ],
     })
    } catch (error) {
        console.log(`Error publishing message for key=${arg.contestKey} with error `, error)
    }

}

const THROUGHPUT = 20_000
const result = await loadGeneratorMulti({rate: THROUGHPUT}, [generateMockDataSet1(), generateMockDataSet2()], publishToKafka)

// Generate load and execute the async task like publishing to Kafka

const timeTakenToGenerate = result.metrics.endTimeMs - result.metrics.startTimeMs
logger.info("Total mock offerings generated = %s ", result.metrics.totalCount)
logger.info("Time taken to generate the mock data = %s ms", (timeTakenToGenerate))
logger.info("Expected TPS = %s", THROUGHPUT)
logger.info("Actual TPS = %s", result.metrics.totalCount / (timeTakenToGenerate) * 1000)

