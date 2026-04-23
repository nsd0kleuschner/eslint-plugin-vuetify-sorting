import { Linter } from 'eslint';
import sortVuetifyClasses from './rules/sort-vuetify-classes.js';

interface Plugin {
  rules: Record<string, any>;
  configs: Record<string, Linter.FlatConfig>;
}

const plugin: Plugin = {
  rules: {
    'sort-vuetify-classes': sortVuetifyClasses,
  },
  configs: {
    recommended: {
      plugins: {
        'vuetify-sorting': undefined as any,
      },
      rules: {
        'vuetify-sorting/sort-vuetify-classes': 'warn',
      },
    },
  },
};

plugin.configs.recommended.plugins!['vuetify-sorting'] = plugin;

export default plugin;