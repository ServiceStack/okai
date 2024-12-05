import type { BuildConfig } from 'bun'
import dts from 'bun-plugin-dts'

const defaultBuildConfig: BuildConfig = {
  entrypoints: ['./src/index.ts','./src/okai.ts'],
  outdir: './dist'
}

await Promise.all([
  Bun.build({
    ...defaultBuildConfig,
    target: "node",
    plugins: [dts()],
    format: 'esm',
    naming: "[dir]/[name].js",
  }),
])