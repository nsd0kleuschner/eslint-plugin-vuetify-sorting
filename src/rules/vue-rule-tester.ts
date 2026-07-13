import { RuleTester } from 'eslint';
import vueParser from 'vue-eslint-parser';

export function createVueRuleTester(): RuleTester {
  return new RuleTester({
    languageOptions: {
      parser: vueParser,
      ecmaVersion: 2020,
      sourceType: 'module',
    },
  });
}
