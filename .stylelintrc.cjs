module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-clean-order/error',
    'stylelint-prettier/recommended'
  ],
  plugins: ['stylelint-selector-bem-pattern'],
  rules: {
    'plugin/selector-bem-pattern': {
      componentName: '[A-Z]+',
      componentSelectors: {
        initial: '^\\.{componentName}(?:-[a-z]+)?$',
        combined: '^\\.combined-{componentName}-[a-z]+$'
      },
      utilitySelectors: '^\\.util-[a-z]+$'
    },
    'selector-class-pattern': null,
    'property-no-vendor-prefix': [
      true,
      {
        severity: 'warning'
      }
    ],
    'prettier/prettier': true,
    'block-no-empty': null,
    'no-descending-specificity': null,
    'max-nesting-depth': 2,
    'selector-max-compound-selectors': 2,
    'comment-no-empty': true,
    'font-family-no-duplicate-names': true,
    'selector-type-no-unknown': true,
    'unit-no-unknown': true,
    'function-no-unknown': null,
    'no-duplicate-at-import-rules': true,
    'no-duplicate-selectors': true,
    'no-empty-source': true,
    'no-invalid-double-slash-comments': true,
    'no-invalid-position-at-import-rule': null
  }
};
