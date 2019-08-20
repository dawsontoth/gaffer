#!/usr/bin/env node
require('yargs')
  .command({
    command: 'generate [directory]',
    aliases: ['gen', 'g'],
    desc: 'Recursively looks for .templateroots in the current directory, or supplied directory',
    builder: yargs => yargs.default('directory', './'),
    handler: argv => require('./src/generate/root').run(argv.directory),
  })
  .command({
    command: 'create [directory] [--overwrite]',
    aliases: ['c'],
    desc: 'Create a starting .templateroot in to the current directory, or supplied directory',
    builder: yargs => yargs.default('directory', './example.templateroot'),
    handler: argv => require('./src/create').run(argv.directory),
  })
  .options({
    'dry-run': {
      boolean: true,
      describe: 'Logs the changes that would be made without actually touching the file system.',
    },
    'into': {
      string: true,
      describe: 'Overrides the directory that .templateroots will target. Useful for targeting dynamic directories.',
    },
    'silent': {
      boolean: true,
      describe: 'Disables console logging.',
    },
    'no-colors': {
      boolean: true,
      describe: 'Turns off console coloring of text.',
    },
  })
  .demandCommand()
  .help()
  .wrap(72)
  .argv;
