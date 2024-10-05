import { runTests } from './index.test'
import { rollup } from 'rollup2';

describe('preserve-directive (rollup 2)', () => {
  // @ts-expect-error -- rollup 2 type is incompatible w/
  runTests(rollup, 2);
});

