/**
 * An example on how to generate a simple
 */
import { loadGeneratorMulti } from "@perf-kaizen/load-generator/build/load-generator.js"
import { KafkaClient } from "offer-topic-example/build/kafka/kafka-client.js"

import { program } from "commander"

function generateMockData(count) {
  console.log("Total mock data to create = %s", count)
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  return async function* g() {

    // Contest Loop
    for (let ci = 0; ci < count; ci++) {
      yield {
        type: "Some_message", payload: {
          value: ci,
          name: `Name ${ci}`
        }
      }
    }
  }
}

program.description("Generate the offer messages and publish to kafka at a specified rate")
  .requiredOption("-r, --rate <rate>", "Rate (tps) for producing offer messages", parseInt)
  .requiredOption("--duration <duration>", "Duration in seconds", parseInt)
  .parse()


const options = program.opts();

const rate = options.rate
const duration = options.duration

const totalCount = rate * duration

console.log("🚀 Warming up to generate load at %s tps", rate)


// Hard coded variables to be moved to env variables
const KAFKA_BROKERS = process.env.KAFKA_BROKERS
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID
const KAFKA_USERNAME = process.env.KAFKA_USERNAME
const KAFKA_PASSWORD = process.env.KAFKA_PASSWORD
const KAFKA_TOPIC = "gk.simple.generator.topic"


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

// Function used to generate mock data
const generateMockDataSet1 = generateMockData(totalCount)
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


// Generate load and execute the async task like publishing to Kafka
const result = await loadGeneratorMulti({ rate }, [generateMockDataSet1()], publishToKafka)




const timeTakenToGenerate = result.metrics.endTimeMs - result.metrics.startTimeMs

console.log("🏁 Finished load generation for simple load generation")

console.log("👋 Printing stats and exiting")
console.log("+++++++++++++++++++++++++++++++++++++++++++")
console.log("+ Total offerings generated = %s ", result.metrics.totalCount)
console.log("+ Total Time                = %s ms", (timeTakenToGenerate))
console.log("+ Expected rate             = %s", rate)
console.log("+ Actual rate               = %s", result.metrics.totalCount / (timeTakenToGenerate) * 1000)
console.log("+++++++++++++++++++++++++++++++++++++++++++")



process.exit()