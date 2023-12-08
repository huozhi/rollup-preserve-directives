import { tester } from './testing-utils';
import { rollup as rollup3 } from 'rollup';
import { rollup as rollup2 } from 'rollup2';
import { rollup as rollup4 } from 'rollup4';

import rollupPluginCommonjs from '@rollup/plugin-commonjs';

const runTests = (rollupImpl: typeof rollup3, version: number) => {
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
}

describe('preserve-directive (rollup 2)', () => {
  // @ts-expect-error -- rollup 2 type is incompatible w/ rollup 3
  runTests(rollup2, 2);
});


describe('preserve-directive (rollup 3)', () => {
  runTests(rollup3, 3);
});

describe('preserve-directive (rollup 4)', () => {
  // @ts-expect-error -- rollup 4 type is incompatible w/ rollup 3
  runTests(rollup4, 4);
});
