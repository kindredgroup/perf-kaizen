import { EachBatchPayload } from "kafkajs"
import { TopicConsumerHandler } from "../../kafka/consumers/handler.js"
import { deserializeOfferMessageByType, groupMessagesByMessageType } from "../utils.js"
import { OfferingMessageType } from "../../types.js"
import { Contest, Market, OptionChanged, OutcomeChanged, Proposition, PropositionChanged, PropositionDb, VariantChanged } from "../../domain/models.js"
import { DatastoreService } from "../../datastore/core.js"
import { logger } from "@perf-kaizen/logger/build/logger.js"
import { convertMarketToDomain, convertPropositionToDomain } from "../../domain/converters/kafka-to-internal.js"
import { createLookupKey } from "../../utils.js"
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
        proposition = await this.datastoreService.getProposition(pc.contestKey, pc.propositionKey)
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
        proposition = await this.datastoreService.getProposition(oc.contestKey, oc.propositionKey)
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
        proposition = await this.datastoreService.getProposition(vc.contestKey, vc.propositionKey)
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
        proposition = await this.datastoreService.getProposition(oc.contestKey, oc.propositionKey)
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
    await this.processContests(offerContests)

    //  - Upsert Proposition
    const offerPropositions = deserializerForMessageTypeFn<Proposition>(OfferingMessageType.Proposition)
    await this.processPropositions(offerPropositions)

    //  - Upsert Market
    const offerMarket = deserializerForMessageTypeFn<Market>(OfferingMessageType.Market)
    await this.processMarkets(offerMarket)

    //  - Upsert PropositionChanged
    const offerPropositionChanged = deserializerForMessageTypeFn<PropositionChanged>(OfferingMessageType.PropositionChanged)
    await this.processPropositionsChanged(offerPropositionChanged)

    //  - Upsert OptionChanged
    const offerOptionsChanged = deserializerForMessageTypeFn<OptionChanged>(OfferingMessageType.OptionChanged)
    await this.processOptionsChanged(offerOptionsChanged)

    //  - Upsert VariantChanged
    const offerVariantsChanged = deserializerForMessageTypeFn<VariantChanged>(OfferingMessageType.VariantChanged)
    await this.processVariantsChanged(offerVariantsChanged)

    //  - Upsert OutcomeChanged
    const offerOutcomesChanged = deserializerForMessageTypeFn<OutcomeChanged>(OfferingMessageType.OutcomeChanged)
    await this.processVariantsChanged(offerOutcomesChanged)
    //  - Upsert PriceChanged
    //  - Upsert results

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