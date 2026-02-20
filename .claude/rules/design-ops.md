# Design & Operational Style Rules

## Naming & Structure
- Use snake_case for internal JSON fields.
- Use PascalCase for UI components.
- Always return predictable, consistent JSON structures.

## UX Behaviour
- Respect the Superdesign UI layout:
  - SidebarNavigation
  - Dashboard
  - Triage Queue
  - Case Detail
- Maintain the same visual hierarchy and card structure.

## Output Discipline
- If returning UI code, prioritise Tailwind classes already in the HTML sources.
- Use minimal dependencies.
- Prefer component extraction to duplicated markup.

## Logs
- Ensure every case-action result includes a mini “ops note” summary.