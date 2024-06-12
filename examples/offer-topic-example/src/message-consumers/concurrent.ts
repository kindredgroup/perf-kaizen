// import type {
//   EachBatchPayload, KafkaMessage,
// } from "kafkajs"
// import {
//   deserializeOfferMessageByType, groupMessagesByMessageType,
// } from "./kafka/batch-handlers/utils"
// import { OfferingMessageType } from "./kafka/utils/core"
// import { apmSpan } from "@bet-domain-lib/apm/decorators"
// import type Logger from "@bet-domain-lib/logging/logger"
// import type { ContestService } from "@chimera-market-mirror/domain/contest-service"
// import type { Proposition } from "@chimera-market-mirror/model/domain/proposition"
// import type { PropositionService } from "@chimera-market-mirror/domain/proposition-service"
// import type { MarketService } from "@chimera-market-mirror/domain/market-service"
// import type { TopicConsumerHandler } from "./kafka/consumers/handler"
// import { Contest as ContestV1 } from "@bet-domain-lib/models/offer/offer_domain/contest/1.0"
// import { RelatedContests as RelatedContestsV1 } from "@bet-domain-lib/models/offer/offer_domain/related_contests/1.0"
// import { Proposition as PropositionV1 } from "@bet-domain-lib/models/offer/offer_domain/proposition/1.0"
// import { PropositionChanged as PropositionChangedV1 } from "@bet-domain-lib/models/offer/offer_domain/proposition_changed/1.0"
// import { VariantChanged as VariantChangedV1 } from "@bet-domain-lib/models/offer/offer_domain/variant_changed/1.0"
// import { OptionChanged as OptionChangedV1 } from "@bet-domain-lib/models/offer/offer_domain/option_changed/1.0"
// import { OutcomeChanged as OutcomeChangedV1 } from "@bet-domain-lib/models/offer/offer_domain/outcome_changed/1.0"
// import { OutcomeResult as OutcomeResultV1 } from "@bet-domain-lib/models/offer/offer_domain/outcome_result/1.0"
// import { Market as MarketV1 } from "@bet-domain-lib/models/offer/offer_domain/market/1.0"
// import { MarketPriceChanged as MarketPriceChangedV1 } from "@bet-domain-lib/models/offer/offer_domain/market_price_changed/1.0"
// import {
//   createMarketToUpdateFromNode,
//   createPropositionToUpdateFromNode,
// } from "../../core/contest-as-tree"
// import { MarketRn } from "@bet-domain-lib/models/rn/1.0"
// import type { Market } from "@chimera-market-mirror/model/domain/market"
// import type { ContestTreeRootNode } from "@chimera-market-mirror/simplified/core/type"
// import {
//   createLookupKey, recursiveNestedMap,
// } from "@chimera-market-mirror/simplified/core/utils"
// import {
//   buildContestNodeFromV1Objects, buildMarketNodeUnderContestKey, buildPropositionNodeUnderContestKey,
// } from "@chimera-market-mirror/simplified/core/converters/v1-to-domain"

// export class OfferConsumerHandler implements TopicConsumerHandler{
//   contestService: ContestService
//   log: Logger
//   marketService: MarketService
//   propositionService: PropositionService
//   constructor(log: Logger, contestService: ContestService, propositionService: PropositionService, marketService: MarketService){
//     this.log = log
//     this.contestService = contestService
//     this.propositionService = propositionService
//     this.marketService = marketService
//   }

//   @apmSpan()
//   createContestTreeFromBatchMessages(messages: KafkaMessage[]): ContestTreeRootNode[]{
//     // -----------------------------------------------------------------------------
//     // ------------------------- Grouping by messageType ---------------------------
//     // -----------------------------------------------------------------------------
//     const messagesGrouped = groupMessagesByMessageType<OfferingMessageType>(messages)

//     // ----------------------------------------------------------------------------------
//     // ----------------- Grouping each messageType further by contestKey ----------------
//     // ----------------------------------------------------------------------------------
//     const deserializerForMessageTypeFn = deserializeOfferMessageByType(messagesGrouped)
//     // ---- Grouping Contest
//     const offerContests: Map<string, ContestV1> = recursiveNestedMap(deserializerForMessageTypeFn(OfferingMessageType.Contest, ContestV1))([ { groupingKey: "contestKey", groupingStrategy: "latest" } ])

//     const offerRelatedContests: Map<string, RelatedContestsV1> = recursiveNestedMap(deserializerForMessageTypeFn(OfferingMessageType.RelatedContests, RelatedContestsV1))([ { groupingKey: "contestKey", groupingStrategy: "latest" } ])

