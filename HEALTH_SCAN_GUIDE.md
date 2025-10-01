# Alchohalt Repository Health Scan Guide

## Overview

This guide provides comprehensive instructions for performing a full health scan of the Alchohalt repository. The health scan should be executed after every pull request merge to ensure that the codebase remains healthy, maintainable, and reliable.

## Quick Start

To run the complete health scan:

```bash
npm run health:scan
```

This single command executes all health checks in sequence and generates comprehensive reports.

## What Gets Checked

The health scan performs the following checks:

### 1. Environment Setup
- ✅ Node.js version (should be 18 to match CI)
- ✅ Python availability
- ✅ Dependencies installation

### 2. Repository Scan and Budgets
- 📊 **Code metrics**: Lines of code by group and module
- 📏 **File size budget**: Max 600 lines per file (configurable)
- 🔧 **Function length budget**: Max 80 lines per function (configurable)
- 🔀 **Complexity budget**: Max 23 cyclomatic complexity (configurable)
- 📝 **TODO/FIXME tracking**: All technical debt markers
- 🕸️ **Import graph**: Visualizes TypeScript/JavaScript dependencies

**Default Budgets:**
- Max file size: 600 LOC
- Max function length: 80 lines
- Complexity threshold: 23

**Override Budgets:**
```bash
SCAN_MAX_FILE=500 SCAN_MAX_FN=60 SCAN_COMPLEXITY=20 npm run health:scan
```

### 3. Linting and Type Checking
- ✅ ESLint: Code style and best practices
- ✅ TypeScript: Type safety and correctness

### 4. Testing and Coverage
- ✅ Test suite: All unit and integration tests
- ✅ Coverage threshold: Minimum 50% (configurable in coverage_gate.cjs)

### 5. Dead Code and Dependencies
- 🗑️ **Dead code detection**: Unused exports and modules
- 📦 **Dependency health**: Missing or unused dependencies

### 6. Smoke Tests
- 🔥 Auto-generated smoke tests for critical paths

### 7. Bundle Size and Performance
- 📦 **Web bundle size**: Target ~250 KB gzip initial
- 📱 **APK size**: Target <30 MB for Android

### 8. Build Verification
- ✅ Production build succeeds
- ✅ PWA assets generated (manifest, service worker)

### 9. Security
- 🔒 **Vulnerability audit**: npm audit for known CVEs
- 📦 **Outdated packages**: Checks for available updates

## Generated Reports

The health scan generates the following reports:

| Report File | Description |
|-------------|-------------|
| `repo_scan_human.txt` | Human-readable repository metrics |
| `repo_scan.json` | Machine-readable JSON metrics |
| `imports.dot` | Import graph in DOT format |
| `imports.png` | Import graph visualization (requires Graphviz) |
| `deadcode_report.txt` | Unused code analysis |
| `deps_report.txt` | Dependency health check |
| `size_report.txt` | Bundle size analysis |
| `apk_size_report.txt` | Android APK size |
| `security_audit.txt` | Security vulnerabilities |
| `outdated_packages.txt` | Available package updates |

## Individual Commands

You can run individual health checks:

```bash
# Repository scan
npm run scan              # Human-readable report
npm run scan:json         # JSON output
npm run scan:strict       # Enforces budgets (fails on violations)
npm run scan:full         # Human report + JSON artifact

# Code quality
npm run lint              # ESLint
npm run typecheck         # TypeScript

# Testing
npm test                  # Run tests
npm run test:ci           # Tests with coverage
npm run coverage:check    # Verify coverage threshold
npm run test:smoke        # Smoke tests

# Code health
npm run deadcode          # Find unused code
npm run deps:check        # Check dependencies

# Performance
npm run size:prep         # Prepare size config
npm run size:report       # Bundle size analysis
npm run apk:size          # Android APK size

# Combined
npm run health:all        # All checks (legacy command)
```

## Interpreting Results

### Repository Scan Output

**Large Files (>600 lines):**
- Break into smaller modules
- Extract reusable functions
- Consider splitting UI components

**Long Functions (>80 lines):**
- Refactor into smaller functions
- Use React hooks for component logic
- Apply single responsibility principle

**High Complexity (>23):**
- Simplify conditionals
- Extract helper functions
- Apply design patterns

