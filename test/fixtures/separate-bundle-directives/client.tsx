'use client';

import { useState } from 'react';

export const ClientComponent = () => {
  const [count] = useState(0);

  return (
    <div>count: {count}</div>
  );
}

export { foo } from './client-foo';
