/**
 * An example on how to generate a multiple message types
 */
import { loadGeneratorMulti } from "@perf-kaizen/load-generator/build/load-generator.js"
import { generateMockOfferingsData } from "offer-topic-example/build/mocks.js"
import { getOfferingsByTypeCountToGenerate } from "offer-topic-example/build/utils.js"
import { KafkaClient } from "offer-topic-example/build/kafka/kafka-client.js"

import { program } from "commander"

program.description("Generate the offer messages and publish to kafka at a specified rate")
  .requiredOption("-r, --rate <rate>", "Rate (tps) for producing offer messages", parseInt)
  .requiredOption("--contests <contests>", "Number of contests to create", parseInt)
  .requiredOption("--propositions <propositions>", "Number of propositions to create under each contest", parseInt)
  .requiredOption("--options <options>", "Number of options to create under each proposition", parseInt)
  .requiredOption("--variants <varaints>", "Number of variants to create under each proposition", parseInt)
  .parse()


const options = program.opts();

const rate = options.rate
const contests = options.contests
const propositionsPerContest = options.propositions
const optionsPerProposition = options.options
const variantsPerProposition = options.variants

console.log("🚀 Warming up to generate load at %s tps", rate)

// The input use to generate the load.
const loadToGenerateInput = {
  contests,
  propositionsPerContest,
  optionsPerProposition,
  variantsPerProposition,
}


// Hard coded variables to be moved to env variables
const KAFKA_BROKERS = process.env.KAFKA_BROKERS
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID
const KAFKA_USERNAME = process.env.KAFKA_USERNAME
const KAFKA_PASSWORD = process.env.KAFKA_PASSWORD
const KAFKA_TOPIC = process.env.KAFKA_TOPIC


// Kafka Client
const setupKafka = () => {

  const kafkaClient = new KafkaClient({
    brokers: KAFKA_BROKERS?.split(",") || [],
    clientId: KAFKA_CLIENT_ID,
    mechanism: "scram-sha-512",
    password: KAFKA_USERNAME,
    username: KAFKA_PASSWORD,
  })

  return kafkaClient
}

const kafka = setupKafka()

const kafkaProducer = kafka.getClient().producer()

await kafkaProducer.connect()

const offeringsCount = getOfferingsByTypeCountToGenerate(loadToGenerateInput)

// Function used to generate mock data
const generateMockDataSet1 = generateMockOfferingsData(offeringsCount)
// Function used to send out the load
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const publishToKafka = async (arg) => {

  // console.log(`Producer will send message with key = ${arg.contestKey} and size = ${JSON.stringify(arg).length}`)
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
const publishToKafkaAnother = async (arg) => {

  // console.log(`Producer will send message with key = ${arg.contestKey} and size = ${JSON.stringify(arg).length}`)
  try {

    await kafkaProducer.send({
      acks: 0,
      topic: "gk.test.topic2.another",
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

const OTHER_RATE = 15_000
const result = await loadGeneratorMulti({ rate }, [generateMockDataSet1()], publishToKafka)

// Generate load and execute the async task like publishing to Kafka

const timeTakenToGenerate = result.metrics.endTimeMs - result.metrics.startTimeMs

console.log("🏁 Finished load generation of offer messages")

console.log("👋 Printing stats and exiting")
console.log("+++++++++++++++++++++++++++++++++++++++++++")
console.log("+ Total offerings generated = %s ", result.metrics.totalCount)
console.log("+ Total Time                = %s ms", (timeTakenToGenerate))
console.log("+ Expected rate             = %s", rate)
console.log("+ Actual rate               = %s", result.metrics.totalCount / (timeTakenToGenerate) * 1000)
console.log("+++++++++++++++++++++++++++++++++++++++++++")


process.exit()