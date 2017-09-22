#!/bin/sh

CONTENTS="$(dirname "$(dirname "$(dirname "$(dirname "$(realpath "$0")")")")")"
ELECTRON="$CONTENTS/Kactus.exe"
CLI="$CONTENTS/Resources/app/cli.js"

ELECTRON_RUN_AS_NODE=1 "$ELECTRON" "$CLI" "$@"

exit $?
