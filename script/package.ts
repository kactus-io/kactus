/* eslint-disable no-sync */

import * as fs from 'fs-extra'
import * as cp from 'child_process'
import { getProductName } from '../app/package-info'
import { getDistPath, getOSXZipPath } from './dist-info'

const distPath = getDistPath()
const productName = getProductName()

const dest = getOSXZipPath()
fs.removeSync(dest)

const pathToApp = `"${distPath}/${productName}.app"`

cp.execSync(`codesign -vvvv ${pathToApp}`)

cp.execSync(`ditto -ck --keepParent ${pathToApp} "${dest}"`)
console.log(`Zipped to ${dest}`)
