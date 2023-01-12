#!/usr/bin/env node
import { Fountain, Token } from 'fountain-js';
import yargs = require('yargs');
import { readFileSync } from 'fs';
import wrap = require('word-wrap');
import { listenerCount } from 'process';
import { debug } from 'console';
const DEBUG = true;
const dbg = (msg: string) => {
  if (DEBUG) {
    debug(msg);
  }
};

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

interface SceneHeader {
  rawHead: string;
  ie: string;
  loc: string;
  tod: string;
}

export const cleanCharacter = (raw: string): string => {
  let t = raw.trim();
  // remove (O.S.) (V.O.) (CONT'D) etc
  t = raw.replaceAll(/\([^\)]+\)/g, '');
  t = t.trim();
  // remove dual
  t = t.replaceAll(/\s*[\^]+\s*/g, '');
  t = t.replaceAll(/^\@+/g, '');
  return t.trim();
};
export const parseSceneHeading = (t: string) => {
  let sh = {
    rawHead: t,
    ie: '-',
    loc: '-',
    tod: '-',
  };

  // parse leading INT./EXT.
  let ieRegex = /^([\S]+\. )/;
  let ieMatch = t.match(ieRegex);
  if (ieMatch) {
    sh.ie = ieMatch[1].trim();
    // strip it
    t = t.replace(ieRegex, '');
  }
  let parts = t.split(' - ');
  sh.loc = parts[0];
  if (parts.length > 1) {
    sh.tod = parts[1];
  }
  return sh;
};

const tokenType = (key: string): TokenType => {
  let typedKey = key as keyof typeof TokenType;
  return TokenType[typedKey];
};

const tokenIs = (token: Token, tokenType: TokenType): boolean => {
  let tokenTypeString = TokenType[tokenType];
  return token.type == tokenTypeString;
};

const numWrappedLines = (text: string, charsPerLine: number): number => {
  let wrapped = wrap(text, { width: charsPerLine });
  let lines = wrapped.split('\n');
  return lines.length;
};

export const calcLines = (token: Token): number => {
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
    case TokenType.dual_dialogue_begin:
    case TokenType.dialogue_end:
    case TokenType.dual_dialogue_end:
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

class PriorContext {
  linesPerPage = 54;
  scene?: Scene;
  synopsis?: string;
  numLines: number;
  dualDialogContext: boolean;
  dualDialogNumLines: number;
  prevToken?: Token;
  constructor(scene?: Scene, synopsis?: string, numLines?: number, dualDialogNumLines?: number) {
    this.scene = scene;
    this.synopsis = synopsis;
    this.numLines = numLines || 0;
    this.dualDialogNumLines = dualDialogNumLines || 0;
    this.dualDialogContext = false;
  }

  get pagesWhole(): number {
    return Math.floor(this.numLines / this.linesPerPage);
  }

  get pagesEighth(): number {
    let remainder = this.numLines / this.linesPerPage - this.pagesWhole;
    return Math.ceil(remainder * 8);
  }

  public print(): void {
    if (this.scene) {
      let items = this.scene.rowItems;
      items = items.concat([`${this.numLines}`, `${this.pagesWhole}`, `${this.pagesEighth}`]);
      let row = items.join('\t');
      console.log(row);
    }
  }

  public handleToken(token: Token) {
    if (tokenIs(token, TokenType.dual_dialogue_begin)) {
      this.dualDialogContext = true;
    }
    if (tokenIs(token, TokenType.dual_dialogue_end)) {
      this.dualDialogContext = false;
    }
    this.addLinesPrev(token);
    this.addLines(token);
    this.prevToken = token;
  }

  public addLines(token: Token): void {
    let numLinesWrapped = calcLines(token);
    // if we're dualDialogContext, use the max
    if (this.dualDialogContext) {
      if (numLinesWrapped > this.dualDialogNumLines) {
        // subtract the old num we used (which may be 0)
        this.numLines -= this.dualDialogNumLines;
        this.dualDialogNumLines = numLinesWrapped;
        // add the new num lines
        this.numLines += numLinesWrapped;
      }
    } else {
      this.numLines += numLinesWrapped;
    }
    // dbg(
    //   `${token.type} < ${token.text?.slice(0, 10)} > addLines: ${numLinesWrapped} / ${
    //     this.numLines
    //   }`
    // );
  }

  public addLinesPrev(token: Token) {
    if (!this.prevToken) {
      return;
    }
    let tokType = tokenType(token.type);
    switch (tokType) {
      // scenes are preceded by a double blank line
      case TokenType.scene_heading:
        this.numLines += 2;
      case TokenType.character:
      case TokenType.action:
        this.numLines += 1;
      // TODO: TokenType.page_break
      default:
        return;
    }
  }
}

class Report {
  context: PriorContext;
  constructor() {
    this.context = new PriorContext();
  }

  printAndResetOnNewScene(t: Token) {
    if (tokenIs(t, TokenType.scene_heading)) {
      // this won't print the first time we see a scene,
      // because context.scene is null:
      this.context.print();
      this.context = new PriorContext();
      this.context.scene = Scene.fromToken(t);
    }
  }

  public run(tokens: Token[]) {
    let header = [
      'ie',
      'loc',
      'tod',
      'sceneNumber',
      'rawHead',
      'initialText',
      'numLines',
      'numPagesWhole',
      'numPagesEighth',
    ];
    console.log(header.join('\t'));
    tokens.forEach((t) => {
      this.context.handleToken(t);
      this.context.scene?.setInitialText(t);
      this.printAndResetOnNewScene(t);
    });
    this.context.print();
  }
}

class Scene {
  rawHead: string;
  ie: string;
  loc?: string;
  tod?: string;
  sceneNumber?: string;
  numLines: number;
  initialText: string;

  constructor(rawHead: string, ie: string, loc?: string, tod?: string, sceneNumber?: string) {
    this.rawHead = rawHead;
    this.ie = ie;
    this.loc = loc;
    this.tod = tod;
    this.sceneNumber = sceneNumber;
    this.numLines = 0;
    this.initialText = '';
  }

  static fromToken(token: Token): Scene {
    let rawHead = token.text || '';
    let sceneNumber = token.scene_number;
    let sh = parseSceneHeading(rawHead);
    return new Scene(rawHead, sh.ie, sh.loc, sh.tod, sceneNumber);
  }

  get rowItems(): string[] {
    return [
      this.ie || '-',
      this.loc || '-',
      this.tod || '-',
      this.sceneNumber || '-',
      this.rawHead || '-',
      this.initialText || '',
    ].map((i) => i.replaceAll(/\t/g, ''));
  }
  get row(): string {
    return this.rowItems.join('\t');
  }

  public setInitialText(token: Token) {
    if (this.initialText == '') {
      if (token.text != undefined && token.text != '') {
        this.initialText =
          token.text
            .replaceAll(/\t/g, '')
            .replaceAll(/<[^<]+>/g, '')
            .slice(0, 30) + '...';
      }
    }
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
      const text = readFileSync(fountainFile, 'utf-8');
      let fountain = new Fountain();
      let f = fountain.parse(text, true);

      let report = new Report();
      report.run(f.tokens || []);
    }
  ).argv;
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
