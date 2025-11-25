#!/usr/bin/env node

import { cli } from '../dist/index.js'

await cli(process.argv.slice(2))

