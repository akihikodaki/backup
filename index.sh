#!/usr/bin/env sh
# Node.js on Windows with default configuration does not have dirname and
# readlink command. Use Node.js instead.
cd `node -p 'require("path").dirname(require("fs").realpathSync(process.argv[1]))' "$0"`

# Node.js on Windows with default configuration cannot execute "npm bin" on sh.
# Execute it on Node.js.
PATH="`node -e 'require("child_process").spawn("npm", ["bin"], { shell: true, stdio: "inherit" })'`:$PATH" exec "$@"
