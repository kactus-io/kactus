export function getSha() {
  if (isCircleCI() && process.env.CIRCLE_SHA1 != null) {
    return process.env.CIRCLE_SHA1
  }

  throw new Error(
    `Unable to get the SHA for the current platform. Check the documentation for the expected environment variables.`
  )
}

export function isRunningOnFork() {
  if (
    isCircleCI() &&
    process.env.CIRCLE_REPOSITORY_URL !== 'git@github.com:kactus-io/kactus.git'
  ) {
    return true
  }

  return false
}

export function isCircleCI() {
  return process.platform === 'darwin' && process.env.CIRCLECI === 'true'
}

export function getReleaseBranchName(): string {
  return (
    process.env.CIRCLE_BRANCH || '' // macOS
  )
}
