import { loadGeneratorMulti } from "@perf-kaizen/load-generator/build/load-generator.js"
import { generateMockOfferingsData } from "offer-topic-example/build/mocks.js"
import { getOfferingsByTypeCountToGenerate } from "offer-topic-example/build/utils.js"
import { KafkaClient } from "offer-topic-example/build/kafka/kafka-client.js"

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

const KAFKA_BROKERS = process.env.KAFKA_BROKERS
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID
const KAFKA_USERNAME = process.env.KAFKA_USERNAME
const KAFKA_PASSWORD = process.env.KAFKA_PASSWORD


// First generator inputs
const FIRST_RATE = 8000
const FIRST_KAFKA_TOPIC = "gk.test.topic2"
const loadToGenerateInput = {
  contests: 20,
  propositionsPerContest: 140,
  optionsPerProposition: 20,
  variantsPerProposition: 2,
}
console.log("🚀 Warming up to generate FIRST set of test at %s tps", FIRST_RATE)

// Second generator inputs
const SECOND_RATE = 15_000
const SECOND_DURATION = 5
const SECOND_KAFKA_TOPIC = "gk.test.topic2.another"
const secondTotalCount = SECOND_RATE * SECOND_DURATION
console.log("🚀🚀 Warming up to generate SECOND set of test at %s tps", SECOND_RATE)

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
const generateMockDataSet2 = generateMockData(secondTotalCount)
// Function used to send out the load
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const publishToKafka = async (arg) => {

  // console.log(`Producer will send message with key = ${arg.contestKey} and size = ${JSON.stringify(arg).length}`)
  try {

    await kafkaProducer.send({
      acks: 0,
      topic: FIRST_KAFKA_TOPIC,
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
      topic: SECOND_KAFKA_TOPIC,
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

// Generate + Publish both
const [result, anotherResult] = await Promise.all([
  loadGeneratorMulti({ rate: FIRST_RATE }, [generateMockDataSet1()], publishToKafka),
  loadGeneratorMulti({ rate: SECOND_RATE }, [generateMockDataSet2()], publishToKafkaAnother)
])

// Generate load and execute the async task like publishing to Kafka
{

  const timeTakenToGenerate = result.metrics.endTimeMs - result.metrics.startTimeMs

  console.log("🏁 Finished load generation of offer messages")

  console.log("👋 Printing stats and exiting")
  console.log("+++++++++++++++++++++++++++++++++++++++++++")
  console.log("+ Total offerings generated = %s ", result.metrics.totalCount)
  console.log("+ Total Time                = %s ms", (timeTakenToGenerate))
  console.log("+ Expected rate             = %s", FIRST_RATE)
  console.log("+ Actual rate               = %s", result.metrics.totalCount / (timeTakenToGenerate) * 1000)
  console.log("+++++++++++++++++++++++++++++++++++++++++++")
}
{

  const timeTakenToGenerate = anotherResult.metrics.endTimeMs - anotherResult.metrics.startTimeMs

  console.log("🏁 Finished load generation of mock data")

  console.log("👋 Printing stats and exiting")
  console.log("+++++++++++++++++++++++++++++++++++++++++++")
  console.log("+ Total offerings generated = %s ", anotherResult.metrics.totalCount)
  console.log("+ Total Time                = %s ms", (timeTakenToGenerate))
  console.log("+ Expected rate             = %s", SECOND_RATE)
  console.log("+ Actual rate               = %s", anotherResult.metrics.totalCount / (timeTakenToGenerate) * 1000)
  console.log("+++++++++++++++++++++++++++++++++++++++++++")
}


process.exit()