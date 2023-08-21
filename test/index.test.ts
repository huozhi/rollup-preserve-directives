import { tester } from './testing-utils';
import { rollup as rollup3 } from 'rollup';
import { rollup as rollup2 } from 'rollup2';

const tests = (rollupImpl: typeof rollup3) => {
  it('should preserve shebang', async () => {
    const output = await tester(rollupImpl, {
      input: 'shebang/index.ts'
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
}

describe('preserve-directive (rollup 3)', () => {
  tests(rollup3);
});

describe('preserve-directive (rollup 2)', () => {
  // @ts-expect-error -- rollup 2 type is imcompatible w/ rollup 3
  tests(rollup2);
});
