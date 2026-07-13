import { ESLintUtils } from '@typescript-eslint/utils';
import {
  getClassBindingExpression,
  getStaticObjectKeyEntries,
  getStaticStringArrayElements,
  getTemplateBodyParserServices,
  isStaticClassAttribute,
  replaceNodeRangeWithList,
  requoteLike,
} from './vue-class-ast.js';

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
    const parserServices = getTemplateBodyParserServices(context, sourceCode);

    if (!parserServices) {
      return {};
    }

    return parserServices.defineTemplateBodyVisitor({
      VAttribute(node: any) {
        if (isStaticClassAttribute(node)) {
          checkStaticClassAttribute(node);
          return;
        }

        const expression = getClassBindingExpression(node);
        if (expression?.type === 'ArrayExpression') {
          checkClassArrayBinding(expression);
        } else if (expression?.type === 'ObjectExpression') {
          checkClassObjectBinding(expression);
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
            return fixer.replaceText(node.value, requoteLike(sourceCode, node.value, sortedValue));
          },
        });
      }
    }

    // Only handles fully static arrays (e.g. :class="['pa-4', 'd-flex']") — any
    // non-string-literal element (variables, ternaries, spreads) means the order
    // may be semantically meaningful, so the whole binding is left untouched.
    function checkClassArrayBinding(arrayExpression: any) {
      const elements = getStaticStringArrayElements(arrayExpression);
      if (!elements || elements.length <= 1) return;

      sortAndFix(arrayExpression, elements, elements.map((el: any) => el.value as string));
    }

    // Handles :class="{ 'pa-4': true, 'd-flex': isFlex }" objects. Unlike array
    // bindings, key order never affects behavior here — each key is toggled
    // independently — so keys can be reordered even when their values are
    // dynamic. Only bails on structure it can't safely reorder: spreads,
    // computed keys, getters/setters/methods, or non-string/non-identifier keys.
    function checkClassObjectBinding(objectExpression: any) {
      const entries = getStaticObjectKeyEntries(objectExpression);
      if (!entries || entries.length <= 1) return;

      sortAndFix(
        objectExpression,
        entries.map((entry) => entry.property),
        entries.map((entry) => entry.key)
      );
    }

    // Shared by both binding checks above: sorts `nodes` by the category score
    // (with an alphabetical tie-break) of their parallel `sortKeys`, and — if
    // that changes anything — reports/fixes by replacing the node range with
    // the reordered raw source texts.
    function sortAndFix(reportNode: any, nodes: any[], sortKeys: string[]) {
      const items = nodes.map((node, i) => ({ key: sortKeys[i], raw: sourceCode.getText(node) }));
      const sortedItems = [...items].sort((a, b) => {
        const scoreA = getScore(a.key);
        const scoreB = getScore(b.key);

        if (scoreA !== scoreB) {
          return scoreA - scoreB;
        }

        return a.key.localeCompare(b.key);
      });

      const isAlreadySorted = items.every((item, i) => item.raw === sortedItems[i].raw);
      if (isAlreadySorted) return;

      context.report({
        node: reportNode,
        messageId: 'sortVuetifyClasses',
        fix(fixer) {
          return replaceNodeRangeWithList(fixer, nodes, sortedItems.map((item) => item.raw));
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
