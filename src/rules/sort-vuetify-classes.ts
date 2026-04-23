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
];

type MessageIds = 'sortVuetifyClasses';
type Options = [{ order?: string[] }];

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
            items: { type: 'string' }
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      sortVuetifyClasses: 'Vuetify classes should be sorted.'
    },
    defaultOptions: [{}],
  },
  create(context) {
    const userOrder = context.options[0]?.order || defaultOrder;
    const orderRegexes: RegExp[] = [];

    userOrder.forEach(item => {
      if (defaultGroups[item]) {
        orderRegexes.push(...defaultGroups[item]);
      } else {
        try {
          orderRegexes.push(new RegExp(item));
        } catch (e) {
          // Ignore invalid regexes
        }
      }
    });

    const parserServices = context.sourceCode.parserServices as any;

    if (parserServices?.defineTemplateBodyVisitor) {
      return parserServices.defineTemplateBodyVisitor({
        VAttribute(node: any) {
          checkClasses(node);
        }
      });
    }
    return {};

    function checkClasses(node: any) {
      if (node.key.name === 'class' && node.value && node.value.type === 'VLiteral') {
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
              return fixer.replaceText(node.value as any, `"${sortedValue}"`);
            }
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
      return orderRegexes.length; // Default to end
    }
  }
});

export default sortVuetifyClassesRule;
