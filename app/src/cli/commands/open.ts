import * as Path from 'path'

import { ICommandModule, mriArgv } from '../load-commands'
import { openKactus } from '../open-kactus'

const command: ICommandModule = {
  command: 'open <path>',
  aliases: ['<path>'],
  description: 'Open a git repository in Kactus',
  args: [
    {
      name: 'path',
      description: 'The path to the repository to open',
      type: 'string',
      required: false,
    },
  ],
  handler({ _: [pathArg] }: mriArgv) {
    if (!pathArg) {
      // just open Kactus
      openKactus()
      return
    }
    const repositoryPath = Path.resolve(process.cwd(), pathArg)
    const url = `openLocalRepo/${encodeURIComponent(repositoryPath)}`
    openKactus(url)
  },
}
export = command
