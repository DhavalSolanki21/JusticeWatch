# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Git LFS tracking for pre-trained Machine Learning artifacts (`.pkl`, `.keras`).
- Environment variable configuration for Django `SECRET_KEY` and Superuser credentials.
- Comprehensive GitHub templates (Issues, Pull Requests, Code of Conduct).
- CI workflow for basic automated backend/frontend verification.

### Changed
- Complete repository hygiene sweep to remove unused static files and bloated directories.
- Rewritten README to include ML dataset sourcing documentation and architectural diagrams.
- Cleaned up dependency list for Python backend (removed `psycopg2-binary`).

### Removed
- Legacy TypeScript definitions (`.ts`, `.tsx`).
- Hardcoded sensitive credentials from `settings.py` and `create_admin.py`.
