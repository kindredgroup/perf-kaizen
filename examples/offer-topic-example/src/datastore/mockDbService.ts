import { Contest } from "../domain/models.js";
import { Datastore, DatastoreService, MarketDatastore, PropositionDatastore } from "./core.js";


export class MockDbService extends DatastoreService {
  constructor(contestStore: Datastore<Contest>, propositionStore: PropositionDatastore, marketStore: MarketDatastore){
    super();
    this.contestStore = contestStore
    this.propositionStore = propositionStore
    this.marketStore = marketStore
    this.propositionCache = new Map()
  }
}