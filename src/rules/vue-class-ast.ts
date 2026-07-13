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
