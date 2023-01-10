#!/usr/bin/env node
import { Fountain, Token } from 'fountain-js';
import yargs = require('yargs');
import { readFileSync } from 'fs';
import wrap = require('word-wrap');
import { listenerCount } from 'process';

enum TokenType {
  title = 'title',
  credit = 'credit',
  author = 'author',
  authors = 'authors',
  source = 'source',
  notes = 'notes',
  draft_date = 'draft_date',
  date = 'date',
  contact = 'contact',
  copyright = 'copyright',
  scene_heading = 'scene_heading',
  transition = 'transition',
  dual_dialogue_begin = 'dual_dialogue_begin',
  dialogue_begin = 'dialogue_begin',
  character = 'character',
  parenthetical = 'parenthetical',
  dialogue = 'dialogue',
  dialogue_end = 'dialogue_end',
  dual_dialogue_end = 'dual_dialogue_end',
  section = 'section',
  synopsis = 'synopsis',
  note = 'note',
  boneyard_begin = 'boneyard_begin',
  boneyard_end = 'boneyard_end',
  action = 'action',
  centered = 'centered',
  lyrics = 'lyrics',
  page_break = 'page_break',
  line_break = 'line_break',
}

const tokenType = (key: string): TokenType => {
  let typedKey = key as keyof typeof TokenType;
  return TokenType[typedKey];
};

const tokenIs = (token: Token, tokenType: TokenType): boolean => {
  let tokenTypeString = TokenType[tokenType];
  return token.type == tokenTypeString;
};

const numWrappedLines = (text: string, charsPerLine: number): Number => {
  let wrapped = wrap(text, { width: charsPerLine });
  let lines = wrapped.split('\n');
  return lines.length;
};

export const calcLines = (token: Token): Number => {
  let text = token.text || '';
  switch (tokenType(token.type)) {
    case TokenType.scene_heading:
    case TokenType.action:
    case TokenType.transition:
    case TokenType.centered:
      return numWrappedLines(text, 63);
      break;
    case TokenType.character:
    case TokenType.dialogue:
      return numWrappedLines(text, 34);
      break;
    case TokenType.parenthetical:
      return numWrappedLines(text, 26);
      break;
    case TokenType.lyrics:
      return numWrappedLines(text, 48);
      break;
    case TokenType.line_break:
      return 1;
    case TokenType.title:
    case TokenType.credit:
    case TokenType.author:
    case TokenType.authors:
    case TokenType.source:
    case TokenType.notes:
    case TokenType.draft_date:
    case TokenType.date:
    case TokenType.contact:
    case TokenType.copyright:
    case TokenType.dual_dialogue_begin: // TODO:
    case TokenType.dialogue_end: // TODO:
    case TokenType.dual_dialogue_end: // TODO:
    case TokenType.section:
    case TokenType.synopsis:
    case TokenType.note:
    case TokenType.boneyard_begin:
    case TokenType.boneyard_end:
    case TokenType.page_break:
    default:
      return 0;
  }
};

class Scene {
  rawText: string;
  ie: string;
  loc: string | undefined;
  tod: string | undefined;
  sceneNumber: string | undefined;
  numLines: Number;

  constructor(
    rawText: string,
    ie: string,
    loc: string | undefined,
    tod: string | undefined,
    sceneNumber: string | undefined
  ) {
    this.rawText = rawText;
    this.ie = ie;
    this.loc = loc;
    this.tod = tod;
    this.sceneNumber = sceneNumber;
    this.numLines = 0;
  }

  static fromToken(token: Token): Scene {
    let rawText = token.text || '';
    let sceneNumber = token.scene_number;
    let parts = rawText.split(' - ');
    let ie = parts[0];

    let loc = undefined;
    if (parts.length > 1) {
      loc = parts[1];
    }

    let tod = undefined;
    if (parts.length > 2) {
      tod = parts[2];
    }
    return new Scene(rawText, ie, loc, tod, sceneNumber);
  }

  get row(): string {
    return [
      this.ie || '',
      this.loc || '',
      this.tod || '',
      this.sceneNumber || '',
      this.rawText || '',
    ]
      .map((i) => i.replaceAll(/\t/, ''))
      .join('\t');
  }
}

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
      f.tokens?.forEach((t) => {
        console.log(tokenType(t.type));
        if (tokenIs(t, TokenType.scene_heading)) {
          console.log('-------------------');
          let scene = Scene.fromToken(t);
          console.log(scene.row);
        }
      });
      console.log(TokenType['scene_heading'] === TokenType.scene_heading);
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
