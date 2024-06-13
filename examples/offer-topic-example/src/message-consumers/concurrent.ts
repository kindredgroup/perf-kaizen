import { EachBatchPayload, KafkaMessage } from "kafkajs"
import { TopicConsumerHandler } from "../kafka/consumers/handler.js"
import { deserializeOfferMessageByType, groupMessagesByKey, groupMessagesByMessageType, recursiveNestedMap } from "./utils.js"
import { Contest, OptionChanged, OutcomeChanged, Proposition, PropositionChanged, PropositionDb, VariantChanged } from "../domain/models.js"
import { DatastoreService } from "../datastore/core.js"
import { convertPropRelatedChangeToDomain, convertPropositionToDomain } from "../domain/converters/kafka-to-internal.js"
import { createLookupKey } from "../utils.js"
import _ from "lodash"
import { OfferingMessageType } from "../types.js"
import { logger } from "@perf-kaizen/logger/build/logger.js"

export class ConcurrentMessageHandler implements TopicConsumerHandler{
  private datastoreService: DatastoreService
  metrics: {
    total: number
    startTimeMs: number
    endTimeMs: number
  }
  constructor(datastoreService: DatastoreService){
    this.datastoreService = datastoreService
    this.metrics = {
      total:0,
      startTimeMs:0,
      endTimeMs:0
    }
  }

