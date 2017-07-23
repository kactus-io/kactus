import { PullRequestsDatabase, IPullRequest } from './pull-requests-database'
import { API, IAPIPullRequest } from '../api'
import { Account } from '../../models/account'
import { GitHubRepository } from '../../models/github-repository'
import { fatalError } from '../fatal-error'

/** The hard limit on the number of PR results we'd ever return. */
const PullRequestsResultsHardLimit = 100

/** The store for GitHub issues. */
export class PullRequestsStore {
  private db: PullRequestsDatabase

  /** Initialize the store with the given database. */
  public constructor(db: PullRequestsDatabase) {
    this.db = db
  }

  /**
   * Get the highest value of the 'updated_at' field for PR in a given
   * repository. This value is used to request delta updates from the API
   * using the 'If-Modified-Since' header.
   */
  private async getLatestUpdatedAt(
    repository: GitHubRepository
  ): Promise<Date | null> {
    const gitHubRepositoryID = repository.dbID
    if (!gitHubRepositoryID) {
      return fatalError(
        "Cannot get issues for a repository that hasn't been inserted into the database!"
      )
    }

    const db = this.db

    const latestUpdatedPR = await db.pullRequests
      .where('[gitHubRepositoryID+updated_at]')
      .between([gitHubRepositoryID], [gitHubRepositoryID + 1], true, false)
      .last()

    if (!latestUpdatedPR || !latestUpdatedPR.updated_at) {
      return null
    }

    const lastUpdatedAt = new Date(latestUpdatedPR.updated_at)

    return !isNaN(lastUpdatedAt.getTime()) ? lastUpdatedAt : null
  }

  /**
   * Fetch the PR for the repository. This will delete any PR that have
   * been closed and update or add any PR that have changed or been added.
   */
  public async fetchPullRequests(
    repository: GitHubRepository,
    account: Account
  ) {
    const api = API.fromAccount(account)
    const lastUpdatedAt = await this.getLatestUpdatedAt(repository)

    // If we don't have a lastUpdatedAt that mean we haven't fetched any PR
    // for the repository yet which in turn means we only have to fetch the
    // currently open PRs. If we have fetched before we get all PR
    // that have been modified since the last time we fetched so that we
    // can prune closed PR from our database. Note that since the GitHub
    // API returns all issues modified _at_ or after the timestamp we give it
    // we will always get at least one PR back but we won't have to transfer
    // it since we should get a 304 response from GitHub.
    const state = lastUpdatedAt ? 'all' : 'open'

    const issues = await api.fetchPullRequests(
      repository.owner.login,
      repository.name,
      state,
      lastUpdatedAt
    )

    this.storePullRequests(issues, repository)
  }

  private async storePullRequests(
    pullRequests: ReadonlyArray<IAPIPullRequest>,
    repository: GitHubRepository
  ): Promise<void> {
    const gitHubRepositoryID = repository.dbID
    if (!gitHubRepositoryID) {
      fatalError(
        `Cannot store issues for a repository that hasn't been inserted into the database!`
      )
      return
    }

    const pullRequestsToDelete = pullRequests.filter(
      pr => pr.state === 'closed'
    )
    const pullRequestsToUpsert = pullRequests
      .filter(pr => pr.state === 'open')
      .map<IPullRequest>(pr => {
        return {
          gitHubRepositoryID,
          number: pr.number,
          title: pr.title,
          updated_at: pr.updated_at,
          body: pr.body,
          head: pr.head.ref,
          base: pr.base.ref,
        }
      })

    const db = this.db

    function findPullRequestsInRepositoryByNumber(
      gitHubRepositoryID: number,
      pullRequestNumber: number
    ) {
      return db.pullRequests
        .where('[gitHubRepositoryID+number]')
        .equals([gitHubRepositoryID, pullRequestNumber])
        .limit(1)
        .first()
    }

    await this.db.transaction('rw', this.db.pullRequests, function*() {
      for (const pullRequest of pullRequestsToDelete) {
        const existing = yield findPullRequestsInRepositoryByNumber(
          gitHubRepositoryID,
          pullRequest.number
        )
        if (existing) {
          yield db.pullRequests.delete(existing.id)
        }
      }

      for (const pullRequest of pullRequestsToUpsert) {
        const existing = yield findPullRequestsInRepositoryByNumber(
          gitHubRepositoryID,
          pullRequest.number
        )
        if (existing) {
          yield db.pullRequests.update(existing.id, pullRequest)
        } else {
          yield db.pullRequests.add(pullRequest)
        }
      }
    })
  }

  /** Get prs whose title or number matches the text. */
  public async getPullRequestsMatching(
    repository: GitHubRepository,
    text: string
  ): Promise<ReadonlyArray<IPullRequest>> {
    const gitHubRepositoryID = repository.dbID
    if (!gitHubRepositoryID) {
      fatalError(
        "Cannot get PRs for a repository that hasn't been inserted into the database!"
      )
      return []
    }

    if (!text.length) {
      const issues = await this.db.pullRequests
        .where('gitHubRepositoryID')
        .equals(gitHubRepositoryID)
        .limit(PullRequestsResultsHardLimit)
        .reverse()
        .sortBy('number')
      return issues
    }

    const MaxScore = 1
    const score = (pr: IPullRequest) => {
      if (pr.number.toString().startsWith(text)) {
        return MaxScore
      }

      if (pr.title.toLowerCase().includes(text.toLowerCase())) {
        return MaxScore - 0.1
      }

      return 0
    }

    const pullRequestsCollection = await this.db.pullRequests
      .where('gitHubRepositoryID')
      .equals(gitHubRepositoryID)
      .filter(pr => score(pr) > 0)

    const pullRequests = await pullRequestsCollection
      .limit(PullRequestsResultsHardLimit)
      .toArray()

    return pullRequests.sort((a, b) => score(b) - score(a))
  }
}