//     // ---- Grouping Proposition related items

//     const offerPropositions: Map<string, Map<string, PropositionV1>> = recursiveNestedMap(deserializerForMessageTypeFn(OfferingMessageType.Proposition, PropositionV1))([ { groupingKey: "contestKey" }, { groupingKey: "propositionKey", groupingStrategy: "latest" } ])

//     const offerPropositionsChanged: Map<string, Map<string, PropositionChangedV1>> = recursiveNestedMap(deserializerForMessageTypeFn(OfferingMessageType.PropositionChanged, PropositionChangedV1))([ { groupingKey: "contestKey" }, { groupingKey: "propositionKey", groupingStrategy: "merge" } ])

//     const offerOptionsChanged: Map<string, Map<string, Map<string, OptionChangedV1>>> = recursiveNestedMap(deserializerForMessageTypeFn(OfferingMessageType.OptionChanged, OptionChangedV1))([ { groupingKey: "contestKey" }, { groupingKey: "propositionKey" }, { groupingKey: "optionKey", groupingStrategy: "merge" } ])

//     const offerVariantsChanged: Map<string, Map<string, Map<string, VariantChangedV1>>> = recursiveNestedMap(deserializerForMessageTypeFn(OfferingMessageType.VariantChanged, VariantChangedV1))([ { groupingKey: "contestKey" }, { groupingKey: "propositionKey" }, { groupingKey: "variantKey", groupingStrategy: "merge" } ])

//     const offerOutcomesChanged: Map<string, Map<string, Map<string, OutcomeChangedV1>>> = recursiveNestedMap(deserializerForMessageTypeFn(OfferingMessageType.OutcomeChanged, OutcomeChangedV1))([ { groupingKey: "contestKey" }, { groupingKey: "propositionKey" }, { groupingKey: outcome => createLookupKey([ outcome.optionKey, outcome.variantKey ]), groupingStrategy: "latest" } ])

//     const offerResultsChanged: Map<string, Map<string, Map<string, OutcomeResultV1>>> = recursiveNestedMap(deserializerForMessageTypeFn(OfferingMessageType.OutcomeResult, OutcomeResultV1))([ { groupingKey: "contestKey" }, { groupingKey: "propositionKey" }, { groupingKey: "provider", groupingStrategy: "latest" } ])

//     // ---- Grouping Market related items
//     const offerMarketsChanged: Map<string, Map<string, MarketV1>> = recursiveNestedMap(deserializerForMessageTypeFn(OfferingMessageType.Market, MarketV1))([ { groupingKey: "contestKey" }, { groupingKey: k => new MarketRn(k.contestKey, k.propositionKey, k.tenantKey).toString(), groupingStrategy: "latest" } ])

//     const offerMarketPricesChanged: Map<string, Map<string, MarketPriceChangedV1>> = recursiveNestedMap(deserializerForMessageTypeFn(OfferingMessageType.MarketPriceChanged, MarketPriceChangedV1))([ { groupingKey: "contestKey" }, { groupingKey: k => new MarketRn(k.contestKey, k.propositionKey, k.tenantKey).toString(), groupingStrategy: "latest" } ])

//     const contestKeys = new Set([
//       ...offerContests.keys(),
//       ...offerRelatedContests.keys(),
//       ...offerPropositions.keys(),
//       ...offerPropositionsChanged.keys(),
//       ...offerOptionsChanged.keys(),
//       ...offerVariantsChanged.keys(),
//       ...offerOutcomesChanged.keys(),
//       ...offerResultsChanged.keys(),
//       ...offerMarketsChanged.keys(),
//       ...offerMarketPricesChanged.keys(),
//     ])

//     // ----------------------------------------------------------------------------------
//     // -------------------------- Create contest tree nodes -----------------------------
//     // ----------------------------------------------------------------------------------
//     const contestTreeRootNode: ContestTreeRootNode[] = [ ...contestKeys ].map(contestKey => {
//       const contestRelatedContests = offerRelatedContests.get(contestKey)
//       const contestPropositions = offerPropositions.get(contestKey)
//       const contestPropositionsChanged = offerPropositionsChanged.get(contestKey)
//       const contestOptionsChanged = offerOptionsChanged.get(contestKey)
//       const contestVariantsChanged = offerVariantsChanged.get(contestKey)
//       const contestOutcomesChanged = offerOutcomesChanged.get(contestKey)
//       const contestResultsChanged = offerResultsChanged.get(contestKey)