  async processByContestKey(contestKey: string, messages: KafkaMessage[]){

    const messagesGrouped = groupMessagesByMessageType<OfferingMessageType>(messages)

    const deserializerForMessageTypeFn = deserializeOfferMessageByType(messagesGrouped)

    // ---- Grouping Contest
    const offerContest = _.last(deserializerForMessageTypeFn<Contest>(OfferingMessageType.Contest))


    // ---- Grouping Proposition related items

    const offerPropositions: Map<string, Proposition> = recursiveNestedMap(
      deserializerForMessageTypeFn<Proposition>(OfferingMessageType.Proposition)
    )([ { groupingKey: "propositionKey", groupingStrategy: "latest" } ]) as Map<string, Proposition>


    // console.log(`For contest ${contestKey}, propositions size =${offerPropositions.size} `, offerPropositions)
    const offerPropositionsChanged: Map<string, PropositionChanged> = recursiveNestedMap(
      deserializerForMessageTypeFn<PropositionChanged>(OfferingMessageType.PropositionChanged)
    )([{ groupingKey: "propositionKey", groupingStrategy: "merge" } ]) as Map<string, PropositionChanged>

    const offerOptionsChanged: Map<string, Map<string, OptionChanged>> = recursiveNestedMap(
      deserializerForMessageTypeFn<OptionChanged>(OfferingMessageType.OptionChanged)
    )([{ groupingKey: "propositionKey" }, { groupingKey: "optionKey", groupingStrategy: "merge" } ]) as unknown as Map<string, Map<string, OptionChanged>>

    const offerVariantsChanged:  Map<string, Map<string, VariantChanged>> = recursiveNestedMap(
      deserializerForMessageTypeFn<VariantChanged>(OfferingMessageType.VariantChanged)
    )([{ groupingKey: "propositionKey" }, { groupingKey: "variantKey", groupingStrategy: "merge" }]) as unknown as Map<string, Map<string,VariantChanged>>

    const offerOutcomesChanged:  Map<string, Map<string, OutcomeChanged>> = recursiveNestedMap(
      deserializerForMessageTypeFn<OutcomeChanged>(OfferingMessageType.OutcomeChanged)
    )([  { groupingKey: "propositionKey" }, { groupingKey: outcome => createLookupKey([ outcome.optionKey, outcome.variantKey ]), groupingStrategy: "latest" } ]) as unknown as Map<string, Map<string, OutcomeChanged>>

    const propositionKeys = new Set([
      ...offerPropositions?.keys() || [],
      ...offerPropositionsChanged?.keys() || [],
      ...offerOptionsChanged?.keys() || [],
      ...offerVariantsChanged?.keys() || [],
      ...offerOutcomesChanged?.keys() || [],
    ])

    // Fetch all existing propositions
    const propositionsOnDb = await Promise.all([...propositionKeys].map(propKey => this.datastoreService.getProposition(contestKey, propKey)))
    const propositionOnDbFiltered = propositionsOnDb.filter(p=> !!p)
    const propositionOnDbAsMap = propositionOnDbFiltered.length > 0 ? new Map(propositionOnDbFiltered.map(p => [ p.propositionKey, p ])) : new Map()

    const combinedPropositionKeys = new Set([
      ...offerPropositions?.keys() || [],
      ...propositionOnDbAsMap?.keys() || [],
    ])

    const propositionsToInsert = new Map<string, PropositionDb>()

    for (const propositionKey of [...combinedPropositionKeys]) {
      const offerProposition = offerPropositions.get(propositionKey)
      const offerPropositionChanged = offerPropositionsChanged.get(propositionKey)
      const existingProposition = propositionOnDbAsMap.get(propositionKey)

      if (!offerProposition && !existingProposition){
        continue
      }

      const mergedProposition = _.merge(
        {},
        existingProposition || {},
        convertPropositionToDomain(offerProposition) || {},
        offerPropositionChanged || {},
      ) as PropositionDb

      // const optionChanged = offerOptionsChanged.get(propositionKey) || new Map()
      // const optionChangedToOption = [...optionChanged.entries()].reduce((acc,[key,oc])=> {
      //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
      //   const {contestKey, propositionKey, ...rest} = oc

      //   return {...acc, [key]: rest}
      // },{})

      // const variantChanged = offerVariantsChanged.get(propositionKey) || new Map()
      // const variantChangedToVariant = [...variantChanged.entries()].reduce((acc,[key,oc])=> {
      //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
      //   const {contestKey, propositionKey, ...rest} = oc

      //   return {...acc, [key]: rest}
      // },{})

      // const outcomeChanged = offerOutcomesChanged.get(propositionKey) || new Map()
      // const outcomeChangedToOutcome = [...outcomeChanged.entries()].reduce((acc,[key,oc])=> {
      //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
      //   const {contestKey, propositionKey, ...rest} = oc

      //   return {...acc, [key]: rest}
      // },{})

      // Convert Change related messages to Domain structure
      const optionsToUpdate = convertPropRelatedChangeToDomain(offerOptionsChanged.get(propositionKey), ["contestKey","propositionKey"])
      const variantsToUpdate = convertPropRelatedChangeToDomain(offerVariantsChanged.get(propositionKey), ["contestKey","propositionKey"])
      const outcomesToUpdate = convertPropRelatedChangeToDomain(offerOutcomesChanged.get(propositionKey), ["contestKey","propositionKey"])

      // Merge to the proposition structure
      mergedProposition.options = _.merge({}, mergedProposition.options,optionsToUpdate)
      mergedProposition.variants = _.merge({}, mergedProposition.variants,variantsToUpdate)
      mergedProposition.outcomes = _.merge({}, mergedProposition.outcomes,outcomesToUpdate)

      propositionsToInsert.set(propositionKey, mergedProposition)
    }

    if (offerContest) {
      await this.datastoreService.insertContest(offerContest)
    }
    const propositionPromises = [...propositionsToInsert.values()].map((p)=> this.datastoreService.insertProposition(p))

    await Promise.all(propositionPromises)

    // ---- Grouping Market related items
    // const offerMarketsChanged: Map<string, Market> = recursiveNestedMap(
    //   deserializerForMessageTypeFn<Market>(OfferingMessageType.Market)
    // )([ { groupingKey: "contestKey" }, { groupingKey: k => createLookupKey([k.contestKey, k.propositionKey]), groupingStrategy: "latest" } ])

  }

  async handleBatch(payload: EachBatchPayload) {
    if (this.metrics.startTimeMs === 0) {
      this.metrics.startTimeMs = performance.now()
    }
    const {batch: {messages}} = payload
    this.metrics.total+= messages.length
    // console.log("First message.... ", messages[0].value.toString())

    // For sequential

    // Group messages by message type
    const messagesGrouped = groupMessagesByKey(messages)
    // console.log("Messages grouped by key...", messagesGrouped)

    const messagesPerContestKeys = [...messagesGrouped.entries()]

    await Promise.all(messagesPerContestKeys.map(([key, msgs]) => this.processByContestKey(key, msgs)))

    this.metrics.endTimeMs = performance.now()

    // Resolve the Kafka offsets
    payload.batch.messages.forEach(message => payload.resolveOffset(message.offset))
    // Send heartbeat to Kafka
    await payload.heartbeat()

    const timeTakenToGenerate = this.metrics.endTimeMs - this.metrics.startTimeMs
    logger.info("Total offerings processed = %s ", this.metrics.total)
    logger.info("Time taken to process the data = %s ms", (timeTakenToGenerate))
    logger.info("Throughput = %s", this.metrics.total / (timeTakenToGenerate) * 1000)

  }

}