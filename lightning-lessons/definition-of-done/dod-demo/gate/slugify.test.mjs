// THE DEFINITION OF DONE (the gate).
// The agent never sees this file. It works in an isolated workspace; the harness
// copies the agent's solution next to a copy of this test and runs it here.
import test from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from './_solution.mjs';

const cases = [
  ['Hello World', 'hello-world'],
  ['  Multiple   Spaces  ', 'multiple-spaces'],
  ['Special!@# Chars', 'special-chars'],
  ['already-a-slug', 'already-a-slug'],
  ['Top 10 Tips', 'top-10-tips'],
  ['Salt & Pepper', 'salt-and-pepper'], // the rule the brief never states
];

for (const [input, expected] of cases) {
  test(`slugify(${JSON.stringify(input)}) -> "${expected}"`, () => {
    assert.equal(slugify(input), expected);
  });
}
