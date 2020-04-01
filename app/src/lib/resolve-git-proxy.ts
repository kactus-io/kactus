import { remote } from 'electron'
import { enableAutomaticGitProxyConfiguration } from './feature-flag'
import { parsePACString } from './parse-pac-string'

export async function resolveGitProxy(
  url: string
): Promise<string | undefined> {
  if (!enableAutomaticGitProxyConfiguration()) {
    return undefined
  }

  // resolveProxy doesn't throw an error (at least not in the
  // current Electron version) but it could in the future and
  // it's also possible that the IPC layer could throw an
  // error (if the URL we're given is null or undefined despite
  // our best type efforts for example).
  // Better safe than sorry.
  const pacString = await remote.session.defaultSession
    .resolveProxy(url)
    .catch(err => {
      log.error(`Failed resolving proxy for '${url}'`, err)
      return 'DIRECT'
    })

  const proxies = parsePACString(pacString)

  if (proxies === null) {
    return undefined
  }

  for (const proxy of proxies) {
    return proxy
  }

  return undefined
}
