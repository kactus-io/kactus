import * as Fs from 'fs'
import * as Path from 'path'
import { git } from './core'
import { Repository } from '../../models/repository'
import { execFile } from 'child_process'

/**
 * Export the given commit to the given output path.
 *
 * @param repository - The repository in which the branch checkout should
 *                     take place
 *
 * @param commitish - The commit that should be checked out
 *
 * @param output - The output path
 */
export async function exportTreeAtCommit(
  repository: Repository,
  commitish: string,
  output: string
): Promise<void> {
  const archive = commitish + '.tar'

  const args = ['archive', commitish, '-o', Path.join(output, archive)]

  await git(args, repository.path, 'exportCommit')

  await new Promise<void>((resolve, reject) => {
    const execOptions = {
      cwd: output,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    }
    execFile(
      '/usr/bin/tar',
      ['-x', '-f', archive, '-C', commitish],
      execOptions,
      err => {
        if (err) {
          return reject(err)
        }
        resolve()
      }
    )
  })

  await new Promise<void>((resolve, reject) => {
    Fs.unlink(Path.join(output, archive), err => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}
