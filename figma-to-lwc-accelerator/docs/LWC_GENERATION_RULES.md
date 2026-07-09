# LWC Generation Rules

## LWC Generation Standards

Generated components must favor readable, maintainable Salesforce LWC code over raw pixel reproduction.

## SLDS Mapping Rules

- Prefer Lightning base components for common controls.
- Prefer SLDS utility classes for spacing, layout, and typography.
- Use semantic HTML when no Lightning base component is appropriate.
- Generate warnings for unsupported or ambiguous mappings.

Phase 3 classification prepares the semantic inputs for these mapping rules, and Phase 4 implements the first mapping pass:

- `button` maps to `lightning-button`.
- `input` maps to `lightning-input`.
- `icon` maps to `lightning-icon` with a conservative placeholder icon until richer metadata exists.
- `card` maps to `section.slds-card`.
- `heading` maps to `h2.slds-text-heading_small`.
- `bodyText` maps to `p.slds-text-body_regular`.
- `badge` maps to `span.slds-badge`.
- Row `layout` maps to `div.slds-grid.slds-gutters`.
- Column `layout` maps to a scoped flex-column CSS class.
- `unknown` maps to a generic `div` with a warning before generation.

Classifier confidence is advisory. Future mapping and generation phases must preserve warnings so developers can review or override uncertain intent.

## File Generation Rules

Every generated component should include:

- `<componentName>.html`
- `<componentName>.js`
- `<componentName>.css`
- `<componentName>.js-meta.xml`
- Optional `README.md`

Phase 5 implementation:

- `generateLwcBundle` creates the required LWC files from `SldsMappedNode`.
- File and folder names are normalized to camelCase.
- Generated README content includes warnings and a developer review checklist.
- Generated files must not be empty.

## Naming Conventions

- Component folder and file names must use camelCase.
- Public JavaScript APIs must be explicit and minimal.
- Do not invent Salesforce field names, Apex class names, or object metadata.
- Generated JavaScript class names use PascalCase derived from the camelCase component name.

## CSS Strategy

- Prefer SLDS classes.
- Use scoped CSS only for styles that cannot be represented clearly with SLDS.
- Avoid inline styles.
- Phase 4 currently emits scoped CSS declarations only for column flex layouts and custom gaps.
- Phase 5 writes a nonempty `:host` fallback when no scoped CSS declarations are required.

## Meta XML Strategy

- Generate valid metadata XML.
- Expose targets only when they are selected or safely inferred from explicit user input.
- Add `@api recordId` only when record page behavior is selected or explicitly required.
- Phase 5 supports `lightning__RecordPage`, `lightning__AppPage`, and `lightning__HomePage` targets.

## Accessibility Rules

- Preserve semantic heading and text structure.
- Add accessible labels where interactive controls require them.
- Do not generate unsafe HTML rendering.
- Escape generated text and attributes before writing HTML.
