#!/usr/bin/env node
import { Fountain } from 'fountain-js';
import yargs = require('yargs');
// import { yargs } from 'yargs';

const main = () => {
  const argv = yargs
    .command('lyr', 'Tells whether an year is leap year or not', {
      year: {
        description: 'the year to check for',
        alias: 'y',
        type: 'number',
      },
    })
    .option('time', {
      alias: 't',
      description: 'Tell the present Time',
      type: 'boolean',
    })
    .help()
    .alias('help', 'h').argv;

  const d = `${new Date()}`;
  console.log(d);

  let fountain = new Fountain();

  console.log(d);
};

export const foo = () => {
  return 1;
};

// Check if we are running as a cli
// Can't use === module because we have a lightweight wrapper at
// bin/fountain-stats
if (typeof require !== 'undefined' && require.main?.filename?.match(/fountain-stats/)) {
  main();
}
