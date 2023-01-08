#!/usr/bin/env node
import { Fountain } from 'fountain-js';
import yargs = require('yargs');
import { readFileSync } from 'fs';

// import { yargs } from 'yargs';

interface Arguments {
  fountainFile: string;
}

const main = () => {
  const opts = yargs.command(
    '* <fountainFile>',
    'default command',
    (yargs) =>
      yargs.positional('fountainFile', {
        describe: 'base URL',
        type: 'string',
        demandOption: true,
      }),
    (argv) => {
      let fountainFile: string = argv.fountainFile;
      console.log(`fountainFile: ${fountainFile}`);
      const text = readFileSync(fountainFile, 'utf-8');
      //   console.log(text);
      let fountain = new Fountain();
      let f = fountain.parse(text, true);
      console.log(f.tokens);
    }
  ).argv;

  const d = `${new Date()}`;
  console.log(d);
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
