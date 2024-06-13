import { EachBatchPayload } from "kafkajs"
import { TopicConsumerHandler } from "../kafka/consumers/handler.js"
import { deserializeOfferMessageByType, groupMessagesByMessageType, printMetrics } from "./utils.js"
import { OfferingMessageType } from "../types.js"
import { Contest, Market, OptionChanged, OutcomeChanged, Proposition, PropositionChanged, PropositionDb, VariantChanged } from "../domain/models.js"
import { DatastoreService } from "../datastore/core.js"
import { logger } from "@perf-kaizen/logger/build/logger.js"
import { convertMarketToDomain, convertPropositionToDomain } from "../domain/converters/kafka-to-internal.js"
import { createLookupKey } from "../utils.js"
import _ from "lodash"

export class SequentialMessageHandler implements TopicConsumerHandler{
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

  async processContests(contests: Contest[]){
    const contestPromises = contests.map(c => this.datastoreService.insertContest(c))
    await Promise.all(contestPromises)
  }
  async processPropositions(propositions: Proposition[]){
    const contestPromises = propositions.map(p => this.datastoreService.insertProposition(convertPropositionToDomain(p)))
    await Promise.all(contestPromises)
  }
  async processMarkets(markets: Market[]){
    const marketPromises = markets.map(m => this.datastoreService.insertMarket(convertMarketToDomain(m)))
    await Promise.all(marketPromises)
  }
  async processPropositionsChanged(propositionsChanged: PropositionChanged[]){
    const propositionChangedPromises =  []

    const propositionMap = new Map<string, PropositionDb>()
    for (const pc of propositionsChanged) {
      const lookupKey = createLookupKey([pc.contestKey, pc.propositionKey])

      // look up for propositions already fetched and stored in Map
      let proposition = propositionMap.get(lookupKey)

      // If not found locally, get from datastore.
      if (!proposition) {
        proposition = await this.datastoreService.getPropositionWithCache(pc.contestKey, pc.propositionKey)
        propositionMap.set(lookupKey,proposition)
      }

      // If not found on local and datastore, ignore that proposition changed message
      if (!proposition) {
        continue
      }

      const propositionToUpdate = _.merge({}, proposition, pc)

      propositionChangedPromises.push(this.datastoreService.insertProposition(propositionToUpdate))
    }

    await Promise.all(propositionChangedPromises)
  }

