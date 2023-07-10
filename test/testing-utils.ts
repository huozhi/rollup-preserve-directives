import path from 'path';
import { Module } from 'module';
import { rollup } from 'rollup';

import { swc } from 'rollup-plugin-swc3';
import preserveDirective from '../src';

import type { ExternalOption, InputOption } from 'rollup';

interface BuildTestOption {
  input?: InputOption,
  sourcemap?: boolean,
  dir?: string,
  external?: ExternalOption
}

const DEFAULT_EXTERNAL = ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'].concat(Module.builtinModules);

export const tester = async (
  rollupImpl: typeof rollup,
  {
    input = './fixture/index.js',
    sourcemap = false,
    dir = path.resolve(__dirname, 'fixtures'),
    external = DEFAULT_EXTERNAL
  }: BuildTestOption = {}
) => {
  const build = await rollupImpl({
    input: (() => {
      if (typeof input === 'string') {
        return path.resolve(dir, input);
      }
      if (Array.isArray(input)) {
        return input.map((v) => path.resolve(dir, v));
      }
      return Object.entries(input).reduce<Record<string, string>>((acc, [key, value]) => {
        acc[key] = path.resolve(dir, value);
        return acc;
      }, {});
    })(),
    plugins: [swc(), preserveDirective()] as any,
    external
  });

  const { output } = await build.generate({ format: 'esm', sourcemap });

  return output.reduce<Record<string, string>>((acc, cur) => {
    if ('code' in cur) {
      acc[cur.name] = cur.code;
    }
    // OutputAssets are intentionally ignored
    return acc;
  }, {});
};
