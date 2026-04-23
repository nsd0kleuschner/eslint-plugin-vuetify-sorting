import sortVuetifyClasses from './rules/sort-vuetify-classes.js';
import { Linter } from 'eslint';

interface Plugin {
  rules: Record<string, any>;
  configs: Record<string, Linter.FlatConfig>;
}

const plugin: Plugin = {
  rules: {
    'sort-vuetify-classes': sortVuetifyClasses
  },
  configs: {
    recommended: {
      plugins: {},
      rules: {
        'vuetify-sorting/sort-vuetify-classes': 'warn'
      }
    }
  }
};

plugin.configs.recommended.plugins!['vuetify-sorting'] = plugin;

export default plugin;
