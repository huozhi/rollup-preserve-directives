"use server";

import { readFile } from 'fs/promises';

export const ServerComponent = async () => {
  const foo = await readFile('__virtual_data/foo.txt', 'utf8');

  return (
    <div>{foo}</div>
  );
}
