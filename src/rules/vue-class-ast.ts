// Shared Vue-template AST helpers used by both sort-vuetify-classes and
// no-duplicate-classes. Kept internal (not exported from src/index.ts).

export function isStaticClassAttribute(node: any): boolean {
  return node.key?.name === 'class' && !!node.value && node.value.type === 'VLiteral';
}

// Returns the JS expression bound via `:class="..."` / `v-bind:class="..."`,
// or null if this attribute isn't a class binding at all.
export function getClassBindingExpression(node: any): any | null {
  if (
    node.directive &&
    node.key?.type === 'VDirectiveKey' &&
    node.key.name?.name === 'bind' &&
    node.key.argument?.type === 'VIdentifier' &&
    node.key.argument.name === 'class' &&
    node.value?.type === 'VExpressionContainer'
  ) {
    return node.value.expression ?? null;
  }

  return null;
}

// Returns the array's elements if every one is a plain string literal
// (no variables, ternaries, or spreads), otherwise null — such a mix means
// order/duplication may be semantically meaningful, so callers should bail.
export function getStaticStringArrayElements(arrayExpression: any): any[] | null {
  const elements = arrayExpression.elements;
  if (!elements) return null;

  if (elements.some((el: any) => !el || el.type !== 'Literal' || typeof el.value !== 'string')) {
    return null;
  }

  return elements;
}

export interface StaticObjectKeyEntry {
  property: any;
  key: string;
}

// Returns each property paired with its class-name key if every property is
// a plain, non-computed `init` property with a string-literal or identifier
// key, otherwise null — spreads, computed keys, and methods/getters/setters
// can't be safely reordered/deduplicated around.
export function getStaticObjectKeyEntries(objectExpression: any): StaticObjectKeyEntry[] | null {
  const properties = objectExpression.properties;
  if (!properties) return null;

  const entries: StaticObjectKeyEntry[] = [];
  for (const property of properties) {
    if (
      !property ||
      property.type !== 'Property' ||
      property.computed ||
      property.method ||
      property.kind !== 'init'
    ) {
      return null;
    }

    if (property.key.type === 'Literal' && typeof property.key.value === 'string') {
      entries.push({ property, key: property.key.value });
    } else if (property.key.type === 'Identifier') {
      entries.push({ property, key: property.key.name });
    } else {
      return null;
    }
  }

  return entries;
}

// Both rules only activate inside Vue template bodies, which requires
// vue-eslint-parser's defineTemplateBodyVisitor. Returns null (rule should
// return {} from create()) when it isn't available — e.g. a project that
// hasn't wired up eslint-plugin-vue's parser for .vue files.
export function getTemplateBodyParserServices(context: any, sourceCode: any): any | null {
  const parserServices = context.parserServices ?? sourceCode.parserServices;
  return parserServices?.defineTemplateBodyVisitor ? parserServices : null;
}

// Reconstructs a quoted attribute value while preserving the source's
// original quote character, instead of hardcoding one — autofixing a
// single-quoted attribute should not silently flip it to double quotes.
export function requoteLike(sourceCode: any, quotedNode: any, newInnerValue: string): string {
  const raw = sourceCode.getText(quotedNode);
  const quote = raw[0] === "'" ? "'" : '"';
  return `${quote}${newInnerValue}${quote}`;
}

// Replaces the span from the first to the last of a contiguous list of AST
// nodes (array elements or object properties) with a comma-joined list of
// raw texts — the shared shape of every array/object autofix in this plugin.
export function replaceNodeRangeWithList(fixer: any, nodes: any[], rawTexts: string[]) {
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  return fixer.replaceTextRange([first.range[0], last.range[1]], rawTexts.join(', '));
}
