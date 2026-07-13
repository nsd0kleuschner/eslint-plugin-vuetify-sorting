# eslint-plugin-vuetify-sorting

An ESLint plugin to sort Vuetify classes in a consistent and configurable order.

## Supported Syntax

- Static `class="..."` attributes on Vue template elements — sorted and autofixed.
- Static `:class="[...]"` array bindings, when every element is a plain string literal (e.g. `:class="['pa-4', 'd-flex']"`) — sorted and autofixed.
- `:class="{ 'pa-4': true, 'd-flex': isFlex }"` object bindings — keys are sorted and autofixed even when values are dynamic, since each key toggles independently and order never affects behavior. Objects with a spread (`{ ...base, 'pa-4': true }`) or a computed key (`{ [dynamicKey]: true }`) are left untouched.
- `:class` array bindings that mix in variables, ternaries, or spreads (e.g. `:class="['pa-4', isActive ? 'd-flex' : '']"`) are left untouched, since reordering could change which class wins under a condition.
- Plain JS/TS string concatenation outside of templates is not covered.

## Installation

You can install this plugin directly from this GitHub repository:

```bash
npm install eslint-plugin-vuetify-sorting --save-dev
```

## Usage (Flat Config)

In your `eslint.config.js`:

```javascript
import vuetifySorting from 'eslint-plugin-vuetify-sorting';

export default [
  // Use the recommended configuration as a SEPARATE entry
  vuetifySorting.configs.recommended,
  
  // Your other rules in a separate config object
  {
    rules: {
      // your other rules...
    }
  }
];
```

> Do **not** spread `vuetifySorting.configs.recommended` into another config object using `...`. This will overwrite the `rules` from `recommended` with your own `rules` object, causing the plugin to silently do nothing. Always pass it as a **separate** entry in the config array.

### Usage with Nuxt (`withNuxt`)

```javascript
import withNuxt from './.nuxt/eslint.config.mjs';
import vuetifySorting from 'eslint-plugin-vuetify-sorting';

export default withNuxt(
  // Pass recommended as its own separate argument
  vuetifySorting.configs.recommended,
  {
    rules: {
      // your other rules...
    }
  }
);
```

### Manual configuration (custom order)

```javascript
import vuetifySorting from 'eslint-plugin-vuetify-sorting';

export default [
  {
    plugins: {
      'vuetify-sorting': vuetifySorting
    },
    rules: {
      'vuetify-sorting/sort-vuetify-classes': ['warn', {
        order: [
          'components',
          'flexGrid',
          'layout',
          'sizing',
          'spacing',
          'typography',
          'visuals',
          'misc'
        ]
      }]
    }
  }
];
```

## Configuration Options

### `order` (optional)

An array of category names or regular expression strings defining the sorting order.

#### Available Categories (in default order):

<!-- vuetify-sorting:categories:start -->
<!-- Generated from src/rules/sort-vuetify-classes.ts by `npm run docs`. Do not edit by hand. -->

- `components`: matches `^c-`, `^o-`
- `layout`: matches `^d-`, `^float-`, `^position-`, `^top-`, `^bottom-`, `^left-`, `^right-`, `^z-`, `^overflow-`, `^clear-`
- `flexGrid`: matches `^flex-`, `^justify-`, `^align-`, `^order-`, `^grid-`
- `sizing`: matches `^w-`, `^h-`, `^min-w-`, `^max-w-`, `^min-h-`, `^max-h-`, `^mw-`, `^mh-`, `^fill-height`
- `spacing`: matches `^[mp][atblrsexy]?-`, `^g[axy]-`
- `typography`: matches `^text-`, `^font-`
- `visuals`: matches `^bg-`, `^border-`, `^rounded-`, `^elevation-`, `^theme--`, `^opacity-`
- `misc`: matches `^cursor-`, `^pointer-events-`, `^user-select-`

<!-- vuetify-sorting:categories:end -->

Classes are matched against these regular expressions directly, so this list can never drift from the rule's actual behavior — run `npm run docs` after changing `defaultGroups`/`defaultOrder` in the rule source to refresh it.

You can also provide custom regular expressions as strings in the `order` array. For example, to add a custom group for icon classes before spacing:

```javascript
import vuetifySorting from 'eslint-plugin-vuetify-sorting';

export default [
  {
    plugins: {
      'vuetify-sorting': vuetifySorting
    },
    rules: {
      'vuetify-sorting/sort-vuetify-classes': ['warn', {
        order: [
          'components',
          'layout',
          'flexGrid',
          'sizing',
          '^icon-',       // custom regex: matches classes starting with "icon-"
          'spacing',
          'typography',
          'visuals',
          'misc'
        ]
      }]
    }
  }
];
```

Classes that do not match any of the defined categories (or custom regexes) are moved to the end of the class list. Within any single category — and among unmatched classes — classes are sorted alphabetically relative to each other.

## License

ISC
