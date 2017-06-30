import * as Path from 'path'
import * as Fs from 'fs'
const _0777 = parseInt('0777', 8)

type IOptions = {
  mode?: number
}

export function mkdirP(
  p: string,
  opts?: IOptions | number,
  made?: string
): Promise<string> {
  if (!opts || typeof opts !== 'object') {
    opts = { mode: opts }
  }

  let mode = opts.mode

  if (mode === undefined) {
    mode = _0777 & ~process.umask()
  }

  p = Path.resolve(p)

  return new Promise((resolve, reject) => {
    Fs.mkdir(p, mode!, function(err) {
      if (!err) {
        resolve(made || p)
        return
      }

      switch (err!.code) {
        case 'ENOENT':
          mkdirP(Path.dirname(p), opts)
            .then((made: string) => {
              return mkdirP(p, opts, made)
            })
            .then(resolve)
            .catch(reject)
          break

        // In the case of any other error, just see if there's a dir
        // there already.  If so, then hooray!  If not, then something
        // is borked.
        default:
          Fs.stat(p, function(er2, stat) {
            // if the stat fails, then that's super weird.
            // let the original error be the failure reason.
            if (er2 || !stat.isDirectory()) {
              reject(err)
            } else {
              resolve(made)
            }
          })
          break
      }
    })
  })
}
