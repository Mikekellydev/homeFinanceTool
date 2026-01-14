# Repository Guidelines

## Project Structure & Module Organization
This repository starts minimal; keep it easy to navigate as Python and web assets land:
- `src/` for Python packages and modules.
- `web/` for HTML/CSS/JS assets or static pages.
- `tests/` for automated tests (mirror `src/` paths when possible).
- `scripts/` for one-off utilities (e.g., `scripts/import-data.sh`).
- `docs/` for long-form project notes and decisions.

If you introduce a different layout, document it here so new contributors can find code quickly.

## Build, Test, and Development Commands
No build, test, or dev commands are defined yet. When tooling is added, update this section with exact commands and brief descriptions. Example format:
- `make build` — compile or package the project.
- `make test` — run the automated test suite.
- `make lint` — run linters/formatters.

## Coding Style & Naming Conventions
No formatter or linter is configured yet. Until one exists, use these defaults:
- Python: 4-space indentation, `snake_case` for functions/modules, `PascalCase` for classes.
- HTML/CSS/JS: 2-space indentation, `kebab-case` for filenames, `camelCase` for JS variables.
- Prefer clear, descriptive names (`account_balance`, `budgetReport`).

If you add a formatter or linter (e.g., `black`, `ruff`, `prettier`), note the configuration and how to run it.

## Testing Guidelines
No testing framework is configured. If you add tests:
- Place them under `tests/` and keep names aligned with source files (e.g., `tests/reporting/test_budget.py`).
- Document how to run them and any coverage expectations.
- Note the framework used (e.g., `pytest` for Python, a browser test runner for web assets).

## Commit & Pull Request Guidelines
There is no Git history in this repository yet, so no commit convention is established. Recommended default:
- Commit messages in imperative mood (e.g., “Add monthly budget parser”).
- Include scope when helpful (e.g., “reports: add cashflow export”).

For pull requests, include:
- A short description of the change.
- Any relevant context or links to issues.
- Screenshots or sample output if the change affects user-visible output.

## Configuration & Secrets
Do not commit secrets or personal financial data. Prefer `.env` files and document required variables in `docs/` or a future `README.md`.
