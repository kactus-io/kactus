import * as Path from 'path'
import { execFile, exec } from 'child_process'

const regex = /sketchtool Version ((\d|\.)+) \(\d+\)/
function extractVersion(s: string) {
  const match = regex.exec(s)
  return match && match[1]
}

export const SKETCH_PATH = '/Applications/Sketch.app'
export const SKETCHTOOL_PATH = Path.join(
  SKETCH_PATH,
  '/Contents/Resources/sketchtool/bin/sketchtool'
)

export async function openSketch() {
  return await new Promise<void>((resolve, reject) => {
    exec('open -a sketch', err => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}

let sketchVersion: string | undefined

export async function getSketchVersion(): Promise<string | null> {
  if (sketchVersion) {
    return sketchVersion
  }
  return new Promise<string | null>((resolve, reject) => {
    execFile(Path.join(SKETCHTOOL_PATH), ['-v'], (err, stdout) => {
      if (err) {
        return resolve(null)
      }
      let version = extractVersion(stdout)
      if (!version) {
        return resolve(null)
      }
      const pointNumbers = version.split('.').length
      if (pointNumbers === 1) {
        version = version + '.0.0'
      } else if (pointNumbers === 2) {
        version = version + '.0'
      }
      sketchVersion = version
      return resolve(version)
    })
  })
}

export async function runPluginCommand(
  plugin: string,
  commandIdentifier: string
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    execFile(
      Path.join(SKETCHTOOL_PATH),
      ['run', plugin, commandIdentifier, '--without-activating'],
      err => {
        if (err) {
          return reject(err)
        }
        return resolve()
      }
    )
  })
}
