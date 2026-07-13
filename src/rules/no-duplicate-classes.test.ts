import { describe, it } from 'vitest';
import rule from './no-duplicate-classes.js';
import { createVueRuleTester } from './vue-rule-tester.js';

const ruleTester = createVueRuleTester();

describe('no-duplicate-classes', () => {
  it('passes RuleTester valid/invalid cases', () => {
    ruleTester.run('no-duplicate-classes', rule as any, {
      valid: [
        {
          code: '<template><div class="pa-4 d-flex"></div></template>',
        },
        {
          code: "<template><div :class=\"['pa-4', 'd-flex']\"></div></template>",
        },
        {
          code: "<template><div :class=\"{ 'pa-4': true, 'd-flex': isActive }\"></div></template>",
        },
        {
          code: "<template><div :class=\"[dynamicClass, dynamicClass]\"></div></template>",
        },
        {
          code: "<template><div :class=\"{ ...base, 'pa-4': true, 'pa-4': false }\"></div></template>",
        },
      ],
      invalid: [
        {
          code: '<template><div class="pa-4 d-flex pa-4"></div></template>',
          output: '<template><div class="pa-4 d-flex"></div></template>',
          errors: [{ messageId: 'duplicateClass' }],
        },
        {
          code: "<template><div :class=\"['pa-4', 'd-flex', 'pa-4']\"></div></template>",
          output: "<template><div :class=\"['pa-4', 'd-flex']\"></div></template>",
          errors: [{ messageId: 'duplicateClass' }],
        },
        {
          code: "<template><div :class=\"{ 'pa-4': true, 'd-flex': isActive, 'pa-4': false }\"></div></template>",
          output: "<template><div :class=\"{ 'd-flex': isActive, 'pa-4': false }\"></div></template>",
          errors: [{ messageId: 'duplicateClassKey' }],
        },
      ],
    });
  });
});
