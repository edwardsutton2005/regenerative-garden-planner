# Architecture

## Stack

- React
- TypeScript
- Vite
- CSS
- Local client-side state initially

## Principles

Keep the architecture simple.

Separate UI rendering from garden logic.

Plant information should be represented as structured data rather than
hardcoded into React components.

Companion-planting relationships and scoring should live in independent
rule functions that can be tested without rendering the UI.

## Expected Structure

src/
  components/
  data/
  rules/
  types/

## Future Considerations

The application may later support:

- Native plants
- climate/location data
- water systems
- soil systems
- plant guilds
- AI planning
- persistence/backend

Do not architect these systems until needed.
