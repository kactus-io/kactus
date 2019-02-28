import * as path from 'path'
import * as fs from 'fs-extra'
import { promisify } from 'util'

import { licenseOverrides } from './license-overrides'

import * as _legalEagle from 'legal-eagle'
const legalEagle = promisify(_legalEagle)

import { getVersion } from '../../app/package-info'

export async function updateLicenseDump(
  projectRoot: string,
  outRoot: string
): Promise<void> {
  const appRoot = path.join(projectRoot, 'app')
  const outPath = path.join(outRoot, 'static', 'licenses.json')

  let summary = await legalEagle({
    path: appRoot,
    overrides: licenseOverrides,
    omitPermissive: true,
  })

  if (Object.keys(summary).length > 0) {
    let licensesMessage = ''
    for (const key in summary) {
      const license = summary[key]
      licensesMessage += `${key} (${license.repository}): ${license.license}\n`
    }

    const overridesPath = path.join(__dirname, 'license-overrides.ts')

    const message = `The following dependencies have unknown or non-permissive licenses. Check it out and update ${overridesPath} if appropriate:\n${licensesMessage}`
    throw new Error(message)
  }

  summary = await legalEagle({
    path: appRoot,
    overrides: licenseOverrides,
  })

  // legal-eagle still chooses to ignore the LICENSE at the root
  // this injects the current license and pins the source URL before we
  // dump the JSON file to disk
  const licenseSource = path.join(projectRoot, 'LICENSE')
  const licenseText = await fs.readFile(licenseSource, {
    encoding: 'utf-8',
  })
  const appVersion = getVersion()

  summary[`kactus@${appVersion}`] = {
    repository: 'https://github.com/kactus-io/kactus',
    license: 'MIT',
    source: `https://github.com/kactus-io/kactus/blob/release-${appVersion}/LICENSE`,
    sourceText: licenseText,
  }

  // inject the desktop/desktop LICENSE from which we forked
  summary[`desktop@0.6.5`] = {
    repository: 'https://github.com/desktop/desktop',
    license: 'MIT',
    source: `https://github.com/desktop/desktop/blob/master/LICENSE`,
    sourceText: `Copyright (c) GitHub, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`,
  }

  await fs.writeFile(outPath, JSON.stringify(summary), {
    encoding: 'utf8',
  })
}
