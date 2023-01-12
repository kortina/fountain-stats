import 'jest';
import { foo, calcLines, cleanCharacter, parseSceneHeading } from '../../index';

test('foo', () => {
  expect(foo()).toBe(1);
});

test('calcLines', () => {
  let ten = '1234 6789 ';
  let twenty = ten + ten;
  let forty = twenty + twenty;
  let eighty = forty + forty;
  let oneSixty = eighty + eighty;
  expect(calcLines({ type: 'scene_heading', text: twenty })).toBe(1);
  expect(calcLines({ type: 'scene_heading', text: forty })).toBe(1);
  expect(calcLines({ type: 'scene_heading', text: eighty })).toBe(2);
  expect(calcLines({ type: 'character', text: twenty })).toBe(1);
  expect(calcLines({ type: 'character', text: forty })).toBe(2);
  expect(calcLines({ type: 'action', text: twenty })).toBe(1);
  expect(calcLines({ type: 'action', text: forty })).toBe(1);
  expect(calcLines({ type: 'action', text: eighty })).toBe(2);
  expect(calcLines({ type: 'action', text: oneSixty })).toBe(3);
});

test('parseSceneHeading', () => {
  let t = 'INT. ELLIE’S KITCHEN - NIGHT [LATER]';
  expect(parseSceneHeading(t).rawHead).toBe(t);
  expect(parseSceneHeading(t).ie).toBe('INT.');
});

test('cleanCharacter', () => {
  expect(cleanCharacter("PAUL (V.O.) (O.S) (CONT'D)")).toBe('PAUL');
  expect(cleanCharacter("PAUL (V.O.) (O.S) (CONT'D) ^")).toBe('PAUL');
  expect(cleanCharacter('DR. WALTER VON BRAUN')).toBe('DR. WALTER VON BRAUN');
  expect(cleanCharacter('@PAM')).toBe('PAM');
});
