import type * as KafkaJS from "kafkajs"

export type ClientConfiguration = KafkaJS.KafkaConfig & {
  readonly brokers: string[]
  readonly clientId: string
  readonly mechanism: keyof KafkaJS.SASLMechanismOptionsMap
  readonly password: string
  readonly port?: string
  readonly username: string
}
