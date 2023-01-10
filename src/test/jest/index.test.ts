import 'jest';
import { foo, calcLines } from '../../index';

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
