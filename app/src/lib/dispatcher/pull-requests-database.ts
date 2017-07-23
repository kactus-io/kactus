import Dexie from 'dexie'

// NB: This _must_ be incremented whenever the DB key scheme changes.
const DatabaseVersion = 1

export interface IPullRequest {
  readonly id?: number
  readonly gitHubRepositoryID: number
  readonly number: number
  readonly title: string
  readonly updated_at?: string
  readonly body: string
  readonly head: string
  readonly base: string
}

export class PullRequestsDatabase extends Dexie {
  public pullRequests: Dexie.Table<IPullRequest, number>

  public constructor(name: string) {
    super(name)

    this.version(DatabaseVersion).stores({
      pullRequests:
        '++id, &[gitHubRepositoryID+number], gitHubRepositoryID, number, [gitHubRepositoryID+updated_at]',
    })
  }
}
