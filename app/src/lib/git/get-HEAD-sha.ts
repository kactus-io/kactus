import { git } from './core'
import { Repository } from '../../models/repository'

export async function getHEADsha(
  repository: Repository,
  kind?: 'HEAD' | 'ORIG_HEAD' | 'MERGE_HEAD'
): Promise<string> {
  return (await git(
    ['rev-parse', kind || 'HEAD'],
    repository.path,
    'getHEADsha'
  )).stdout.trim()
}
