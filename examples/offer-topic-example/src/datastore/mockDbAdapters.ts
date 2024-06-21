import { sleep } from "@perf-kaizen/load-generator/build/common/utils.js";
import { Contest, MarketDb, PropositionDb } from "../domain/models.js";
import { createLookupKey } from "../utils.js";
import { Datastore, MarketDatastore, PropositionDatastore } from "./core.js";

import merge from "lodash/merge.js"

/*---------------------------------------------------------------------------------------------------------------------------*
 * Mock contest db
 *---------------------------------------------------------------------------------------------------------------------------*/
export class MockDbContest implements Datastore<Contest> {
  private contestMap: Map<string, Contest>

  constructor() {
    this.contestMap = new Map()
  }

  // Datastore interface methods
  async insert(row: Contest): Promise<void> {
    await sleep(10)
    this.contestMap.set(row.contestKey, row)
  }

  async get(key: string): Promise<Contest|undefined> {
    await sleep(5)
    return this.contestMap.get(key)
  }

  async update(key: string, row: Partial<Contest>): Promise<Contest> {
    await sleep(10)
    const existingRow = this.contestMap.get(key)

    const updatedRow = merge({}, existingRow, row)
    this.contestMap.set(key,updatedRow)

    return updatedRow

  }
  async delete(key: string): Promise<void> {
    await sleep(5)
    this.contestMap.delete(key)
  }
}
/*---------------------------------------------------------------------------------------------------------------------------*
 * Mock proposition db
 *---------------------------------------------------------------------------------------------------------------------------*/
export class MockDbProposition implements PropositionDatastore {
  private propositionMap: Map<string, PropositionDb>

  constructor() {
    this.propositionMap = new Map()
  }

  // Datastore interface methods
  async insert(row: PropositionDb): Promise<void> {
    await sleep(50)
    const key = createLookupKey([row.contestKey, row.propositionKey])

    this.propositionMap.set(key, row)
  }

  async get(contestKey: string, propositionKey: string): Promise<PropositionDb|undefined> {
    await sleep(20)

    const key = createLookupKey([contestKey, propositionKey])
    return this.propositionMap.get(key)
  }

  async update(contestKey: string, propositionKey: string, row: Partial<PropositionDb>): Promise<PropositionDb> {
    await sleep(50)

    const key = createLookupKey([contestKey, propositionKey])
    const existingRow = this.propositionMap.get(key)

    const updatedRow = merge({}, existingRow, row)
    this.propositionMap.set(key,updatedRow)

    return updatedRow

  }
  async delete(contestKey: string, propositionKey: string): Promise<void> {
    await sleep(20)

    const key = createLookupKey([contestKey, propositionKey])
    this.propositionMap.delete(key)
  }
}
/*---------------------------------------------------------------------------------------------------------------------------*
 * Mock Market db
 *---------------------------------------------------------------------------------------------------------------------------*/
export class MockDbMarket implements MarketDatastore {
  private marketMap: Map<string, MarketDb>

  constructor() {
    this.marketMap = new Map()
  }

  // Datastore interface methods
  async insert(row: MarketDb): Promise<void> {
    await sleep(10)

    const key = createLookupKey([row.contestKey, row.propositionKey])

    this.marketMap.set(key, row)
  }

  async get(contestKey: string, propositionKey: string): Promise<MarketDb|undefined> {
    await sleep(5)

    const key = createLookupKey([contestKey, propositionKey])
    return this.marketMap.get(key)
  }

  async update(contestKey: string, propositionKey: string, row: Partial<MarketDb>): Promise<MarketDb> {
    await sleep(10)

    const key = createLookupKey([contestKey, propositionKey])
    const existingRow = this.marketMap.get(key)

    const updatedRow = merge({}, existingRow, row)
    this.marketMap.set(key,updatedRow)

    return updatedRow

  }
  async delete(contestKey: string, propositionKey: string): Promise<void> {
    await sleep(5)

    const key = createLookupKey([contestKey, propositionKey])
    this.marketMap.delete(key)
  }
}