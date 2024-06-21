import { Contest, PropositionDb } from "../domain/models.js";
import { Datastore, DatastoreService, MarketDatastore, PropositionDatastore } from "./core.js";


export class MockDbService extends DatastoreService {
  enableCache: boolean
  constructor(contestStore: Datastore<Contest>, propositionStore: PropositionDatastore, marketStore: MarketDatastore, enableCache: boolean){
    super();
    this.contestStore = contestStore
    this.propositionStore = propositionStore
    this.marketStore = marketStore
    this.propositionCache = new Map()
    this.enableCache = enableCache
  }

  async getProposition(contestKey: string, propositionKey: string): Promise<PropositionDb> {
    if (this.enableCache ) {
      return this.getPropositionWithCache(contestKey, propositionKey)
    }
    return super.getProposition(contestKey, propositionKey)

  }
}