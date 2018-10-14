import { expect } from 'chai'
import { toPlatformCase } from '../../src/lib/platform-case'

describe('string to platform case', () => {
  it('convert string to detected platform text case', () => {
    const result = toPlatformCase(' this should be title case.')
    expect(result).to.equal(' This Should Be Title Case.')
  })
})
