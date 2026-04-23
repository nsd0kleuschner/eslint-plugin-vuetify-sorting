import { ESLintUtils } from '@typescript-eslint/utils';

const defaultGroups: Record<string, RegExp[]> = {
  components: [/^c-/, /^o-/],
  layout: [/^d-/, /^float-/, /^position-/, /^top-/, /^bottom-/, /^left-/, /^right-/, /^z-/, /^overflow-/, /^clear-/],
  flexGrid: [/^flex-/, /^justify-/, /^align-/, /^order-/, /^grid-/, /^v-col-/, /^v-row-/],
  sizing: [/^w-/, /^h-/, /^min-w-/, /^max-w-/, /^min-h-/, /^max-h-/, /^mw-/, /^mh-/, /^fill-height/],
  spacing: [/^[mp][atblrsexy]?-/, /^g[axy]-/],
  typography: [/^text-/, /^font-/],
  visuals: [/^bg-/, /^border-/, /^rounded-/, /^elevation-/, /^theme--/, /^opacity-/],
  misc: [/^cursor-/, /^pointer-events-/, /^user-select-/]
};

const defaultOrder = [
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
    const parserServices = sourceCode.parserServices as any;

    if (!parserServices?.defineTemplateBodyVisitor) {
      return {};
    }

    return parserServices.defineTemplateBodyVisitor({
      VAttribute(node: any) {
        checkClasses(node);
      },
    });

    function checkClasses(node: any) {
      if (node.key?.name === 'class' && node.value && node.value.type === 'VLiteral') {
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
              return fixer.replaceText(node.value, `"${sortedValue}"`);
            },
          });
        }
      }
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