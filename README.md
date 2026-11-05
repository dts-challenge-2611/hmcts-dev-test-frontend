# Caseworker Task Tracker – Frontend

A GOV.UK-styled web frontend that lets caseworkers list, create, update and delete their tasks. It is Node.js/Express app that renders Nunjucks templates with the GOV.UK Design System and talks to the task tracker backend API.

## Prerequisites

- Node.js
- Yarn

## Running locally

```bash
yarn install
yarn webpack
yarn start:dev
```

The app is served at **https://localhost:3100**.

### Configuration

| Variable       | Default                 | Description             |
| -------------- | ----------------------- | ----------------------- |
| `TASK_API_URL` | `http://localhost:4000` | Base URL of the backend |

## Pages

| Page                       | URL                 |
| -------------------------- | ------------------- |
| Task list                  | `/`                 |
| Create task                | `/tasks/new`        |
| Update status              | `/tasks/:id/edit`   |
| Delete task (confirmation) | `/tasks/:id/delete` |

Each action ends on confirmation page with a link back to the task list.

## Testing and linting

```bash
yarn test:unit     # validation rules and TaskService
yarn test:routes   # every page through Express with Supertest (backend mocked)
yarn lint          # ESLint code style and import order checks
```

## Project structure

```
src/main/
  api/           TaskApi – calls the backend, validates responses with Zod
  services/      TaskService – form validation, page data, calls TaskApi
  controllers/   TaskController – renders pages or redirects
  routes/        URL → controller wiring
  utils/         validation rules and error messages
  views/tasks/   Nunjucks templates
```
