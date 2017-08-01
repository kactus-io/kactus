# Releasing Updates

## Channels

We have three channels to which we can release: `production`, `beta`, and `test`.

- `production` is the channel from which the general public downloads and receives updates. It should be stable and polished.

- `beta` is released more often than `production`. It may be buggy and unpolished.

- `test` is unlike the other two. It does not receive updates. Each test release is locked in time. It's used entirely for providing test releases.

## The Process

1. Ensure the release notes for `RELEASE_VERSION` in [`changelog.json`](../../changelog.json) are up-to-date.
1. Bump `version` in [`app/package.json`](../../app/package.json) to `RELEASE_VERSION`.
1. Commit & push the changes.
1. Checkout a new branch `__release-production--NAME-OF-THE-RELEASE` and push it
