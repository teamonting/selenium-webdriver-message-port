# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added [structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) for marshalling objects, in PR [#9](https://github.com/teamonting/selenium-webdriver-message-port/pull/9), by [@compulim](https://github.com/compulim)

### Changed

- 💥 Added `.js` suffix to named exports, in PR [#8](https://github.com/teamonting/selenium-webdriver-message-port/pull/8), by [@compulim](https://github.com/compulim)
  - `@onting/selenium-webdriver-messageport/browser` is now `@onting/selenium-webdriver-messageport/browser.js`
  - `@onting/selenium-webdriver-messageport/host` is now `@onting/selenium-webdriver-messageport/host.js`

### Fixed

- Fixed `MessagePort` should close if `viaBiDi()` call failed prematurely, in PR [#7](https://github.com/teamonting/selenium-webdriver-message-port/pull/7), by [@compulim](https://github.com/compulim)

## [0.1.0] - 2026-06-08

### Added

- Initial public release

[Unreleased]: https://github.com/teamonting/selenium-webdriver-message-port/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/teamonting/selenium-webdriver-message-port/releases/tag/v0.1.0
