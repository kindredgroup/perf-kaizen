import { KafkaMessage } from "kafkajs"
import compose from "lodash/fp/compose.js"
import groupBy from "lodash/fp/groupBy.js"
import { MessageHeaders, getMessageHeaders } from "../kafka/utils/core.js"
import { OfferingMessageType } from "../types.js"
import forEach from "lodash/fp/forEach.js"
import last from "lodash/fp/last.js"
import map from "lodash/fp/map.js"
import _ from "lodash"
import { GroupingOption } from "./types.js"
import { logger } from "@perf-kaizen/logger/build/logger.js"

/**
 * Group the messages received in a batch by `messageType` header
 */
export const groupMessagesByMessageType = <T>(messages: KafkaMessage[]): Map<T, KafkaMessage[]> => compose(
  (k: [T, KafkaMessage[]][]) => new Map<T, KafkaMessage[]>(k),
  Object.entries,
  groupBy(getTopicMessageTypeFromHeader),
)(messages)

/**
 * Group the messages received in a batch by `messageType` header
 */
export const groupMessagesByKey = (messages: KafkaMessage[]): Map<string, KafkaMessage[]> => compose(
  (k: [string, KafkaMessage[]][]) => new Map<string, KafkaMessage[]>(k),
  Object.entries,
  groupBy((m: KafkaMessage) => m.key),
)(messages)

export const getMessagesByType = <T>(messages: Map<T, KafkaMessage[]>) => (type: T) => messages.get(type) || []

export const getMessageTypeFromHeader = (headers: MessageHeaders<OfferingMessageType>): string => {
  return headers?.messageType?.toString()
}

export const getTopicMessageTypeFromHeader = (message: KafkaMessage): string => {
  const result = compose(
    getMessageTypeFromHeader,
    getMessageHeaders,
  )(message)

  return result
}



export const recursiveNestedMap = <T extends object>(messages: T[]) => (recursiveGroupingOption: GroupingOption<T>[]):Map<string, T|T[]> => {

  const [ firstGroupOption, ...rest ] = recursiveGroupingOption

  const groupingStrategy = firstGroupOption.groupingStrategy || "concat"
  const groupedMessage = groupRelatedAsMap(firstGroupOption.groupingKey, groupingStrategy)(messages)

  const k = [ ...groupedMessage.entries() ].reduce((acc, [ key, changed ]) => {
    return {
      ...acc,
      [key]: rest.length > 0 && groupingStrategy === "concat" ? recursiveNestedMap(changed as T[])(rest) : changed,
    }
  }, {})

  return new Map(Object.entries(k)) as Map<string, typeof groupingStrategy extends "concat" ? T[]: T>
}


export const groupRelatedAsMap = <T extends object>(groupingKey: keyof T | ((item: T) => string), groupingStrategy: "concat" | "latest" | "merge" = "concat") => (messages: T[]): Map<string, typeof groupingStrategy extends "concat" ? T[] : T> => {
  const returnMap = new Map()
  compose(
    forEach(([ key, value = [] ]: [string, T[]]) => {
      const existingMapValue = returnMap.get(key) ?? []
      switch (groupingStrategy){
        case "latest":{
          const lastValue = last(value)
          if (lastValue){
            returnMap.set(key, lastValue)
          }
          break
        }
        case "merge":
          returnMap.set(key, _.merge({}, ...existingMapValue, ...value))
          break

        default:
          returnMap.set(key, [ ...existingMapValue, ...value ])
          break
      }
    }),
    Object.entries,
    groupBy(groupingKey),
  )(messages)

  return returnMap
}

export const deserializeFromKafkaMessage = <T>(message: KafkaMessage):T => {
  return  JSON.parse(message.value.toString()) as T
}

export const deserializeOfferMessageByType = (messagesMap: Map<OfferingMessageType, KafkaMessage[]>) => {
  const getOfferMessagesByType = getMessagesByType(messagesMap)

  return <T>(offerMessageType: OfferingMessageType): T[] => {
    const groupedRecord = compose(
      map<KafkaMessage,T>(deserializeFromKafkaMessage),
      getOfferMessagesByType,
    )(offerMessageType)

    return groupedRecord || []
  }
}

export const printMetrics = (messageType: OfferingMessageType, total: number, startTimeMs: number, endTimeMs: number) => {

  logger.info(`Processed ${total} messages of messageType=${messageType} at a rate=${total / (endTimeMs-startTimeMs) * 1000}`)
}


