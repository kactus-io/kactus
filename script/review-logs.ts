/* eslint-disable no-sync */

import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { getProductName } from '../app/package-info'

function getUserDataPath() {
  const home = os.homedir()
  return path.join(home, 'Library', 'Application Support', getProductName())
}

export function getLogFiles(): ReadonlyArray<string> {
  const directory = path.join(getUserDataPath(), 'logs')
  if (!fs.existsSync(directory)) {
    return []
  }

  const fileNames = fs.readdirSync(directory)
  return fileNames
    .filter(fileName => fileName.endsWith('.log'))
    .map(fileName => path.join(directory, fileName))
}
