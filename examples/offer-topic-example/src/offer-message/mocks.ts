import { randomEnum } from "@perf-kaizen/load-generator/build/common/utils.js"
import {
  Contest,
  ContestStatus, ContestType,
  Market,
  Option,
  OptionChanged,
  OptionType, Outcome, OutcomeChanged, PriceChanged, Proposition, PropositionChanged, PropositionType, Result, Variant, VariantChanged, VariantType
} from "./domain/models.js"
import { OfferingLoadGeneratorCount, OfferingMessageType } from "./types.js"
import lodash from 'lodash'

const { shuffle } = lodash

const mockContest = (index: number):Contest => {
  const now = new Date()
  now.setMinutes(now.getMinutes() + index)
  const type = randomEnum(ContestType)

  return {
    contestKey: `load-test-scenario-throughput-mock-${index}`,
    type,
    endTimestamp: now.toISOString(),
    name: `Mock Contest ${index}`,
    startTimestamp: now.toISOString(),
    status: randomEnum(ContestStatus),
    timestamp: now.toISOString(),
  }
}

const mockMarket = ({ contestKey, propositionKey }: Proposition): Market => ({
  contestKey,
  propositionKey,
  isAvailable: true,
  timestamp: new Date().toISOString()
})

const mockMarketPriceChanged = ({ contestKey, propositionKey, options, variants }: Proposition): PriceChanged => {
  const timestamp = new Date().toISOString()
  const prices = options.map((o, index) => ({
    optionKey: o.optionKey,
    variantKey: variants[0].variantKey,
    timestamp,
    price: index * 1.1,
  }))

  return {
    contestKey,
    propositionKey,
    prices,
    timestamp
  }
}

const mockOutcomeResult = ({ contestKey, propositionKey, options, variants }: Proposition): Result => {
  const outcomeResult = options.map(o => ({
    optionKey: o.optionKey,
    variantKey: variants[0].variantKey,
    status: 'Win',
    winAmount: 10
  }))

  return {
    contestKey,
    outcomeResult,
    propositionKey,
    timestamp: new Date().toISOString()
  }
}

const mockOption = (index: number): Option => {
  return {
    isAvailable: true,
    name: `Option ${index}`,
    optionKey: `opt_${index}`,
    type: randomEnum(OptionType),
  }
}

const mockVariant = (index: number): Variant => {
  return {
    isAvailable: true,
    name: `Variant ${index}`,
    variantKey: `variant_${index}`,
    type: randomEnum(VariantType),
  }
}

const mockProposition = (totalOptionsPerProposition: number, totalVariantsPerProposition: number) => (contest: Contest, index: number): Proposition => {
  const now = new Date()
  const propositionType = randomEnum(PropositionType)

  const options = Array(totalOptionsPerProposition).fill(0)
    .map((_, i) => mockOption(i))

  const variants = Array(totalVariantsPerProposition).fill(0)
    .map((_, i) => mockVariant(i))

  // generate all outcomes
  const outcomes: Array<Outcome> = options.flatMap(option => variants.map(variant => ({
    optionKey: option.optionKey,
    variantKey: variant.variantKey,
    isAvailable: true,
    resulted: false
  })))

  return {
    contestKey: contest.contestKey,
    propositionKey: `${propositionType}_${index}`,
    name: propositionType,
    type: propositionType,
    isAvailable: true,
    options,
    outcomes,
    variants,
    timestamp: now.toISOString(),
  }
}

const buildPropositionChanged = (proposition: Proposition):PropositionChanged => {
  const now = new Date()

  const { contestKey, propositionKey } = proposition

  return {
    contestKey,
    propositionKey,
    isAvailable: true,
    timestamp: now.toISOString(),
  }
}

const buildOptionsChangedOnProposition = (proposition: Proposition): Array<OptionChanged> => {
  const now = new Date()
  const { contestKey, propositionKey } = proposition

  return proposition.options.map(({ optionKey, name }) => {
    return {
      contestKey,
      propositionKey,
      optionKey,
      bettingOpen: true,
      name: `${name} CHANGED`,
      timeStampUtc: now.toISOString(),
    }
  })
}

const buildVariantsChangedOnProposition = (proposition: Proposition): Array<VariantChanged> => {
  const now = new Date()
  const { contestKey, propositionKey } = proposition
  return proposition.variants.map(({ variantKey, name }) => {
    return {
      contestKey,
      propositionKey,
      variantKey,
      name: `${name} CHANGED`,
      timestamp: now.toISOString(),
    }
  })
}

const buildOutcomesChangedOnProposition = ({ contestKey, propositionKey, options, variants }: Proposition): Array<OutcomeChanged> => {
  return options.map(({ optionKey }) => ({
    contestKey,
    propositionKey,
    optionKey: optionKey,
    variantKey: variants[0].variantKey,
    timeStampUtc: new Date()
  }))
}


export function generateMockOfferingsData(offerings: OfferingLoadGeneratorCount) {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  return async function* g() {
    const totalContests = offerings.Contest.count
    const childredPerContest = offerings.Contest.children

    // Contest Loop
    for (let ci = 0; ci < totalContests; ci++) {
      const contest = mockContest(ci)
      yield {type: OfferingMessageType.Contest,payload: contest}

      const propositions = []
      const markets = []

      const propositionsChanged = []
      const optionsChanged = []
      const variantsChanged = []
      const outcomesChanged = []
      const outcomeResultsChanged = []
      const makretPricesChanged = []
      // propositions loop
      for (let pi = 0; pi < childredPerContest.Proposition; pi++) {
        // proposition
        const proposition = mockProposition(childredPerContest.OptionChanged, childredPerContest.VariantChanged)(contest, pi)
        propositions.push(proposition)
        yield {type: OfferingMessageType.Proposition,payload: proposition}

        // market
        const market = mockMarket(proposition)
        markets.push(market)
        yield {type: OfferingMessageType.Market,payload: market}

        // propositions Changed
        propositionsChanged.push({type: OfferingMessageType.PropositionChanged, payload: buildPropositionChanged(proposition)})

        // Options Changed
        optionsChanged.push(...buildOptionsChangedOnProposition(proposition).map(k => ({type: OfferingMessageType.OptionChanged,payload: k})))

        // Variants Changed
        variantsChanged.push(...buildVariantsChangedOnProposition(proposition).map(k => ({type: OfferingMessageType.VariantChanged,payload: k})))

        // Outcomes Changed
        outcomesChanged.push(...buildOutcomesChangedOnProposition(proposition).map(k => ({type: OfferingMessageType.OutcomeChanged,payload: k})))

        // Outcome Results
        outcomeResultsChanged.push({type:OfferingMessageType.OutcomeResult,payload:mockOutcomeResult(proposition)})

        // Market Price Changed
        makretPricesChanged.push({type: OfferingMessageType.MarketPriceChanged,payload:mockMarketPriceChanged(proposition)})
      }

      const shuffledOfferings = shuffle([
        ...propositionsChanged,
        ...optionsChanged,
        ...variantsChanged,
        ...outcomesChanged,
        ...makretPricesChanged,
      ])

      for (const message of shuffledOfferings) {
        yield message
      }


      for (const result of outcomeResultsChanged) {
        yield result
      }

    }
  }


}