  async processOptionsChanged(optionsChanged: OptionChanged[]){
    const optionsChangedPromises =  []

    const propositionMap = new Map<string, PropositionDb>()
    for (const oc of optionsChanged) {
      const lookupKey = createLookupKey([oc.contestKey, oc.propositionKey])

      // look up for propositions already fetched and stored in Map
      let proposition = propositionMap.get(lookupKey)

      // If not found locally, get from datastore.
      if (!proposition) {
        proposition = await this.datastoreService.getPropositionWithCache(oc.contestKey, oc.propositionKey)
        propositionMap.set(lookupKey,proposition)
      }

      // If not found on local and datastore, ignore that proposition changed message
      if (!proposition) {
        continue
      }

      const options = {...proposition.options}
      const option = options[oc.optionKey] || {}
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {contestKey, propositionKey, ...rest} = oc
      const propositionToUpdate = {
        ...proposition,
        options: {
          ...options,
          [oc.optionKey]: _.merge({},option, rest)
        }

      } as PropositionDb
      // propositionToUpdate.options[oc.optionKey] = oc

      optionsChangedPromises.push(this.datastoreService.insertProposition(propositionToUpdate ))
    }

    await Promise.all(optionsChangedPromises)
  }
  async processVariantsChanged(variantsChanged: VariantChanged[]){
    const optionsChangedPromises =  []

    const propositionMap = new Map<string, PropositionDb>()
    for (const vc of variantsChanged) {
      const lookupKey = createLookupKey([vc.contestKey, vc.propositionKey])

      // look up for propositions already fetched and stored in Map
      let proposition = propositionMap.get(lookupKey)

      // If not found locally, get from datastore.
      if (!proposition) {
        proposition = await this.datastoreService.getPropositionWithCache(vc.contestKey, vc.propositionKey)
        propositionMap.set(lookupKey,proposition)
      }

      // If not found on local and datastore, ignore that proposition changed message
      if (!proposition) {
        continue
      }

      const variants = {...proposition.variants}
      const variant = variants[vc.variantKey] || {}
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {contestKey, propositionKey, ...rest} = vc
      const propositionToUpdate = {
        ...proposition,
        variants: {
          ...variants,
          [vc.variantKey]: _.merge({},variant, rest)
        }

      } as PropositionDb
      // propositionToUpdate.options[oc.optionKey] = oc

      optionsChangedPromises.push(this.datastoreService.insertProposition(propositionToUpdate ))
    }

    await Promise.all(optionsChangedPromises)
  }
  async processOutcomesChanged(outcomesChanged: OutcomeChanged[]){
    const optionsChangedPromises =  []

    const propositionMap = new Map<string, PropositionDb>()
    for (const oc of outcomesChanged) {
      const lookupKey = createLookupKey([oc.contestKey, oc.propositionKey])

      // look up for propositions already fetched and stored in Map
      let proposition = propositionMap.get(lookupKey)

      // If not found locally, get from datastore.
      if (!proposition) {
        proposition = await this.datastoreService.getPropositionWithCache(oc.contestKey, oc.propositionKey)
        propositionMap.set(lookupKey,proposition)
      }

      // If not found on local and datastore, ignore that proposition changed message
      if (!proposition) {
        continue
      }

      const outcomes = {...proposition.outcomes}
      const outcomeKey = createLookupKey([oc.optionKey, oc.variantKey])
      const outcome = outcomes[outcomeKey] || {}
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {contestKey, propositionKey, ...rest} = oc
      const propositionToUpdate = {
        ...proposition,
        outcomes: {
          ...outcomes,
          [outcomeKey]: _.merge({},outcome, rest)
        }

      } as PropositionDb
      // propositionToUpdate.options[oc.optionKey] = oc

      optionsChangedPromises.push(this.datastoreService.insertProposition(propositionToUpdate ))
    }

    await Promise.all(optionsChangedPromises)
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
    const messagesGrouped = groupMessagesByMessageType<OfferingMessageType>(messages)
    // For each message type
    const deserializerForMessageTypeFn = deserializeOfferMessageByType(messagesGrouped)

    //  - Upsert Contest
    const offerContests = deserializerForMessageTypeFn<Contest>(OfferingMessageType.Contest)
    const totalContest = offerContests.length
    const contestProcessingStartMs = performance.now()
    await this.processContests(offerContests)
    const contestProcessingEndMs = performance.now()

    //  - Upsert Proposition
    const offerPropositions = deserializerForMessageTypeFn<Proposition>(OfferingMessageType.Proposition)
    const totalProposition = offerPropositions.length
    const propositionProcessingStartMs = performance.now()
    await this.processPropositions(offerPropositions)
    const propositionProcessingEndMs = performance.now()


    //  - Upsert PropositionChanged
    const offerPropositionsChanged = deserializerForMessageTypeFn<PropositionChanged>(OfferingMessageType.PropositionChanged)
    const totalPropositionsChanged = offerPropositionsChanged.length
    const propositionsChangedProcessingStartMs = performance.now()
    await this.processPropositionsChanged(offerPropositionsChanged)
    const propositionsChangedProcessingEndMs = performance.now()

    //  - Upsert OptionChanged
    const offerOptionsChanged = deserializerForMessageTypeFn<OptionChanged>(OfferingMessageType.OptionChanged)
    const totalOptionsChanged = offerOptionsChanged.length
    const optionsChangedProcessingStartMs = performance.now()
    await this.processOptionsChanged(offerOptionsChanged)
    const optionsChangedProcessingEndMs = performance.now()

    //  - Upsert VariantChanged
    const offerVariantsChanged = deserializerForMessageTypeFn<VariantChanged>(OfferingMessageType.VariantChanged)
    const totalVariantsChanged = offerVariantsChanged.length
    const variantsChangedProcessingStartMs = performance.now()
    await this.processVariantsChanged(offerVariantsChanged)
    const variantsChangedProcessingEndMs = performance.now()

    //  - Upsert OutcomeChanged
    const offerOutcomesChanged = deserializerForMessageTypeFn<OutcomeChanged>(OfferingMessageType.OutcomeChanged)
    const totalOutcomesChanged = offerOutcomesChanged.length
    const outcomesChangedProcessingStartMs = performance.now()
    await this.processOutcomesChanged(offerOutcomesChanged)
    const outcomesChangedProcessingEndtMs = performance.now()

    //  - Upsert results

    //  - Upsert Market
    // const offerMarket = deserializerForMessageTypeFn<Market>(OfferingMessageType.Market)
    // await this.processMarkets(offerMarket)
    //  - Upsert PriceChanged

    logger.info("+++++++++")
    logger.info("Processed partition=%s with below stats per messageType", payload.batch.partition)
    printMetrics(OfferingMessageType.Contest, totalContest, contestProcessingStartMs, contestProcessingEndMs)
    printMetrics(OfferingMessageType.Proposition, totalProposition, propositionProcessingStartMs, propositionProcessingEndMs)
    printMetrics(OfferingMessageType.PropositionChanged, totalPropositionsChanged, propositionsChangedProcessingStartMs, propositionsChangedProcessingEndMs)
    printMetrics(OfferingMessageType.OptionChanged, totalOptionsChanged, optionsChangedProcessingStartMs, optionsChangedProcessingEndMs)
    printMetrics(OfferingMessageType.VariantChanged, totalVariantsChanged, variantsChangedProcessingStartMs, variantsChangedProcessingEndMs)
    printMetrics(OfferingMessageType.OutcomeChanged, totalOutcomesChanged, outcomesChangedProcessingStartMs, outcomesChangedProcessingEndtMs)
    logger.info("+++++++++")

    this.metrics.endTimeMs = performance.now()

    // Resolve the Kafka offsets
    payload.batch.messages.forEach(message => payload.resolveOffset(message.offset))
    // Send heartbeat to Kafka
    await payload.heartbeat()

    // Clear the cache
    this.datastoreService.clearPropositionCache()

    const timeTakenToGenerate = this.metrics.endTimeMs - this.metrics.startTimeMs
    logger.info("Total offerings processed = %s in partition", this.metrics.total)
    logger.info("Time taken to process the data = %s ms", (timeTakenToGenerate))
    logger.info("Throughput = %s", this.metrics.total / (timeTakenToGenerate) * 1000)

  }

}