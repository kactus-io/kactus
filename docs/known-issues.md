# Known Issues

This document outlines acknowledged issues with Kactus, including workarounds if known.

## What should I do if...

### I have encountered an issue listed here?

Some known issues have a workaround that users have reported addresses the issue. Please try the workaround for yourself to confirm it addresses the issue.

### I have additional questions about an issue listed here?

Each known issue links off to an existing GitHub issue. If you have additional questions or feedback, please comment on the issue.

### My issue is not listed here?

Please check the [open](https://github.com/kactus-io/kactus/labels/bug) and [closed](https://github.com/kactus-io/kactus/issues?q=is%3Aclosed+label%3Abug) bugs in the issue tracker for the details of your bug. If you can't find it, or if you're not sure, open a [new issue](https://github.com/kactus-io/kactus/issues/new?template=bug_report.md?template=bug_report.md).

## macOS

### Checking for updates triggers a 'Could not create temporary directory: Permission denied' message - [#4115](https://github.com/desktop/desktop/issues/4115)

This issue seems to be caused by missing permissions for the `~/Library/Caches/io.kactus.KactusClient.ShipIt` folder. This is a directory that Desktop uses to create and unpack temporary files as part of updating the application.

**Workaround:**

 - Close Kactus
 - Open Finder and navigate to `~/Library/Caches/`
 - Context-click `io.kactus.KactusClient.ShipIt` and select **Get Info**
 - Expand the **Sharing & Permissions** section
 - If you do not see the "You can read and write" message, add yourself with
   the "Read & Write" permissions
 - Start Kactus again and check for updates

### App frozen or very slow after creating new repository - [#67](https://github.com/kactus-io/kactus/issues/67)

when you first add a file, hundreds (even thousands) of files are created so Kactus has some issue to grab them all.

Once you commit it tho, only the changes are showing up so there are a lot fewer files popping up, especially if you commit often.

**Workaround:**

- Close Kactus
- Open a terminal in your git repository (You can do so from Kactus)
- Run `git add . && git commit -m "first commit"`
- Reopen Kactus

### 'The username or passphrase you entered is not correct' error after signing into account - [#3263](https://github.com/desktop/desktop/issues/3263)

This seems to be caused by the Keychain being in an invalid state, affecting applications that try to use the keychain to store or retrieve credentials. Seems to be specific to macOS High Sierra (10.13).

**Workaround:**

- Open `Keychain Access.app`
- Right-click on the `login` keychain and try locking it
- Right-click on the `login` keychain and try unlocking it
- Sign into your GitHub account again
