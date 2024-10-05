import { runTests } from './index.test'
import { rollup } from 'rollup3';

describe('preserve-directive (rollup 2)', () => {
  // @ts-expect-error -- rollup 3 type is incompatible
  runTests(rollup, 3);
});

