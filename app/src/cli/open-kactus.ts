import * as ChildProcess from 'child_process'

export function openKactus(url: string = '') {
  const env = { ...process.env }
  // NB: We're gonna launch Kactus and we definitely don't want to carry over
  // `ELECTRON_RUN_AS_NODE`. This seems to only happen on Windows.
  delete env['ELECTRON_RUN_AS_NODE']

  url = 'x-kactus-client://' + url

  return ChildProcess.spawn('open', [url], { env })
}
