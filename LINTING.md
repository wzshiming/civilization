# Code Style and Linting Guide

This project uses ESLint and Prettier to maintain consistent code style across all workspaces.

## Overview

The project is organized as a monorepo with four workspaces:

- `frontend` - React/TypeScript frontend application
- `backend` - Express/TypeScript backend server
- `shared` - Shared TypeScript types and utilities
- `map-generator-cli` - CLI tool for map generation

## Linting Setup

### ESLint Configuration

All workspaces share a common base ESLint configuration defined in `eslint.config.base.js` at the root level. This ensures consistent linting rules across the entire codebase.

#### Base Configuration

The base configuration includes:

- Recommended ESLint rules
- TypeScript ESLint recommended rules
- Common rules for unused variables and explicit any types
- Standard ignore patterns (dist, node_modules, build)

#### Workspace-Specific Configuration

Each workspace has its own `eslint.config.js` that extends the base configuration:

- **Frontend**: Extends base config with React-specific rules (React Hooks, React Refresh)
- **Backend, Shared, Map-Generator-CLI**: Use the base configuration as-is

### Prettier Configuration

Prettier is configured at the root level with the following settings:

- No semicolons
- Single quotes
- ES5 trailing commas
- 100 character line width
- 2 spaces for indentation
- Arrow function parentheses: always

## Available Commands

### Root Level (runs for all workspaces)

```bash
# Run linting on all workspaces
npm run lint

# Fix auto-fixable linting issues in all workspaces
npm run lint:fix

# Check code formatting
npm run format:check

# Fix code formatting
npm run format
```

### Individual Workspaces

You can also run linting on individual workspaces:

```bash
# Lint a specific workspace
npm run lint -w shared
npm run lint -w backend
npm run lint -w frontend
npm run lint -w map-generator-cli

# Fix linting issues in a specific workspace
npm run lint:fix -w shared
npm run lint:fix -w backend
npm run lint:fix -w frontend
npm run lint:fix -w map-generator-cli
```

## Development Workflow

1. **Before committing**: Run `npm run lint` and `npm run format:check` to ensure your code meets the style guidelines
2. **Auto-fix issues**: Use `npm run lint:fix` and `npm run format` to automatically fix most issues
3. **CI/CD**: Consider adding linting and formatting checks to your CI pipeline

## IDE Integration

### VS Code

Install the following extensions:

- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)

Add to your `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.workingDirectories": [
    "frontend",
    "backend",
    "shared",
    "map-generator-cli"
  ]
}
```

### Other IDEs

Most modern IDEs support ESLint and Prettier. Refer to your IDE's documentation for setup instructions.

## Customizing Rules

To add or modify rules:

1. **For all workspaces**: Edit `eslint.config.base.js` at the root level
2. **For a specific workspace**: Edit the workspace's `eslint.config.js`
3. **For Prettier**: Edit `.prettierrc` at the root level

## Troubleshooting

### Linting errors after installing dependencies

Run `npm install` at the root level to ensure all ESLint dependencies are properly installed.

### Conflicts between ESLint and Prettier

The current configuration is designed to avoid conflicts. If you experience issues:

1. Run `npm run format` first to format the code
2. Then run `npm run lint:fix` to fix any remaining ESLint issues

### CI/CD failures

Ensure that your CI/CD pipeline runs:

```bash
npm install
npm run lint
npm run format:check
```

This will catch any style violations before merging.
