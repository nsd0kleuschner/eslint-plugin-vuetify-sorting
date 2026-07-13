import { ESLintUtils } from '@typescript-eslint/utils';
import {
  getClassBindingExpression,
  getStaticObjectKeyEntries,
  getStaticStringArrayElements,
  isStaticClassAttribute,
} from './vue-class-ast.js';

type MessageIds = 'duplicateClass' | 'duplicateClassKey';

const createRule = ESLintUtils.RuleCreator(
    (name) => `https://github.com/nsd0kleuschner/eslint-plugin-vuetify-sorting/blob/main/docs/rules/${name}.md`
);

const noDuplicateClassesRule = createRule<[], MessageIds>({
  name: 'no-duplicate-classes',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow duplicate classes in Vue class bindings',
    },
    fixable: 'code',
    schema: [],
    messages: {
      duplicateClass: 'Duplicate class "{{className}}".',
      duplicateClassKey: 'Duplicate class key "{{key}}" in :class object.',
    },
    defaultOptions: [],
  },
  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    const parserServices = (context as any).parserServices ?? (sourceCode as any).parserServices;

    if (!parserServices?.defineTemplateBodyVisitor) {
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

      const duplicates = findDuplicates(classes);
      if (duplicates.length === 0) return;

      const dedupedValue = dedupeByValue(classes, (c) => c).join(' ');

      context.report({
        node: node.value,
        messageId: 'duplicateClass',
        data: { className: duplicates.join(', ') },
        fix(fixer) {
          const raw = sourceCode.getText(node.value);
          const quote = raw[0] === "'" ? "'" : '"';
          return fixer.replaceText(node.value, `${quote}${dedupedValue}${quote}`);
        },
      });
    }

    // Array duplicates are safe to drop outright — :class arrays are
    // concatenated at runtime, so an earlier vs. later duplicate string
    // makes no behavioral difference.
    function checkClassArrayBinding(arrayExpression: any) {
      const elements = getStaticStringArrayElements(arrayExpression);
      if (!elements || elements.length <= 1) return;

      const values = elements.map((el: any) => el.value as string);
      const duplicates = findDuplicates(values);
      if (duplicates.length === 0) return;

      const dedupedRaw = dedupeByValue(elements, (el: any) => el.value).map((el: any) => sourceCode.getText(el));

      context.report({
        node: arrayExpression,
        messageId: 'duplicateClass',
        data: { className: duplicates.join(', ') },
        fix(fixer) {
          const firstElement = elements[0];
          const lastElement = elements[elements.length - 1];
          return fixer.replaceTextRange(
            [firstElement.range[0], lastElement.range[1]],
            dedupedRaw.join(', ')
          );
        },
      });
    }

    // Unlike arrays, a duplicate object key isn't harmless: JS object
    // literals let the LAST occurrence win, so the earlier one is already
    // dead code. Deduplicating keeps the last occurrence to preserve behavior.
    function checkClassObjectBinding(objectExpression: any) {
      const entries = getStaticObjectKeyEntries(objectExpression);
      if (!entries || entries.length <= 1) return;

      const keys = entries.map((entry) => entry.key);
      const duplicates = findDuplicates(keys);
      if (duplicates.length === 0) return;

      const lastIndexForKey = new Map<string, number>();
      entries.forEach((entry, i) => lastIndexForKey.set(entry.key, i));

      const dedupedRaw = entries
        .filter((entry, i) => lastIndexForKey.get(entry.key) === i)
        .map((entry) => sourceCode.getText(entry.property));

      context.report({
        node: objectExpression,
        messageId: 'duplicateClassKey',
        data: { key: duplicates.join(', ') },
        fix(fixer) {
          const properties = entries.map((entry) => entry.property);
          const firstProperty = properties[0];
          const lastProperty = properties[properties.length - 1];
          return fixer.replaceTextRange(
            [firstProperty.range[0], lastProperty.range[1]],
            dedupedRaw.join(', ')
          );
        },
      });
    }

    function findDuplicates(values: string[]): string[] {
      const seen = new Set<string>();
      const duplicates = new Set<string>();

      for (const value of values) {
        if (seen.has(value)) {
          duplicates.add(value);
        }
        seen.add(value);
      }

      return [...duplicates];
    }

    // Keeps the FIRST occurrence of each value — correct for plain class
    // lists/arrays, where duplicates are order-independent and harmless.
    function dedupeByValue<T>(items: T[], getValue: (item: T) => string): T[] {
      const seen = new Set<string>();
      const result: T[] = [];

      for (const item of items) {
        const value = getValue(item);
        if (seen.has(value)) continue;
        seen.add(value);
        result.push(item);
      }

      return result;
    }
  },
});

export default noDuplicateClassesRule;
