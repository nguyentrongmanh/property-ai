# property-ai-api-nest

NestJS API for the Property AI project. See the [root README](../README.md) for setup,
environment variables, and how this fits together with `property-ai-web`.

## Common commands

```bash
pnpm run start:dev      # dev server with watch mode
pnpm run migration:run  # apply TypeORM migrations
pnpm run seed           # seed properties, work orders, and a demo user
pnpm test                # unit tests
pnpm run test:e2e        # e2e tests (needs a `property_ai_test` Postgres database)
```
