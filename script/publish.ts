const PUBLISH_CHANNELS = ['production', 'test', 'beta']
import * as distInfo from './dist-info'
import * as gitInfo from '../app/git-info'
import * as packageInfo from '../app/package-info'

if (PUBLISH_CHANNELS.indexOf(distInfo.getReleaseChannel()) < 0) {
  console.log('Not a publishable build. Skipping publish.')
  process.exit(0)
}

const releaseSHA = distInfo.getReleaseSHA()
if (releaseSHA == null) {
  console.log(`No release SHA found for build. Skipping publish.`)
  process.exit(0)
}

const currentTipSHA = gitInfo.getSHA()
if (!currentTipSHA.toUpperCase().startsWith(releaseSHA!.toUpperCase())) {
  console.log(
    `Current tip '${currentTipSHA}' does not match release SHA '${releaseSHA}'. Skipping publish.`
  )
  process.exit(0)
}

import { execSync } from 'child_process'
import * as github from './github'

const token = process.env.KACTUSBOT_TOKEN!
const repo = 'kactus-io/kactus'

console.log('Packaging…')
execSync('npm run package')

let releaseId: string
const tag = 'v' + packageInfo.getVersion()

console.log('Uploading ' + tag + '…')

github
  .getOrCreateDraftRelease(
    token,
    repo,
    tag,
    distInfo.getReleaseBranchName(),
    require('../changelog.json').releases[packageInfo.getVersion()] || []
  )
  .then(function(res) {
    releaseId = res.id
    return uploadOSXAssets(releaseId)
  })
  .then(artifacts => {
    const names = artifacts.map(function(item, index) {
      return item.name
    })
    console.log(`Uploaded artifacts: ${names}`)
    return github.publishRelease(token, repo, releaseId)
  })
  .catch(e => {
    console.error(`Publishing failed: ${e}`)
    process.exit(1)
  })

function uploadOSXAssets(releaseId: string) {
  const uploads = [
    github.updateAsset(token, repo, releaseId, distInfo.getOSXZipPath()),
  ]
  return Promise.all(uploads)
}
