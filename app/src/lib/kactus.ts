import * as Fs from 'fs'
import * as Path from 'path'
import { exec } from 'child_process'
import {
  find,
  IKactusFile as _IKactusFile,
  IKactusConfig,
  parseFile,
  importFolder,
} from 'kactus-cli'
import { getUserDataPath } from '../ui/lib/app-proxy'
import { Repository } from '../models/repository'
import { Account } from '../models/account'
import { IGitAccount } from './git/authentication'
import { getDotComAPIEndpoint } from './api'
import { sketchtoolPath, runPluginCommand, getSketchVersion } from './sketch'

export type IFullKactusConfig = IKactusConfig & { sketchVersion?: string }
export type IKactusFile = _IKactusFile & {
  isParsing: boolean
  isImporting: boolean
}

interface IKactusStatusResult {
  readonly config: IFullKactusConfig
  readonly files: Array<IKactusFile>
  readonly lastChecked: number
}

/**
 *  Retrieve the status for a given repository
 */
export async function getKactusStatus(
  sketchPath: string,
  repository: Repository
): Promise<IKactusStatusResult> {
  const kactus = find(repository.path)
  const sketchVersion = (await getSketchVersion(sketchPath)) || undefined
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
        isParsing: false,
        isImporting: false,
      }
    }),
    lastChecked: Date.now(),
  }
}

export async function generateDocumentPreview(
  sketchPath: string,
  file: string,
  output: string
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    exec(
      sketchtoolPath(sketchPath) +
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
  sketchPath: string,
  file: string,
  name: string,
  output: string
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    exec(
      sketchtoolPath(sketchPath) +
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
  sketchPath: string,
  file: string,
  id: string,
  output: string
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    exec(
      sketchtoolPath(sketchPath) +
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
  sketchPath: string,
  file: string,
  id: string,
  output: string
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    exec(
      sketchtoolPath(sketchPath) +
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
  config: IFullKactusConfig
): Promise<void> {
  const configPath = Path.join(repository.path, 'kactus.json')

  const configToSave = { ...config }
  delete configToSave.sketchVersion
  if (configToSave.root === repository.path) {
    delete configToSave.root
  } else if (configToSave.root) {
    configToSave.root = configToSave.root.replace(repository.path, '.')
  }

  return new Promise<void>((resolve, reject) => {
    Fs.writeFile(configPath, JSON.stringify(configToSave, null, 2), err => {
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
  account: IGitAccount | null,
  accounts: ReadonlyArray<Account>
) {
  if (!account) {
    return false
  }

  let potentialPremiumAccount: Account | undefined

  if (account instanceof Account) {
    potentialPremiumAccount = account
  } else {
    potentialPremiumAccount =
      accounts.find(
        a => a.unlockedKactus && account.endpoint !== getDotComAPIEndpoint()
      ) ||
      accounts.find(a => a.unlockedKactus) ||
      accounts[0]
  }

  if (repository.gitHubRepository) {
    if (!potentialPremiumAccount) {
      // that shouldn't happen, when a repo is from github,
      // there is a account associated with it.
      // so bail out
      return false
    }
    if (
      potentialPremiumAccount.endpoint !== getDotComAPIEndpoint() &&
      !potentialPremiumAccount.unlockedKactus
    ) {
      return { enterprise: true, user: potentialPremiumAccount }
    }
    if (
      repository.gitHubRepository.private &&
      !potentialPremiumAccount.unlockedKactus
    ) {
      return { enterprise: false, user: potentialPremiumAccount }
    }
  } else if (
    !potentialPremiumAccount ||
    !potentialPremiumAccount.unlockedKactus
  ) {
    return { enterprise: true, user: potentialPremiumAccount }
  }

  return false
}

export async function parseSketchFile(path: string, config: IFullKactusConfig) {
  return parseFile(path + '.sketch', config)
}

export function importSketchFile(
  sketchPath: string,
  path: string,
  config: IFullKactusConfig
) {
  return importFolder(path, config).then(() => {
    return runPluginCommand(
      sketchPath,
      Path.resolve(__dirname, './plugin.sketchplugin'),
      'refresh-files'
    )
  })
}

export function getKactusStoragePaths(
  repository: Repository,
  commitish: string,
  sketchFile: IKactusFile
) {
  const storagePath = Path.join(
    getUserDataPath(),
    'previews',
    String(repository.id),
    commitish
  )
  const sketchStoragePath = Path.join(storagePath, sketchFile.id)

  return {
    storagePath,
    sketchStoragePath,
  }
}
