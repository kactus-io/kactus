# Installing Kactus

Kactus currently supports macOS 10.9 (or higher).

### macOS

Download the `Kactus.zip`, unpack the application and put it wherever you want.

## Data Directories

Kactus will create directories to manage the files and data it needs to function. If you manage a network of computers and want to install Kactus, here is more information about how things work.

### macOS
 - `~/Library/Application Support/Kactus/` - this directory contains user-specific data which the application requires to run, and is created on launch if it doesn't exist. Log files are also stored in this location.

## Log Files

Kactus will generate log files if an unhandled exception is raised, to assist with troubleshooting. They are located in the data directory that Kactus uses (see above) under a `logs` subdirectory, organized by date using the format `YYYY-MM-DD.kactus.production.log`, where `YYYY-MM-DD` is the day the log was created.
