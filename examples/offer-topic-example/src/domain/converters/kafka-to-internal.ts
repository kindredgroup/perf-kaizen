import { groupRelatedAsMap } from "../../message-consumers/utils.js";
import { convertMapToObject, createLookupKey } from "../../utils.js";
import { Market, MarketDb, Option, Outcome, Proposition, PropositionDb, Variant } from "../models.js";


export const convertPropositionToDomain = (proposition: Proposition): PropositionDb => {
  const options = convertMapToObject(groupRelatedAsMap<Option>("optionKey","latest")(proposition.options))
  const variants = convertMapToObject(groupRelatedAsMap<Variant>("variantKey","latest")(proposition.variants))
  const outcomes = convertMapToObject(groupRelatedAsMap<Outcome>(outcome => createLookupKey([outcome.optionKey,outcome.variantKey]),"latest")(proposition.outcomes))
  return {
    ...proposition,
    options,
    variants,
    outcomes
  }
}

export const convertMarketToDomain = (market: Market): MarketDb => {
  return {
    ...market,
    prices: {}
  }
}