import type {
  EachBatchHandler, EachBatchPayload,
} from "kafkajs"

export interface TopicConsumerHandler {
  handleBatch(payload: EachBatchPayload): Promise<void>
}

export class ConsumerHandler{
  handlers: Map<string, TopicConsumerHandler>
  constructor( handlers: Map<string, TopicConsumerHandler>){
    this.handlers = handlers
  }

  batchHandler: EachBatchHandler = async payload => {
    const topic = payload.batch.topic

    const topicHandler = this.handlers.get(topic)
    if (!topicHandler){
      throw new Error(`No handlers found for topic ${ topic }`)
    } else {
      await topicHandler.handleBatch(payload)
    }

    await payload.commitOffsetsIfNecessary({
      topics: [ {
        partitions: [ {
          offset:    payload.batch.lastOffset(),
          partition: payload.batch.partition,
        } ],
        topic: payload.batch.topic,
      } ],
    })
  }
}
