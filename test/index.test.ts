import { tester } from './testing-utils';
import { rollup } from 'rollup';

const tests = (rollupImpl: typeof rollup) => {
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
}

describe('preserve-directive (rollup 3)', () => {
  tests(rollup);
});

// TODO: add test case for rollup 2
