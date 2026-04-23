# eslint-plugin-vuetify-sorting

An ESLint plugin to sort Vuetify classes in a consistent and configurable order.

## Installation

You can install this plugin directly from your GitHub repository:

```bash
npm install git+https://github.com/nsd0kleuschner/eslint-plugin-vuetify-sorting.git --save-dev
```

## Usage (Flat Config)

In your `eslint.config.js`:

```javascript
import vuetifySorting from 'eslint-plugin-vuetify-sorting';

export default [
  // Use the recommended configuration
  vuetifySorting.configs.recommended,
  
  // Or configure it manually
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

#### Available Categories:

- `components and objects`: Classes starting with `c-`, `o-`
- `layout`: `d-`, `float-`, `position-`, `top-`, `bottom-`, `left-`, `right-`, `z-`, `overflow-`, `clear-`
- `flexGrid`: `flex-`, `justify-`, `align-`, `order-`, `grid-`, `v-col-`, `v-row-`
- `sizing`: `w-`, `h-`, `min-w-`, `max-w-`, `min-h-`, `max-h-`, `mw-`, `mh-`, `fill-height`
- `spacing`: `m-`, `p-`, `g-` (and variants like `ma-`, `px-`, etc.)
- `typography`: `text-`, `font-`
- `visuals`: `bg-`, `border-`, `rounded-`, `elevation-`, `theme--`, `opacity-`
- `misc`: `cursor-`, `pointer-events-`, `user-select-`

You can also provide custom regular expressions as strings in the `order` array.

Classes that do not match any of the defined categories (or custom regexes) are moved to the end of the class list and sorted alphabetically.

## License

ISC