//       const contestMarketsChanged = offerMarketsChanged.get(contestKey)
//       const contestMarketPricesChanged = offerMarketPricesChanged.get(contestKey)

//       const propositionKeys = new Set([
//         ...contestPropositions?.keys() || [],
//         ...contestPropositionsChanged?.keys() || [],
//         ...contestOptionsChanged?.keys() || [],
//         ...contestVariantsChanged?.keys() || [],
//         ...contestOutcomesChanged?.keys() || [],
//         ...contestResultsChanged?.keys() || [],
//       ])

//       const marketRns = new Set([
//         ...contestMarketsChanged?.keys() || [],
//         ...contestMarketPricesChanged?.keys() || [],
//       ])

//       const buildPropositionNodeFn = buildPropositionNodeUnderContestKey(contestKey, contestPropositions, contestPropositionsChanged, contestVariantsChanged, contestOptionsChanged, contestOutcomesChanged, contestResultsChanged)
//       const buildMarketNodeFn = buildMarketNodeUnderContestKey(contestKey, contestMarketsChanged, contestMarketPricesChanged)

//       const contestNode = buildContestNodeFromV1Objects(
//         offerContests.get(contestKey),
//         contestRelatedContests,
//         buildPropositionNodeFn,
//         buildMarketNodeFn,
//       )(contestKey, [ ...propositionKeys ], [ ...marketRns ])

//       return contestNode
//     })

//     return contestTreeRootNode
//   }

//   @apmSpan()
//   async handleBatch(payload: EachBatchPayload): Promise<void>{
//     try{
//       const {
//         batch,
//         resolveOffset,
//         heartbeat,
//       } = payload
//       const contestTree = this.createContestTreeFromBatchMessages(batch.messages)

//       const promises = contestTree.map(m => this.processContestTree(m))
//       await Promise.all(promises)

//       batch.messages.forEach(message => resolveOffset(message.offset))
//       await heartbeat()
//     } catch (error){
//       this.log.error("Failed to consumer message:", payload.batch.messages)
//       this.log.error("Due to : ", error)
//       throw error
//     }
//   }

//   @apmSpan()
//   async processContestTree(contestTreeNode: ContestTreeRootNode): Promise<void>{
//     const { contest, relatedContests } = contestTreeNode

//     if (contest || relatedContests){
//       if(contest){
//         const toBeUpsert = {
//           ...contest,
//           ...(relatedContests && { relatedContests: relatedContests.relatedContestKeys }),
//         }

//         await this.contestService.upsertContestsByContestKeysAndEntities([ toBeUpsert ])
//       } else{
//         const toBeUpsert = {
//           contestKey:         relatedContests!.contestKey,
//           relatedContestKeys: relatedContests!.relatedContestKeys,
//         }
//         await this.contestService.updateRelatedContests([ toBeUpsert ])
//       }
//     }
//     const propositionKeysForDb = contestTreeNode.propositions.map(m => ({ contestKey: contestTreeNode.contestKey, propositionKey: m.propositionKey }))

//     // propositions on db
//     const propositionsOnDb = await this.propositionService.getPropositions(propositionKeysForDb as any)

//     const propositionOnDbAsMap = new Map(propositionsOnDb.map(p => [ p.propositionKey, p ]))

//     const propositionsToUpsert = contestTreeNode.propositions
//       .map(offerProposition => createPropositionToUpdateFromNode(offerProposition, propositionOnDbAsMap.get(offerProposition.propositionKey)))
//       .filter(p => !!p) as Proposition[]

//     if (propositionsToUpsert.length){

//       // Upsert all propositions in one go using multi row insert
//       // await this.propositionService.upsertPropositions(propositionsToUpsert)
//       // -----------------

//       // Upsert individually/concurrently all of the propositions under contest
//       const propositionPromises = propositionsToUpsert.map(p => this.propositionService.upsert(p as Proposition))
//       await Promise.all(propositionPromises)
//     }

//     // Market updates
//     const marketRns = contestTreeNode.markets.map(m => MarketRn.parse(m.marketRn))

//     const marketsOnDb = await this.marketService.getMarketsWithIds(marketRns)

//     const marketsToUpsert = contestTreeNode.markets.reduce((acc, market) => {
//       const marketCombined = createMarketToUpdateFromNode(market, marketsOnDb.get(market.marketRn)?.market)
//       if (marketCombined){
//         return [ ...acc, marketCombined ]
//       }
//       return acc
//     }, [] as Market[])

//     if (marketsToUpsert.length){
//       await this.marketService.upsertMarkets(marketsToUpsert)
//     }
//   }
// }
