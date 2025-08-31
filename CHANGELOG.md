# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [1.1.0]
### Added
- Extended YAML features (anchors/aliases)
- Schema validation for JSON/YAML
- Shared data persistence on disk, configurable via `SHARE_TTL_MS` and `SHARE_MAX_LEN`
- Example `.env` file and documentation on its usage

### Changed
- New `build` and `rebuild` targets in the Makefile; updated instructions in the README

### Fixed
- Indentation fixes in the Makefile

### Docs
- Added acknowledgments section and guide for copying the `.env.example` file

## [1.0.0]
### Added
- Support for JSON formatting and transformation using jq
- Support for YAML formatting and transformation (via js-yaml + jq)
- Dark mode and light mode toggle
- System theme detection
- Shareable links (backend + UI integration)
- File type indicator (JSON/YAML pill in the UI)
- Copy, download, and clear functionality
- Basic UI with input, output, and file upload
