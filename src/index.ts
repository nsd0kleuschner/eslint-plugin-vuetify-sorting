import { Linter } from 'eslint';
import sortVuetifyClasses from './rules/sort-vuetify-classes.js';
import noDuplicateClasses from './rules/no-duplicate-classes.js';

interface Plugin {
  rules: Record<string, any>;
  configs: Record<string, Linter.Config>;
}

const plugin: Plugin = {
  rules: {
    'sort-vuetify-classes': sortVuetifyClasses,
    'no-duplicate-classes': noDuplicateClasses,
  },
  configs: {
    recommended: {
      plugins: {
        'vuetify-sorting': undefined as any,
      },
      rules: {
        'vuetify-sorting/sort-vuetify-classes': 'warn',
        'vuetify-sorting/no-duplicate-classes': 'error',
      },
    },
  },
};

plugin.configs.recommended.plugins!['vuetify-sorting'] = plugin;

export default plugin;