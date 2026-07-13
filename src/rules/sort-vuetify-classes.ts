import { ESLintUtils } from '@typescript-eslint/utils';

export const defaultGroups: Record<string, RegExp[]> = {
  components: [/^c-/, /^o-/],
  layout: [/^d-/, /^float-/, /^position-/, /^top-/, /^bottom-/, /^left-/, /^right-/, /^z-/, /^overflow-/, /^clear-/],
  flexGrid: [/^flex-/, /^justify-/, /^align-/, /^order-/, /^grid-/],
  sizing: [/^w-/, /^h-/, /^min-w-/, /^max-w-/, /^min-h-/, /^max-h-/, /^mw-/, /^mh-/, /^fill-height/],
  spacing: [/^[mp][atblrsexy]?-/, /^g[axy]-/],
  typography: [/^text-/, /^font-/],
  visuals: [/^bg-/, /^border-/, /^rounded-/, /^elevation-/, /^theme--/, /^opacity-/],
  misc: [/^cursor-/, /^pointer-events-/, /^user-select-/]
};

export const defaultOrder = [
  'components',
  'layout',
  'flexGrid',
  'sizing',
  'spacing',
  'typography',
  'visuals',
  'misc'
] as const;

type OrderItem = keyof typeof defaultGroups | string;
type MessageIds = 'sortVuetifyClasses';
type Options = [{
  order?: OrderItem[];
}];

const createRule = ESLintUtils.RuleCreator(
    (name) => `https://github.com/nsd0kleuschner/eslint-plugin-vuetify-sorting/blob/main/docs/rules/${name}.md`
);

