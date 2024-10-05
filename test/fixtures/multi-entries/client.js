'use client'

import { foo } from './foo'

export function client() {
  return 'client' + foo
}
