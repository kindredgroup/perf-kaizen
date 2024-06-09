import KafkaJS from "kafkajs"
import { createLZ4Codec } from "./kafkajs-lz4/index.js"
import { logger } from "@perf-kaizen/logger/build/logger.js"
import { ClientConfiguration } from "./kafka-types.js"
const { CompressionCodecs, CompressionTypes } = KafkaJS

const defaultClientConfig = {
  // ssl: true,
  sasl: {
    mechanism: "scram-sha-512",
    password:  "",
    username:  "",
  },
}

/**
 * Allows to set up kafka config and based on it create kafka client
 */
export class KafkaClient{
  protected kafkaClient: KafkaJS.Kafka

  constructor(
    protected readonly config: ClientConfiguration,
  ){
    const { clientId, brokers, port, username, password, mechanism } = config

    const sasl = {
      mechanism,
      password,
      username,
    }
    const saslDefined = !!sasl.username && !!sasl.password

    const clientConfig = {
      ...defaultClientConfig,
      brokers: brokers.map(broker => `${ broker }:${ port }`).slice(0),
      clientId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sasl:    saslDefined ? sasl as any : undefined,
      // logLevel: logLevel.DEBUG
    }

    logger.info(`Kafka Client '${ clientId }' setting up...`)
    this.kafkaClient = new KafkaJS.Kafka(clientConfig)
    logger.info(`Kafka Client '${ clientId }' setup completed`)

    const lz4Codec = createLZ4Codec({ highCompression: true })
    CompressionCodecs[CompressionTypes.LZ4] = lz4Codec
  }

  getClient(): KafkaJS.Kafka{
    return this.kafkaClient
  }
}
