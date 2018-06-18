import { expect } from 'chai'

import { Account, Provider } from '../../src/models/account'
import { AccountsStore } from '../../src/lib/stores'
import { InMemoryStore, AsyncInMemoryStore } from '../helpers/stores'

describe('AccountsStore', () => {
  let accountsStore: AccountsStore | null = null
  beforeEach(() => {
    accountsStore = new AccountsStore(
      new InMemoryStore(),
      new AsyncInMemoryStore()
    )
  })

  describe('adding a new user', () => {
    it('contains the added user', async () => {
      const newAccountLogin = 'joan'
      await accountsStore!.addAccount(
        new Account(
          Provider.GitHub,
          newAccountLogin,
          '',
          'deadbeef',
          [],
          '',
          1,
          '',
          false,
          false
        )
      )

      const users = await accountsStore!.getAll()
      expect(users[0].login).to.equal(newAccountLogin)
    })
  })
})
