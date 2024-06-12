
export enum PropositionType {
  Proposition1 = "Proposition1",
  Proposition2 = "Proposition2",
  Proposition3 = "Proposition3",
  Proposition4 = "Proposition4",
  Proposition5 = "Proposition5",
}

export enum OptionType {
  Option1 = "Option1",
  Option2 = "Option2",
  Option3 = "Option3",
  Option4 = "Option4",
  Option5 = "Option5",
  Option6 = "Option6",
  Option7 = "Option7",
  Option8 = "Option8",
  Option9 = "Option9",
  Option10 = "Option10",
  Option11 = "Option11",
  Option12 = "Option12",
  Option13 = "Option13",
  Option14 = "Option14",
  Option15 = "Option15",
  Option16 = "Option16",
  Option17 = "Option17",
  Option18 = "Option18",
  Option19 = "Option19",
  Option20 = "Option20",
  Option21 = "Option21",
  Option22 = "Option22",
  Option23 = "Option23",
  Option24 = "Option24",
  Option25 = "Option25",
}

export enum VariantType {
  Variant1 = "Variant1",
  Variant2 = "Variant2",
  Variant3 = "Variant3",
  Variant4 = "Variant4",
  Variant5 = "Variant5",
}

export enum ContestStatus {
  Cancelled = "Cancelled",
  Concluded = "Concluded",
  InPlay = "InPlay",
  Postponed = "Postponed",
  PreGame = "PreGame",
  Suspended = "Suspended"
}
export enum ContestType {
  ContestType1 = "ContestType1",
  ContestType2 = "ContestType2",
  ContestType3 = "ContestType3",
  ContestType4 = "ContestType4",
  ContestType5 = "ContestType5",
}

export interface Proposition {
  propositionKey: string
  contestKey: string
  name: string
  type: string
  isAvailable: boolean
  options: Array<Option>
  variants: Array<Variant>
  outcomes: Array<Outcome>
  timestamp: string
}

export type PropositionChanged =  Partial<Proposition> & { contestKey: string, propositionKey: string}
export type OptionChanged =  Partial<Option> & { optionKey: string, contestKey: string, propositionKey: string}
export type VariantChanged =  Partial<Variant> & { variantKey: string, contestKey: string, propositionKey: string}
export type OutcomeChanged =  Partial<Outcome> & { optionKey: string, variantKey: string, contestKey: string, propositionKey: string}

export interface OutcomeResult {
  optionKey: string
  variantKey: string
  status: string
  winAmount: number
  }

export interface Result {
  contestKey: string
  propositionKey: string
  outcomeResult: Array<OutcomeResult>
  timestamp: string
}

export interface Market {
  contestKey: string
  propositionKey: string
  isAvailable: boolean
  timestamp: string
}

export interface Price {
  optionKey: string
  variantKey: string
  price: number
  timestamp: string
}
export interface PriceChanged {
  contestKey: string
  propositionKey: string
  prices: Array<Price>
  timestamp: string
}


/*---------------------------------------------------------------------------------------------------------------------------*
 * Domain models
 *---------------------------------------------------------------------------------------------------------------------------*/

export interface Contest {
  contestKey: string
  name: string
  type: ContestType
  startTimestamp: string
  endTimestamp: string
  status: ContestStatus
  timestamp: string
}

export interface Option {
  optionKey: string
  name: string
  type: OptionType
  isAvailable: boolean
}

export interface Variant {
  variantKey: string
  name: string
  type: VariantType
  isAvailable: boolean
  }

export interface Outcome {
  variantKey: string
  optionKey: string
  isAvailable: boolean
  resulted: boolean
}

// export interface PropositionDomain {
//   propositionKey: string
//   contestKey: string
//   name: string
//   type: string
//   isAvailable: boolean
//   options: Map<string, Option>
//   variants: Map<string,Variant>
//   outcomes: Map<string, Outcome>
//   timestamp: string
// }

/*---------------------------------------------------------------------------------------------------------------------------*
 * Db specific models.
 *  - If Domain and DB models are different
 *---------------------------------------------------------------------------------------------------------------------------*/
export interface PropositionDb {
  propositionKey: string
  contestKey: string
  name: string
  type: string
  isAvailable: boolean
  options: {[key:string]: Option}
  variants: {[key:string]: Variant}
  outcomes: {[key:string]: Outcome}
  timestamp: string
}

export interface MarketDb {
  contestKey: string
  propositionKey: string
  isAvailable: boolean
  prices: {[key:string]: Price}
  timestamp: string
}