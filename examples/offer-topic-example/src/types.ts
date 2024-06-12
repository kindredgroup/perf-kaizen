import { Contest, Market, OptionChanged, OutcomeChanged, PriceChanged, Proposition, PropositionChanged, Result, VariantChanged } from "./domain/models.js"

export interface OfferingLoadGeneratorParams {
  contests: number
  propositionsPerContest: number
  optionsPerProposition: number
  variantsPerProposition: number
}

export type LoadGeneratorPerContestInputCount = {
  [K in Exclude<OfferingMessageType, OfferingMessageType.Contest>]: number
}

export type OfferingLoadGeneratorCount = {
  [OfferingMessageType.Contest]: {
    count: number,
    children: LoadGeneratorPerContestInputCount
  }
}

export interface OfferMessageGenerated {
  Contest: Contest
  Proposition: Proposition
  PropositionChanged: PropositionChanged
  OptionChanged: OptionChanged
  VariantChanged: VariantChanged
  OutcomeChanged: OutcomeChanged
  Market: Market
  MarketPriceChanged: PriceChanged
  OutcomeResult: Result
}

export interface MockDataGeneratorReturnType<T extends string, K extends {[key in T]: object}> {
  type: T
  payload: K[T]
}


export enum OfferingMessageType {
  // Any major set of changes with Contest (Initial or Updates)
  Contest = "Contest",
  // Any major set of changes with Proposition (Initial or Updates)
  Proposition = "Proposition",
  // Any small / minor set of changes with Proposition (Updates only)
  PropositionChanged = "PropositionChanged",
  // Any set of changes with Option (Updates only)
  OptionChanged = "OptionChanged",
  // Any set of changes with Variant (Updates only)
  VariantChanged = "VariantChanged",
  // Any set of changes for outcome, corresponding option / variant for all markets belonging to defined contest and proposition
  OutcomeChanged = "OutcomeChanged",
  // Any set of changes with Prices (Updates only)
  MarketPriceChanged = "MarketPriceChanged",
  // Any major set of changes for Market
  Market = "Market",
  // Out Result
  OutcomeResult = "OutcomeResult",
}

