#!/usr/bin/env node
const d = `${new Date()}`;
console.log(d);

import { Fountain } from 'fountain-js';
let fountain = new Fountain();

console.log(d);

export const foo = () => {
  return 1;
};
