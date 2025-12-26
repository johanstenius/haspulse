# Changelog

## 0.2.1

- Fix: add missing Authorization header to ping requests

## 0.2.0

- Add no-op mode: `ping()` and `wrap()` silently skip when `apiKey` undefined
- Rename package to `@haspulse/sdk`
- Document `wrap()` method in README

## 0.1.0

- Initial release
- `ping()` for manual signals
- `wrap()` for automatic start/success/fail
- Management APIs: projects, checks, channels, incidents, maintenance, organizations, api-keys
- Pagination helpers: `paginate()`, `fetchAll()`
- Typed error classes
