import { IKactusStatusResult, find } from 'kactus-cli'
import { Repository } from '../models/repository'

/**
 *  Retrieve the status for a given repository,
 *  and fail gracefully if the location is not a Git repository
 */
export async function getKactusStatus(repository: Repository): Promise<IKactusStatusResult> {
  return Promise.resolve().then(() => {
    const kactus = find(repository.path)
    return {
      config: kactus.config,
      files: kactus.files.map(f => {
        return {
          ...f,
          id: f.path.replace(repository.path, '').replace(/^\//, ''),
        }
      }),
    }
  })
}
