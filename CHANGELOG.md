# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Test suite (`vitest` + ESLint `RuleTester` via `vue-eslint-parser`) covering default sorting, autofix output, and custom `order` options.
- CI (GitHub Actions): build + test on push/PR against Node 20 and 22.
- Support for sorting fully static `:class="[...]"` array bindings (string-literal elements only — mixed/dynamic elements are left untouched).
- Support for sorting `:class="{ ... }"` object binding keys — works even with dynamic values, since key order never affects behavior. Skips objects with a spread or computed key.

### Fixed

- Autofix no longer forces double quotes on `class="..."` attributes that originally used single quotes — the fixer now preserves the source's quote character instead of hardcoding `"`.

## [1.0.5] - 2026-04-23

### Changed

- Reworked the flat-config usage example in the README (explicit plugin registration instead of a bare rule snippet).

## [1.0.4] - 2026-04-23

### Changed

- Clarified the class-sorting category docs in the README.
- Removed the `v-col-`/`v-row-` regex patterns from the `flexGrid` category — these classes now fall through to the unmatched/alphabetical bucket unless added back via a custom `order` entry.

> Note: git also has a `v1.1.0` tag between `v1.0.3` and this release. That version bump was reverted before publishing — `1.0.4` is the released continuation of the `1.0.x` line and is what ended up on npm.

## [1.0.3] - 2026-04-23

### Added

- Nuxt usage example (`withNuxt`) in the README.
- README warning against spreading `configs.recommended` into another config object (it silently overwrites the rule config).

## [1.0.2] - 2026-04-23

### Changed

- Updated dependencies.
- More robust `parserServices` lookup (checks both `context.parserServices` and `sourceCode.parserServices`) so the rule keeps working across ESLint/`vue-eslint-parser` versions that expose it differently.
- `configs` typed as `Linter.Config` instead of the removed `Linter.FlatConfig`.

## [1.0.1] - 2026-04-23

### Changed

- Refactored `sort-vuetify-classes` for configurability: category order became overridable via the `order` rule option instead of being hardcoded.

## [1.0.0] - 2026-04-23

Initial release.

- `sort-vuetify-classes` rule: autofixable sorting of static Vue template `class` attributes into `components`, `layout`, `flexGrid`, `sizing`, `spacing`, `typography`, `visuals`, `misc` categories, unmatched classes sorted alphabetically at the end.
- `recommended` flat-config export.

[Unreleased]: https://github.com/nsd0kleuschner/eslint-plugin-vuetify-sorting/compare/7cdeca2...HEAD
[1.0.5]: https://github.com/nsd0kleuschner/eslint-plugin-vuetify-sorting/compare/cdf3151...7cdeca2
[1.0.4]: https://github.com/nsd0kleuschner/eslint-plugin-vuetify-sorting/compare/v1.0.3...cdf3151
[1.0.3]: https://github.com/nsd0kleuschner/eslint-plugin-vuetify-sorting/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/nsd0kleuschner/eslint-plugin-vuetify-sorting/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/nsd0kleuschner/eslint-plugin-vuetify-sorting/compare/b7a9509...v1.0.1
[1.0.0]: https://github.com/nsd0kleuschner/eslint-plugin-vuetify-sorting/commit/b7a9509

Note: only `v1.0.1`–`v1.0.3` are tagged in git; other versions are referenced by commit SHA above. Consider tagging `1.0.4`/`1.0.5` retroactively (`git tag v1.0.4 cdf3151`, `git tag v1.0.5 7cdeca2`) and using `v`-prefixed tags going forward for stable compare links.
