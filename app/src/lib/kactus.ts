import { ensureDir, writeFile, remove } from 'fs-extra'
import * as Path from 'path'
import { exec } from 'child_process'
import {
  find,
  IKactusFile as _IKactusFile,
  IKactusConfig,
  parseFile,
  importFolder,
} from 'kactus-cli'
import { getUserDataPath, getTempPath } from '../ui/lib/app-proxy'
import { Repository } from '../models/repository'
import { Account } from '../models/account'
import { Image } from '../models/diff'
import { IGitAccount } from './git/authentication'
import { getDotComAPIEndpoint } from './api'
import { sketchtoolPath, runPluginCommand, getSketchVersion } from './sketch'
import * as Perf from '../ui/lib/perf'

export type IFullKactusConfig = IKactusConfig & { sketchVersion?: string }
export type IKactusFile = _IKactusFile & {
  isParsing: boolean
  isImporting: boolean
  preview?: Image
  previewError?: boolean
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
  const commandName = `[Kactus] get kactus status`
  return Perf.measure(commandName, async () => {
    const kactus = await find(repository.path)
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
  })
}

export async function generateDocumentPreview(
  sketchPath: string,
  file: string,
  output: string
): Promise<string> {
  const commandName = `[Kactus] generate document preview`
  return Perf.measure(commandName, async () => {
    await ensureDir(output)
    return new Promise<string>((resolve, reject) => {
      exec(
        sketchtoolPath(sketchPath) +
          ' export preview "' +
          file +
          '" --output="' +
          output +
          '" --filename=document.png --overwriting=YES --max-size=1000 --compression=0.7 --save-for-web=YES',
        (err, stdout, stderr) => {
          if (err) {
            return reject(err)
          }
          resolve(output + '/document.png')
        }
      )
    })
  })
}

export async function generatePagePreview(
  sketchPath: string,
  file: string,
  name: string,
  output: string
): Promise<string> {
  const commandName = `[Kactus] generate page preview`
  return Perf.measure(
    commandName,
    () =>
      new Promise<string>((resolve, reject) => {
        exec(
          sketchtoolPath(sketchPath) +
            ' export pages "' +
            file +
            '" --item="' +
            name +
            '" --output="' +
            output +
            '" --save-for-web=YES --use-id-for-name=YES --overwriting=YES --formats=png --compression=0.7',
          (err, stdout, stderr) => {
            if (err) {
              return reject(err)
            }
            const id = stdout.replace('Exported', '').trim()
            resolve(output + '/' + id)
          }
        )
      })
  )
}

export async function generateArtboardPreview(
  sketchPath: string,
  file: string,
  id: string,
  output: string
): Promise<string> {
  const commandName = `[Kactus] generate artboard preview`
  return Perf.measure(
    commandName,
    () =>
      new Promise<string>((resolve, reject) => {
        exec(
          sketchtoolPath(sketchPath) +
            ' export artboards "' +
            file +
            '" --item="' +
            id +
            '" --output="' +
            output +
            '" --save-for-web=YES --use-id-for-name=YES --overwriting=YES --include-symbols=YES --formats=png --compression=0.7',
          (err, stdout, stderr) => {
            if (err) {
              return reject(err)
            }
            resolve(output + '/' + id + '.png')
          }
        )
      })
  )
}

export async function generateLayerPreview(
  sketchPath: string,
  file: string,
  id: string,
  output: string
): Promise<string> {
  const commandName = `[Kactus] generate layer preview`
  return Perf.measure(
    commandName,
    () =>
      new Promise<string>((resolve, reject) => {
        exec(
          sketchtoolPath(sketchPath) +
            ' export layers "' +
            file +
            '" --item="' +
            id +
            '" --output="' +
            output +
            '" --save-for-web=YES --use-id-for-name=YES --overwriting=YES --formats=png --compression=0.7',
          (err, stdout, stderr) => {
            if (err) {
              return reject(err)
            }
            resolve(output + '/' + id + '.png')
          }
        )
      })
  )
}

export async function saveKactusConfig(
  repository: Repository,
  config: IFullKactusConfig
): Promise<void> {
  const commandName = `[Kactus] save kactus config`
  return Perf.measure(commandName, async () => {
    const configPath = Path.join(repository.path, 'kactus.json')

    const configToSave = { ...config }
    delete configToSave.sketchVersion
    if (configToSave.root === repository.path) {
      delete configToSave.root
    } else if (configToSave.root) {
      configToSave.root = configToSave.root.replace(repository.path, '.')
    }

    return await writeFile(configPath, JSON.stringify(configToSave, null, 2))
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

  let potentialPremiumAccount =
    accounts.find(a => a.unlockedEnterpriseKactus) ||
    accounts.find(a => a.unlockedKactus)

  if (!potentialPremiumAccount && account instanceof Account) {
    potentialPremiumAccount = account
  }

  if (!potentialPremiumAccount) {
    potentialPremiumAccount = accounts[0]
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
      !potentialPremiumAccount.unlockedEnterpriseKactus
    ) {
      return { enterprise: true, user: potentialPremiumAccount }
    }
    if (
      repository.gitHubRepository.private &&
      (!potentialPremiumAccount.unlockedKactus &&
        !potentialPremiumAccount.unlockedEnterpriseKactus)
    ) {
      return { enterprise: false, user: potentialPremiumAccount }
    }
  } else if (
    !potentialPremiumAccount ||
    !potentialPremiumAccount.unlockedEnterpriseKactus
  ) {
    return { enterprise: true, user: potentialPremiumAccount }
  }

  return false
}

export async function parseSketchFile(
  repository: Repository,
  f: IKactusFile,
  config: IFullKactusConfig
) {
  const commandName = `[Kactus] parse file ${f.id}`
  return Perf.measure(commandName, async () => {
    const storagePath = Path.join(
      getTempPath(),
      'kactus',
      String(repository.id),
      f.id
    )
    await remove(storagePath)
    return parseFile(f.path + '.sketch', config)
  })
}

export async function importSketchFile(
  repository: Repository,
  sketchPath: string,
  f: IKactusFile,
  config: IFullKactusConfig
) {
  const commandName = `[Kactus] import file ${f.id}`
  return Perf.measure(commandName, async () => {
    const storagePath = Path.join(
      getTempPath(),
      'kactus',
      String(repository.id),
      f.id
    )
    await remove(storagePath)
    await importFolder(f.path, config)
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
