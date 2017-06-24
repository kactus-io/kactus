import * as Path from 'path'
import * as Fs from 'fs'

/** Symlink the sketch plugin to the sketch plugin folder */
export function symlinkSketchPlugin() {
  // skip a thread not to delay the startup
  Promise.resolve().then(() => {
    const pluginDirectory = require('os').homedir() + '/Library/Application Support/com.bohemiancoding.sketch3/Plugins/'
    const pluginPath = Path.join(pluginDirectory, 'kactus.sketchplugin')

    // check if the plugin is already there
    Fs.stat(pluginPath, (err) => {
      if (err) {
        Fs.symlink(Path.resolve(__dirname, './plugin.sketchplugin'), pluginPath, undefined, (err) => {
          console.error(err)
        })
      }
    })
  })
}
