import { getDotComAPIEndpoint, IAPIEmail } from '../lib/api'

/**
 * A GitHub account, representing the user found on GitHub The Website or GitHub Enterprise.
 *
 * This contains a token that will be used for operations that require authentication.
 */
export class Account {
  /** Create an account which can be used to perform unauthenticated API actions */
  public static anonymous(): Account {
    return new Account(
      '',
      getDotComAPIEndpoint(),
      '',
      [],
      '',
      -1,
      '',
      false,
      false
    )
  }

  public constructor(
    /** The login name for this account  */
    public readonly login: string,
    /** The server for this account - GitHub or a GitHub Enterprise instance */
    public readonly endpoint: string,
    /** The access token used to perform operations on behalf of this account */
    public readonly token: string,
    /** The current list of email addresses associated with the account */
    public readonly emails: ReadonlyArray<IAPIEmail>,
    /** The profile URL to render for this account */
    public readonly avatarURL: string,
    /** The database id for this account */
    public readonly id: number,
    /** The friendly name associated with this account */
    public readonly name: string,
    /** Wether the user has full access to Kactus */
    public readonly unlockedKactus: boolean,
    /** Wether the user has enterprise access to Kactus */
    public readonly unlockedEnterpriseKactus: boolean
  ) {}

  public withToken(token: string): Account {
    return new Account(
      this.login,
      this.endpoint,
      token,
      this.emails,
      this.avatarURL,
      this.id,
      this.name,
      this.unlockedKactus,
      this.unlockedEnterpriseKactus
    )
  }

  public unlockKactus(enterprise: boolean): Account {
    return new Account(
      this.login,
      this.endpoint,
      this.token,
      this.emails,
      this.avatarURL,
      this.id,
      this.name,
      enterprise ? false : true,
      enterprise ? true : false
    )
  }

  public cancelKactusSubscription(): Account {
    return new Account(
      this.login,
      this.endpoint,
      this.token,
      this.emails,
      this.avatarURL,
      this.id,
      this.name,
      false,
      false
    )
  }
}
