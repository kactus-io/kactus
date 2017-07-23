import * as Fs from 'fs'
import * as Path from 'path'
import { exec } from 'child_process'
import {
  find,
  IKactusFile,
  IKactusConfig,
  parseFile,
  importFolder,
} from 'kactus-cli'
import { Repository } from '../models/repository'
import { Account } from '../models/account'
import { getDotComAPIEndpoint } from './api'
import { SKETCHTOOL_PATH, runPluginCommand, getSketchVersion } from './sketch'

export type IFullKactusConfig = IKactusConfig & { sketchVersion?: string }

interface IKactusStatusResult {
  readonly config: IFullKactusConfig
  readonly files: Array<IKactusFile>
  readonly lastChecked: number
}

/**
 *  Retrieve the status for a given repository
 */
export async function getKactusStatus(
  repository: Repository
): Promise<IKactusStatusResult> {
  const kactus = find(repository.path)
  const sketchVersion = (await getSketchVersion()) || undefined
  return {
    config: {
      // need to copy the config otheerwise there is a memory leak
      ...kactus.config,
      sketchVersion,
      root: kactus.config.root
        ? Path.join(repository.path, kactus.config.root)
        : repository.path,
    },
    files: kactus.files.map(f => {
      return {
        ...f,
        id: f.path.replace(repository.path, '').replace(/^\//, ''),
      }
    }),
    lastChecked: Date.now(),
  }
}

export async function generateDocumentPreview(
  file: string,
  output: string
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    exec(
      SKETCHTOOL_PATH +
        ' export preview "' +
        file +
        '" --output="' +
        output +
        '" --filename=document.png --overwriting=YES',
      (err, stdout, stderr) => {
        if (err) {
          return reject(err)
        }
        resolve(output + '/document.png')
      }
    )
  })
}

export async function generatePagePreview(
  file: string,
  name: string,
  output: string
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    exec(
      SKETCHTOOL_PATH +
        ' export pages "' +
        file +
        '" --item="' +
        name +
        '" --output="' +
        output +
        '" --save-for-web=YES --use-id-for-name=YES --overwriting=YES --formats=png',
      (err, stdout, stderr) => {
        if (err) {
          return reject(err)
        }
        const id = stdout.replace('Exported', '').trim()
        resolve(output + '/' + id)
      }
    )
  })
}

export async function generateArtboardPreview(
  file: string,
  id: string,
  output: string
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    exec(
      SKETCHTOOL_PATH +
        ' export artboards "' +
        file +
        '" --item="' +
        id +
        '" --output="' +
        output +
        '" --save-for-web=YES --use-id-for-name=YES --overwriting=YES --include-symbols=YES --formats=png',
      (err, stdout, stderr) => {
        if (err) {
          return reject(err)
        }
        resolve(output + '/' + id + '.png')
      }
    )
  })
}

export async function generateLayerPreview(
  file: string,
  id: string,
  output: string
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    exec(
      SKETCHTOOL_PATH +
        ' export layers "' +
        file +
        '" --item="' +
        id +
        '" --output="' +
        output +
        '" --save-for-web=YES --use-id-for-name=YES --overwriting=YES --formats=png',
      (err, stdout, stderr) => {
        if (err) {
          return reject(err)
        }
        resolve(output + '/' + id + '.png')
      }
    )
  })
}

export async function saveKactusConfig(
  repository: Repository,
  content: string
): Promise<void> {
  const configPath = Path.join(repository.path, 'kactus.json')

  return new Promise<void>((resolve, reject) => {
    Fs.writeFile(configPath, content, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

export function shouldShowPremiumUpsell(
  repository: Repository,
  account: Account | null
) {
  if (
    repository.gitHubRepository &&
    account &&
    account.endpoint !== getDotComAPIEndpoint() &&
    !account.unlockedKactus
  ) {
    return { enterprise: true }
  }

  if (
    repository.gitHubRepository &&
    repository.gitHubRepository.private &&
    account &&
    !account.unlockedKactus
  ) {
    return { enterprise: false }
  }

  return false
}

export async function parseSketchFile(path: string, config: IFullKactusConfig) {
  return parseFile(path + '.sketch', config)
}

export function importSketchFile(path: string, config: IFullKactusConfig) {
  return importFolder(path, config).then(() => {
    return runPluginCommand(
      Path.resolve(__dirname, './plugin.sketchplugin'),
      'refresh-files'
    )
  })
}
