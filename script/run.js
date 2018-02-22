'use strict'

const path = require('path')
const cp = require('child_process')
const fs = require('fs')
const distInfo = require('./dist-info')

const distPath = distInfo.getDistPath()
const productName = distInfo.getExecutableName()

const binaryPath = path.join(
  distPath,
  `${productName}.app`,
  'Contents',
  'MacOS',
  `${productName}`
)

module.exports = function(spawnOptions) {
  try {
    const stats = fs.statSync(binaryPath)
    if (!stats.isFile()) {
      return null
    }
  } catch (e) {
    return null
  }

  const opts = Object.assign({}, spawnOptions)

  opts.env = Object.assign(opts.env || {}, process.env, {
    NODE_ENV: 'development',
  })

  return cp.spawn(binaryPath, [], opts)
}
