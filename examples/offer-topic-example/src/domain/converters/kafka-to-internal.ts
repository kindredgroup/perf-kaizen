import { groupRelatedAsMap } from "../../message-consumers/utils.js";
import { convertMapToObject, createLookupKey } from "../../utils.js";
import { Market, MarketDb, Option, Outcome, Proposition, PropositionDb, Variant } from "../models.js";
import _ from "lodash"


export const convertPropositionToDomain = (proposition: Proposition): PropositionDb => {
  const options = convertMapToObject(groupRelatedAsMap<Option>("optionKey","latest")(proposition?.options ||[ ]))
  const variants = convertMapToObject(groupRelatedAsMap<Variant>("variantKey","latest")(proposition?.variants || []))
  const outcomes = convertMapToObject(groupRelatedAsMap<Outcome>(outcome => createLookupKey([outcome.optionKey,outcome.variantKey]),"latest")(proposition?.outcomes || []))
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

export const convertPropRelatedChangeToDomain = <T extends object,K>(changesMap: Map<string,T> , keysToDiscard: Array<keyof T > = []):{[key:string]: K} => {
  return changesMap ? [...changesMap.entries()].reduce((acc,[key,oc])=> {
    const rest = _.omit(oc, keysToDiscard)
    return {...acc, [key]: rest}
  },{} as K) : {}

}