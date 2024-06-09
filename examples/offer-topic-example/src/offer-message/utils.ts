import { OfferingLoadGeneratorParams, OfferingLoadGeneratorCount } from "./types.js";

export const getOfferingsByTypeCountToGenerate = (input: OfferingLoadGeneratorParams): OfferingLoadGeneratorCount => {
  return {
    Contest: {
      count: input.contests,
      children: {
        Proposition: input.propositionsPerContest,
        PropositionChanged: input.propositionsPerContest,
        OptionChanged: input.optionsPerProposition,
        VariantChanged: input.variantsPerProposition,
        OutcomeChanged: input.optionsPerProposition,
        OutcomeResult: input.optionsPerProposition,
        Market: input.propositionsPerContest,
        MarketPriceChanged: input.optionsPerProposition,
      }
    }
  }
}

export const getOfferingsTotalCount = (offerings: OfferingLoadGeneratorCount): number => {
  const totalContests = offerings.Contest.count
  const totalChildredPerContest = Object.values(offerings.Contest.children).reduce((acc, child) => acc + child, 0)


  return totalChildredPerContest * totalContests
}

