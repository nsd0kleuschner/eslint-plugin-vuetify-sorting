import { RuleTester } from 'eslint';
import vueParser from 'vue-eslint-parser';
import { describe, it } from 'vitest';
import rule from './sort-vuetify-classes.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

describe('sort-vuetify-classes', () => {
  it('passes RuleTester valid/invalid cases', () => {
    ruleTester.run('sort-vuetify-classes', rule as any, {
      valid: [
        {
          code: '<template><div class="d-flex justify-center pa-4 text-h6"></div></template>',
        },
        {
          code: '<template><div class="single-class"></div></template>',
        },
        {
          code: '<template><div class="c-card d-flex pa-2 text-caption bg-white cursor-pointer"></div></template>',
        },
        {
          code: '<template><div class="a-custom-first b-custom-second"></div></template>',
        },
        {
          code: "<template><div :class=\"['d-flex', 'pa-4']\"></div></template>",
        },
        {
          code: "<template><div :class=\"['d-flex', isActive ? 'pa-4' : 'pa-2']\"></div></template>",
        },
        {
          code: "<template><div :class=\"[dynamicClass, 'pa-4']\"></div></template>",
        },
        {
          code: "<template><div :class=\"{ 'd-flex': true, 'pa-4': isActive }\"></div></template>",
        },
        {
          code: '<template><div :class="{ \'pa-4\': true }"></div></template>',
        },
        {
          code: "<template><div :class=\"{ ...base, 'd-flex': true, 'pa-4': isActive }\"></div></template>",
        },
        {
          code: "<template><div :class=\"{ [dynamicKey]: true, 'd-flex': isActive, 'pa-4': true }\"></div></template>",
        },
      ],
      invalid: [
        {
          code: '<template><div class="pa-4 d-flex text-h6 justify-center"></div></template>',
          output: '<template><div class="d-flex justify-center pa-4 text-h6"></div></template>',
          errors: [{ messageId: 'sortVuetifyClasses' }],
        },
        {
          code: '<template><div class="text-h6 c-card"></div></template>',
          output: '<template><div class="c-card text-h6"></div></template>',
          errors: [{ messageId: 'sortVuetifyClasses' }],
        },
        {
          code: '<template><div class="zeta alpha pa-2"></div></template>',
          output: '<template><div class="pa-2 alpha zeta"></div></template>',
          errors: [{ messageId: 'sortVuetifyClasses' }],
        },
        {
          code: '<template><div class="text-h6 icon-home pa-2"></div></template>',
          output: '<template><div class="pa-2 icon-home text-h6"></div></template>',
          options: [{ order: ['spacing', '^icon-', 'typography'] }],
          errors: [{ messageId: 'sortVuetifyClasses' }],
        },
        {
          code: "<template><div class='pa-4 d-flex'></div></template>",
          output: "<template><div class='d-flex pa-4'></div></template>",
          errors: [{ messageId: 'sortVuetifyClasses' }],
        },
        {
          code: "<template><div :class=\"['pa-4', 'd-flex', 'text-h6']\"></div></template>",
          output: "<template><div :class=\"['d-flex', 'pa-4', 'text-h6']\"></div></template>",
          errors: [{ messageId: 'sortVuetifyClasses' }],
        },
        {
          code: '<template><div :class=\'["pa-4", "d-flex"]\'></div></template>',
          output: '<template><div :class=\'["d-flex", "pa-4"]\'></div></template>',
          errors: [{ messageId: 'sortVuetifyClasses' }],
        },
        {
          code: "<template><div :class=\"{ 'pa-4': true, 'd-flex': isActive }\"></div></template>",
          output: "<template><div :class=\"{ 'd-flex': isActive, 'pa-4': true }\"></div></template>",
          errors: [{ messageId: 'sortVuetifyClasses' }],
        },
      ],
    });
  });
});
