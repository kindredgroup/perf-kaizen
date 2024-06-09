import type {
  IHeaders, KafkaMessage,
} from "kafkajs"


export type MessageHeaders<T> = IHeaders & {
  readonly correlationId?: string
  readonly majorVersion?: string
  readonly messageType?: T
  readonly producer?: string
}

export const getMessageHeaders = <T>(message: KafkaMessage):MessageHeaders<T> => {
  return message.headers as MessageHeaders<T>
}
