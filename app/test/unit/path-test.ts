import { encodePathAsUrl } from '../../src/lib/path'

describe('path', () => {
  describe('encodePathAsUrl', () => {
    it('encodes spaces and hashes', () => {
      const dirName =
        '/Users/The Kong #2\\AppData\\Local\\Kactus\\app-1.0.4\\resources\\app'
      const uri = encodePathAsUrl(dirName, 'index.html')
      expect(uri.startsWith('file:////Users/The%20Kong%20%232/'))
    })
  })
})
