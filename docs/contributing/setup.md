#  Development Environment Setup

## Setup

You will need to install these tools on your machine:

### macOS

See [mac-deps-setup.md](./setup-macos.md).

## Verification

Then verify you have these commands available in your shell and that the found
versions look similar to the below output:

```shellsession
$ node -v
v8.11.4

$ python --version
Python 2.7.13
```

There are also [additional resources](tooling.md) to
configure your favourite editor to work nicely with the Kactus
repository.

## Building Kactus

After cloning the repository, the typical workflow to get up running
is as follows:

* Run `npm install` to get all required dependencies on your machine.
* Run `npm run build:dev` to create a development build of the app.
* Run `npm run start` to launch the application. Changes will be compiled in the
  background. The app can then be reloaded to see the changes (<kbd>Ctrl/Command+Alt+R</kbd>).

**Optional Tip**: You can use `screen` to avoid filling your terminal with logging output:

```shellsession
$ screen -S "kactus" npm run start # -S sets the name of the session; you can pick anything
$ # Your screen clears and shows logs. Press Ctrl+A then D to exit.
[detached]
$ screen -R "kactus" # to reopen the session, read the logs, and exit (Ctrl+C)
[screen is terminating]
```

If you've made changes in the `main-process` folder you need to run `npm run
build:dev` to rebuild the package, and then `npm run start` for these changes to be
reflected in the running app.

## Running tests

- `npm run test` - Runs all unit and integration tests
- `npm run test:unit` - Runs all unit tests
- `npm run test:integration` - Runs all integration tests

## Debugging

Electron ships with Chrome Dev Tools to assist with debugging, profiling and
other measurement tools.

1. Run the command `npm start` to launch the app
2. Under the **View** menu, select **Toggle Developer Tools**

When running the app in development mode,
[React Dev Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en)
should automatically install itself on first start when in development mode.

An additional extension, [Devtron](http://electron.atom.io/devtron/), is also
included but is disabled by default. To enable Devtron, select the Console
tab in Chrome Developer Tools and run this command:

```js
require('devtron').install()
```

## The Next Steps

You're almost there! Here's a couple of things we recommend you read next:

 - [Help Wanted](../../.github/CONTRIBUTING.md#help-wanted) - we've marked some
   tasks in the backlog that are ideal for external contributors
 - [Notes for Contributors](../process/notes-for-contributors.md) - some notes
   for new contributors getting started