**TODO/FIXME Comments:**
- Address or create tickets
- Track technical debt

### Bundle Size

**Target Budgets:**
- Initial JS bundle: ~250 KB gzip
- Total lazy-loaded: <1.5 MB
- Android APK: <30 MB

**Optimization Tips:**
- Use dynamic `import()` for code splitting
- Analyze bundle with `npm run bundle:report`
- Lazy load heavy libraries
- Optimize images and assets

### Security Audit

**Vulnerabilities Found:**
1. Run `npm audit fix` for automatic fixes
2. Review `npm audit` output for manual fixes
3. Update dependencies with breaking changes carefully
4. Check changelogs before major version updates

## CI/CD Integration

The health scan is integrated into GitHub Actions:

### On Every PR and Push to Main
- **repo-health.yml**: Basic health checks
- **repo-health-strict.yml**: Comprehensive checks with strict budgets

### Workflow Files
- `.github/workflows/repo-health.yml`
- `.github/workflows/repo-health-strict.yml`

## Continuous Improvement

### Periodic Tasks

**Weekly:**
- Review generated reports
- Address TODO/FIXME items
- Update dependencies: `npm outdated`

**Monthly:**
- Audit security: `npm audit`
- Review and adjust budgets
- Refactor large/complex files

**Quarterly:**
- Major dependency updates
- Review and update CI configuration
- Evaluate new tools and practices

### Adjusting Budgets

Edit budgets in `repo_scan.py` or via environment variables:

```bash
# Temporary override
SCAN_MAX_FILE=700 npm run scan:strict

# Permanent change (edit repo_scan.py)
MAX_FILE_LOC_WARN = 700
MAX_FN_LINES_WARN = 100
COMPLEXITY_WARN = 25
```

**When to Increase Budgets:**
- Large configuration files
- Generated code
- Complex business logic that can't be simplified

**When to Decrease Budgets:**
- After successful refactoring
- To encourage modular design
- When codebase matures

## Pre-Commit Hooks

Set up automatic checks before commits using husky:

```bash
# Install husky
npm install --save-dev husky

# Initialize husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run typecheck"
```

## Release Checklist

Before releasing, run the complete release checklist:

```bash
npm run release:checklist
```

This includes:
- ✅ Type checking
- ✅ Linting
- ✅ Full test suite
- ✅ Production build
- ✅ PWA validation
- ✅ Capacitor sync
- ✅ Bundle size check
- ✅ Security audit

## Troubleshooting

### Health Scan Fails

**ESLint errors:**
```bash
npm run lint -- --fix  # Auto-fix simple issues
```

**TypeScript errors:**
- Check for missing type definitions
- Avoid using `any`
- Use strict mode

**Tests failing:**
- Run tests in watch mode: `npm test`
- Check test output for specifics
- Ensure mocks are updated

**Build fails:**
- Clear cache: `rm -rf node_modules dist && npm install`
- Check for TypeScript errors
- Verify environment variables

**Coverage below threshold:**
- Add tests for uncovered code
- Focus on critical paths
- Run `npm run coverage:check` to see current %

### Performance Issues

**Slow health scan:**
- Run individual commands instead of full scan
- Skip optional checks (APK size, Graphviz)
- Use faster test runners

**Large bundle size:**
- Analyze: `npm run bundle:report`
- Lazy load heavy dependencies
- Check for duplicate dependencies

## References

- **repo_scan.py**: Repository health scanner
- **scripts/health-scan.sh**: Comprehensive health scan script
- **scripts/release-checklist.sh**: Release validation
- **tools/scan_report.sh**: CI scan report generator
- **.eslintrc.cjs**: ESLint configuration
- **tsconfig.json**: TypeScript configuration
- **vitest.config.ts**: Test configuration

## Support

For issues or questions:
- Check this guide first
- Review generated reports
- Consult GitHub workflow logs
- Create an issue in the repository

## Summary

The health scan ensures:
- ✅ Code quality and maintainability
- ✅ Test coverage and reliability
- ✅ Performance and bundle size
- ✅ Security and dependency health
- ✅ Build and deployment readiness

Run `npm run health:scan` regularly to catch issues early and maintain a healthy codebase!