const sortVuetifyClassesRule = createRule<Options, MessageIds>({
  name: 'sort-vuetify-classes',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Sort Vuetify classes in a specific order',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          order: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      sortVuetifyClasses: 'Vuetify classes should be sorted.',
    },
    defaultOptions: [{
      order: [...defaultOrder],
    }],
  },
  create(context) {
    const rawOrder = context.options?.[0]?.order;
    const userOrder = Array.isArray(rawOrder) && rawOrder.length > 0 ? rawOrder : [...defaultOrder];

    const orderRegexes: RegExp[] = [];
    for (const item of userOrder) {
      if (item in defaultGroups) {
        orderRegexes.push(...defaultGroups[item as keyof typeof defaultGroups]);
        continue;
      }

      try {
        orderRegexes.push(new RegExp(item));
      } catch {
        // ungültige Regex ignorieren
      }
    }

    const sourceCode = context.sourceCode ?? context.getSourceCode();
    const parserServices = (context as any).parserServices ?? (sourceCode as any).parserServices;

    if (!parserServices?.defineTemplateBodyVisitor) {
      return {};
    }

    return parserServices.defineTemplateBodyVisitor({
      VAttribute(node: any) {
        if (node.key?.name === 'class' && node.value && node.value.type === 'VLiteral') {
          checkStaticClassAttribute(node);
          return;
        }

        if (
          node.directive &&
          node.key?.type === 'VDirectiveKey' &&
          node.key.name?.name === 'bind' &&
          node.key.argument?.type === 'VIdentifier' &&
          node.key.argument.name === 'class' &&
          node.value?.type === 'VExpressionContainer' &&
          node.value.expression?.type === 'ArrayExpression'
        ) {
          checkClassArrayBinding(node.value.expression);
          return;
        }

        if (
          node.directive &&
          node.key?.type === 'VDirectiveKey' &&
          node.key.name?.name === 'bind' &&
          node.key.argument?.type === 'VIdentifier' &&
          node.key.argument.name === 'class' &&
          node.value?.type === 'VExpressionContainer' &&
          node.value.expression?.type === 'ObjectExpression'
        ) {
          checkClassObjectBinding(node.value.expression);
        }
      },
    });

    function checkStaticClassAttribute(node: any) {
      const originalValue = node.value.value as string;
      const classes = originalValue.split(/\s+/).filter(Boolean);

      if (classes.length <= 1) return;

      const sortedClasses = [...classes].sort((a, b) => {
        const scoreA = getScore(a);
        const scoreB = getScore(b);

        if (scoreA !== scoreB) {
          return scoreA - scoreB;
        }

        return a.localeCompare(b);
      });

      const sortedValue = sortedClasses.join(' ');

      if (originalValue !== sortedValue) {
        context.report({
          node: node.value,
          messageId: 'sortVuetifyClasses',
          fix(fixer) {
            const raw = sourceCode.getText(node.value);
            const quote = raw[0] === "'" ? "'" : '"';
            return fixer.replaceText(node.value, `${quote}${sortedValue}${quote}`);
          },
        });
      }
    }

    // Only handles fully static arrays (e.g. :class="['pa-4', 'd-flex']") — any
    // non-string-literal element (variables, ternaries, spreads) means the order
    // may be semantically meaningful, so the whole binding is left untouched.
    function checkClassArrayBinding(arrayExpression: any) {
      const elements = arrayExpression.elements;
      if (!elements || elements.length <= 1) return;
      if (elements.some((el: any) => !el || el.type !== 'Literal' || typeof el.value !== 'string')) {
        return;
      }

      const items = elements.map((el: any) => ({ value: el.value as string, raw: sourceCode.getText(el) }));
      const sortedItems = [...items].sort((a, b) => {
        const scoreA = getScore(a.value);
        const scoreB = getScore(b.value);

        if (scoreA !== scoreB) {
          return scoreA - scoreB;
        }

        return a.value.localeCompare(b.value);
      });

      const isAlreadySorted = items.every((item: { raw: string }, i: number) => item.raw === sortedItems[i].raw);
      if (isAlreadySorted) return;

      context.report({
        node: arrayExpression,
        messageId: 'sortVuetifyClasses',
        fix(fixer) {
          const firstElement = elements[0];
          const lastElement = elements[elements.length - 1];
          return fixer.replaceTextRange(
            [firstElement.range[0], lastElement.range[1]],
            sortedItems.map((item) => item.raw).join(', ')
          );
        },
      });
    }

    // Handles :class="{ 'pa-4': true, 'd-flex': isFlex }" objects. Unlike array
    // bindings, key order never affects behavior here — each key is toggled
    // independently — so keys can be reordered even when their values are
    // dynamic. Only bails on structure it can't safely reorder: spreads,
    // computed keys, getters/setters/methods, or non-string/non-identifier keys.
    function checkClassObjectBinding(objectExpression: any) {
      const properties = objectExpression.properties;
      if (!properties || properties.length <= 1) return;

      const keyNames: string[] = [];
      for (const property of properties) {
        if (
          !property ||
          property.type !== 'Property' ||
          property.computed ||
          property.method ||
          property.kind !== 'init'
        ) {
          return;
        }

        if (property.key.type === 'Literal' && typeof property.key.value === 'string') {
          keyNames.push(property.key.value);
        } else if (property.key.type === 'Identifier') {
          keyNames.push(property.key.name);
        } else {
          return;
        }
      }

      const items = properties.map((property: any, i: number) => ({
        key: keyNames[i],
        raw: sourceCode.getText(property),
      }));

      const sortedItems = [...items].sort((a, b) => {
        const scoreA = getScore(a.key);
        const scoreB = getScore(b.key);

        if (scoreA !== scoreB) {
          return scoreA - scoreB;
        }

        return a.key.localeCompare(b.key);
      });

      const isAlreadySorted = items.every((item: { raw: string }, i: number) => item.raw === sortedItems[i].raw);
      if (isAlreadySorted) return;

      context.report({
        node: objectExpression,
        messageId: 'sortVuetifyClasses',
        fix(fixer) {
          const firstProperty = properties[0];
          const lastProperty = properties[properties.length - 1];
          return fixer.replaceTextRange(
            [firstProperty.range[0], lastProperty.range[1]],
            sortedItems.map((item) => item.raw).join(', ')
          );
        },
      });
    }

    function getScore(className: string): number {
      for (let i = 0; i < orderRegexes.length; i++) {
        if (orderRegexes[i].test(className)) {
          return i;
        }
      }

      return orderRegexes.length;
    }
  },
});

export default sortVuetifyClassesRule;
