# eslint-plugin-vuetify-sorting

An ESLint plugin to sort Vuetify classes in a consistent and configurable order.

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

- `components and objects`: Classes starting with `c-`, `o-`
- `layout`: `d-`, `float-`, `position-`, `top-`, `bottom-`, `left-`, `right-`, `z-`, `overflow-`, `clear-`
- `flexGrid`: `flex-`, `justify-`, `align-`, `order-`, `grid-`, `v-col-`, `v-row-`
- `sizing`: `w-`, `h-`, `min-w-`, `max-w-`, `min-h-`, `max-h-`, `mw-`, `mh-`, `fill-height`
- `spacing`: `m-`, `p-`, `g-` (and variants like `ma-`, `px-`, etc.)
- `typography`: `text-`, `font-`
- `visuals`: `bg-`, `border-`, `rounded-`, `elevation-`, `theme--`, `opacity-`
- `misc`: `cursor-`, `pointer-events-`, `user-select-`

You can also provide custom regular expressions as strings in the `order` array. For example, to add a custom group for icon classes before spacing:

```javascript
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
```

Classes that do not match any of the defined categories (or custom regexes) are moved to the end of the class list and sorted alphabetically.

## License

ISC
