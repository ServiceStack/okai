#! /usr/bin/env node

import { cli } from "./index.js"

await cli(process.argv.slice(2))

export { cli }