import { git } from './core'
import { Repository } from '../../models/repository'

export async function getHEADsha(repository: Repository): Promise<string> {
  return (await git(
    ['rev-parse', 'HEAD'],
    repository.path,
    'getHEADsha'
  )).stdout.trim()
}
