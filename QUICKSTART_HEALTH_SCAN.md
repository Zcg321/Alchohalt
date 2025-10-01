# Quick Start: Health Scan

## Run the Complete Health Scan

```bash
npm run health:scan
```

This single command runs all health checks and generates comprehensive reports.

## What It Checks

✅ **Environment** - Node.js, Python, dependencies  
📊 **Code Metrics** - File/function size, complexity  
🔍 **Code Quality** - ESLint, TypeScript  
✅ **Tests** - Full suite with coverage  
🗑️ **Dead Code** - Unused exports  
📦 **Dependencies** - Health & security  
🔥 **Smoke Tests** - Critical paths  
📦 **Bundle Size** - Web & mobile  
🏗️ **Build** - Production build + PWA  
🔒 **Security** - Vulnerabilities & updates  

## Generated Reports

All reports are saved in the project root:

- `repo_scan_human.txt` - Human-readable metrics
- `repo_scan.json` - Machine-readable data
- `imports.dot` - Dependency graph
- `deadcode_report.txt` - Unused code
- `deps_report.txt` - Dependency issues
- `size_report.txt` - Bundle size
- `apk_size_report.txt` - Android size
- `security_audit.txt` - Security issues
- `outdated_packages.txt` - Package updates

## Exit Codes

- **0** - All checks passed
- **1** - Issues found (check reports)

## Individual Checks

Run specific checks:

```bash
npm run scan              # Repository metrics
npm run scan:strict       # Enforce budgets
npm run lint              # ESLint
npm run typecheck         # TypeScript
npm test                  # Tests
npm run test:ci           # Tests + coverage
npm run deadcode          # Find unused code
npm run deps:check        # Dependency health
npm run size:report       # Bundle size
npm run build             # Production build
```

## Budgets

Default limits (configurable):
- Max file size: **600 lines**
- Max function length: **80 lines**
- Complexity threshold: **23**

Override budgets:
```bash
SCAN_MAX_FILE=500 SCAN_MAX_FN=60 npm run health:scan
```

## When to Run

- ✅ After every PR merge (automated in CI)
- ✅ Before creating a PR
- ✅ Before releases
- ✅ During code reviews
- ✅ Weekly maintenance

## CI Integration

The health scan runs automatically:
- **On PR merge** - `.github/workflows/post-merge-health.yml`
- **On PR creation** - `.github/workflows/repo-health.yml`
- **Strict checks** - `.github/workflows/repo-health-strict.yml`

View reports in GitHub Actions artifacts.

## Quick Fixes

**Security issues:**
```bash
npm audit fix
```

**Linting issues:**
```bash
npm run lint -- --fix
```

**Outdated packages:**
```bash
npm update
# Or for major versions:
npm outdated  # Review first
npm install package@latest
```

**Bundle too large:**
```bash
npm run bundle:report  # Analyze
npm run lazy:*         # Apply optimizations
```

## Full Documentation

See [HEALTH_SCAN_GUIDE.md](./HEALTH_SCAN_GUIDE.md) for complete documentation.

## Troubleshooting

**Scan fails:**
- Check individual reports for details
- Run specific checks to isolate issues
- Review TypeScript/ESLint errors first

**Reports not generated:**
- Ensure dependencies are installed
- Check Python is available
- Verify write permissions

**Need help?**
- Check [HEALTH_SCAN_GUIDE.md](./HEALTH_SCAN_GUIDE.md)
- Review workflow logs in GitHub Actions
- Create an issue in the repository

---

💡 **Tip:** Run `npm run health:scan` regularly to catch issues early!
