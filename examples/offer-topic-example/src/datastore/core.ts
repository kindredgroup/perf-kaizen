import { Contest, MarketDb, PropositionDb } from "../domain/models.js"
import { createLookupKey } from "../utils.js"

export interface Datastore<T extends object> {
  // Create
  insert(row: T): Promise<void>
  // Read
  get(key: string): Promise<T|undefined>
  // Update
  update(key: string, row: Partial<T>): Promise<T>
  // Delete
  delete(key: string): Promise<void>
}

export interface PropositionDatastore {
  // Create
  insert(row: PropositionDb): Promise<void>
  // Read
  get(contestKey: string, propositionKey: string): Promise<PropositionDb|undefined>
  // Update
  update(contestKey: string, propositionKey: string,  row: Partial<PropositionDb>): Promise<PropositionDb>
  // Delete
  delete(contestKey: string, propositionKey: string): Promise<void>
}

export interface MarketDatastore {
  // Create
  insert(row: MarketDb): Promise<void>
  // Read
  get(contestKey: string, propositionKey: string): Promise<MarketDb|undefined>
  // Update
  update(contestKey: string, propositionKey: string,  row: Partial<MarketDb>): Promise<MarketDb>
  // Delete
  delete(contestKey: string, propositionKey: string): Promise<void>
}

export abstract class DatastoreService {
  contestStore: Datastore<Contest>
  propositionStore: PropositionDatastore
  marketStore: MarketDatastore
  propositionCache: Map<string, PropositionDb>

  async insertContest(contest: Contest){
    await this.contestStore.insert(contest)
  }
  async getContest(contestKey: string): Promise<Contest>{
    return this.contestStore.get(contestKey)
  }

  async insertProposition(proposition: PropositionDb){
    await this.propositionStore.insert(proposition)
  }

  async getProposition(contestKey: string, propositionKey: string): Promise<PropositionDb>{
    return this.propositionStore.get(contestKey, propositionKey)
  }

  async insertMarket(market: MarketDb){
    await this.marketStore.insert(market)
  }

  async getPropositionWithCache(contestKey: string, propositionKey: string): Promise<PropositionDb>{
    const lookupKey = createLookupKey([contestKey, propositionKey])
    const propositionFromCache = this.propositionCache.get(lookupKey)
    if (propositionFromCache) {
      // console.log("picked from cache..", contestKey,propositionKey)
      return propositionFromCache
    }
    const proposition = await this.propositionStore.get(contestKey, propositionKey)
    this.propositionCache.set(lookupKey, proposition)
    return proposition
  }

  clearPropositionCache(){
    this.propositionCache.clear()
  }
}