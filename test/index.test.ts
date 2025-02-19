import { tester } from './testing-utils';
import { rollup } from 'rollup';

import rollupPluginCommonjs from '@rollup/plugin-commonjs';

export const runTests = (rollupImpl: typeof rollup, version: number) => {
  it('should preserve shebang', async () => {
    const output = await tester(rollupImpl, {
      input: 'shebang/index.ts',
      version,
    });

    expect(output).toMatchSnapshot();
  });

  it('should preserve directives', async () => {
    const output = await tester(rollupImpl, {
      input: 'use-client/index.tsx'
    });

    expect(output).toMatchSnapshot();
  });

  it('should merge duplicated directives', async () => {
    const output = await tester(rollupImpl, {
      input: 'merge-duplicated-directives/index.ts'
    });

    expect(output).toMatchSnapshot();
  });

  it('should output separate directive for multiple output chunk', async () => {
    const output = await tester(rollupImpl, {
      input: {
        client: 'separate-bundle-directives/client.tsx',
        server: 'separate-bundle-directives/server.tsx'
      }
    });

    expect(output).toMatchSnapshot();
  });

  it('should not output shebang to other entry chunks', async () => {
    const output = await tester(rollupImpl, {
      input: {
        client: 'multi-entries/client.js',
        server: 'multi-entries/server.js',
        cli: 'multi-entries/cli.js',
      }
    });

    expect(output).toMatchSnapshot();
  })

  it('issue #9', async () => {
    const output = await tester(rollupImpl, {
      input: 'prop-types/index.js'
    });

    expect(output).toMatchSnapshot();
  });

  it('fix string constant introduced by rollup commonjs', async () => {
    const output = await tester(rollupImpl, {
      input: 'commonjs-virtual-modules/index.js',
      otherPlugins: [rollupPluginCommonjs()]
    });

    expect(output).toMatchSnapshot();
  });

  it('should support complex directive like `use abc:type`', async () => {
    const output = await tester(rollupImpl, {
      input: 'complex-directive/index.js'
    });
    expect(output).toMatchSnapshot();
  })
}

describe('preserve-directive (rollup 4)', () => {
  runTests(rollup, 4);
});
