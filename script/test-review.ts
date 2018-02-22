/* eslint-disable no-sync */

import * as fs from 'fs'
import { getLogFiles } from './review-logs'

getLogFiles().forEach(file => {
  console.log(`opening ${file}:`)
  const text = fs.readFileSync(file, 'utf-8')
  console.log(text)
})
