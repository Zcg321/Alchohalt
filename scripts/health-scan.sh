#!/bin/bash

# Comprehensive Health Scan for Alchohalt Repository
# This script performs a full health scan of the codebase following the guidelines
# from the Repository Health Scan report. It should be executed after every PR merge.

# Don't exit on error - we want to run all checks even if some fail
set +e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCAN_MAX_FILE=${SCAN_MAX_FILE:-600}
SCAN_MAX_FN=${SCAN_MAX_FN:-80}
SCAN_COMPLEXITY=${SCAN_COMPLEXITY:-23}

# Function to print section headers
print_header() {
    echo
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo
}

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2 (exit code: $1)"
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Track overall status
ISSUES_FOUND=0

# Header
echo -e "${GREEN}🏥 Alchohalt Repository Health Scan${NC}"
echo -e "${GREEN}====================================${NC}"
echo
echo "Scan Configuration:"
echo "  Max file size: ${SCAN_MAX_FILE} lines"
echo "  Max function length: ${SCAN_MAX_FN} lines"
echo "  Complexity threshold: ${SCAN_COMPLEXITY}"
echo

# ========================================
# 1. Environment Setup
# ========================================
print_header "1. Environment Setup"

print_info "Checking Node.js version..."
node --version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -eq 18 ]; then
    print_status 0 "Node.js 18 detected (matches CI)"
else
    print_warning "Node.js version is $NODE_VERSION (CI uses 18)"
fi

print_info "Checking Python version..."
python3 --version
print_status $? "Python available"

print_info "Checking dependencies..."
if [ -d "node_modules" ]; then
    print_status 0 "Dependencies installed"
else
    print_warning "Dependencies not installed, running npm install..."
    npm install
    print_status $? "Dependencies installed"
fi

# ========================================
# 2. Repository Scan and Budgets
# ========================================
print_header "2. Repository Scan and Budgets"

print_info "Running full scan (human-readable report)..."
python3 repo_scan.py | head -500 > repo_scan_human.txt
print_status $? "Human-readable report generated"
echo "Report saved to: repo_scan_human.txt (first 500 lines)"

print_info "Running JSON scan..."
python3 repo_scan.py --json > repo_scan.json
print_status $? "JSON report generated"
echo "Report saved to: repo_scan.json"

print_info "Running strict budget scan..."
SCAN_MAX_FILE=$SCAN_MAX_FILE SCAN_MAX_FN=$SCAN_MAX_FN SCAN_COMPLEXITY=$SCAN_COMPLEXITY python3 repo_scan.py --fail || SCAN_RESULT=$?
if [ ${SCAN_RESULT:-0} -ne 0 ]; then
    print_status $SCAN_RESULT "Budget violations detected - review repo_scan_human.txt"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    print_status 0 "All budgets within limits"
fi

print_info "Generating import graph..."
python3 repo_scan.py --dot imports.dot
if command -v dot >/dev/null 2>&1; then
    dot -Tpng imports.dot -o imports.png
    print_status $? "Import graph generated (imports.png)"
else
    print_warning "Graphviz not installed - DOT file only (imports.dot)"
fi

# Display key metrics
echo
print_info "Key Metrics:"
grep "Total LOC:" repo_scan_human.txt || true
grep "TODO/FIXME/HACK markers:" repo_scan_human.txt || true
echo

# ========================================
# 3. Linting and Type Checking
# ========================================
print_header "3. Linting and Type Checking"

print_info "Running ESLint..."
npm run lint
LINT_RESULT=$?
print_status $LINT_RESULT "ESLint"
if [ $LINT_RESULT -ne 0 ]; then
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

print_info "Running TypeScript type checking..."
npm run typecheck
TYPECHECK_RESULT=$?
print_status $TYPECHECK_RESULT "TypeScript type checking"
if [ $TYPECHECK_RESULT -ne 0 ]; then
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# ========================================
# 4. Testing and Coverage
# ========================================
print_header "4. Testing and Coverage"

print_info "Running test suite..."
npm run test:ci
TEST_RESULT=$?
print_status $TEST_RESULT "Test suite"
if [ $TEST_RESULT -ne 0 ]; then
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

print_info "Checking coverage..."
npm run coverage:check
COVERAGE_RESULT=$?
print_status $COVERAGE_RESULT "Coverage threshold"
if [ $COVERAGE_RESULT -ne 0 ]; then
    print_warning "Coverage below threshold"
fi

# ========================================
# 5. Dead Code and Dependency Checks
# ========================================
print_header "5. Dead Code and Dependency Checks"

print_info "Checking for dead code..."
npm run deadcode > deadcode_report.txt || true
DEADCODE_RESULT=$?
if [ $DEADCODE_RESULT -eq 0 ]; then
    print_status 0 "Dead code analysis complete"
    echo "Report saved to: deadcode_report.txt"
else
    print_warning "Dead code analysis completed with warnings - see deadcode_report.txt"
fi

print_info "Checking dependency health..."
npm run deps:check > deps_report.txt || true
DEPS_RESULT=$?
if [ $DEPS_RESULT -eq 0 ]; then
    print_status 0 "Dependency health check passed"
else
    print_warning "Dependency issues detected - see deps_report.txt"
fi

# ========================================
# 6. Smoke Tests
# ========================================
print_header "6. Smoke Tests"

print_info "Generating and running smoke tests..."
npm run test:smoke
SMOKE_RESULT=$?
print_status $SMOKE_RESULT "Smoke tests"
if [ $SMOKE_RESULT -ne 0 ]; then
    print_warning "Smoke tests failed or not configured"
fi

# ========================================
# 7. Bundle Size and Performance
# ========================================
print_header "7. Bundle Size and Performance"

print_info "Preparing size limit configuration..."
npm run size:prep
SIZE_PREP_RESULT=$?
print_status $SIZE_PREP_RESULT "Size configuration"

print_info "Running size analysis..."
npm run size:report > size_report.txt || true
SIZE_RESULT=$?
if [ $SIZE_RESULT -eq 0 ]; then
    print_status 0 "Bundle size analysis complete"
    echo "Report saved to: size_report.txt"
else
    print_warning "Size analysis completed with warnings - see size_report.txt"
fi

print_info "Checking APK size (Android)..."
npm run apk:size > apk_size_report.txt || true
APK_RESULT=$?
if [ $APK_RESULT -eq 0 ]; then
    print_status 0 "APK size check complete"
else
    print_warning "APK size check skipped or failed - see apk_size_report.txt"
fi

# ========================================
# 8. Build Verification
# ========================================
print_header "8. Build Verification"

print_info "Building web application..."
npm run build
BUILD_RESULT=$?
print_status $BUILD_RESULT "Production build"
if [ $BUILD_RESULT -ne 0 ]; then
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

print_info "Checking PWA assets..."
if [ -f "dist/manifest.webmanifest" ] && [ -f "dist/sw.js" ]; then
    print_status 0 "PWA assets present"
else
    print_warning "PWA assets missing or incomplete"
fi

# ========================================
# 9. Security and Dependency Updates
# ========================================
print_header "9. Security and Dependency Updates"

print_info "Auditing dependencies for vulnerabilities..."
npm audit --audit-level moderate > security_audit.txt || true
AUDIT_RESULT=$?
if [ $AUDIT_RESULT -eq 0 ]; then
    print_status 0 "No security vulnerabilities found"
else
    print_warning "Security vulnerabilities detected - see security_audit.txt"
    echo "Run 'npm audit fix' to attempt automatic fixes"
fi

print_info "Checking for outdated packages..."
npm outdated > outdated_packages.txt || true
if [ -s outdated_packages.txt ]; then
    print_warning "Outdated packages detected - see outdated_packages.txt"
else
    print_status 0 "All packages up to date"
fi

# ========================================
# 10. Summary
# ========================================
print_header "Summary"

echo "Generated Reports:"
echo "  - repo_scan_human.txt   : Human-readable repo scan"
echo "  - repo_scan.json        : Machine-readable repo scan"
echo "  - imports.dot           : Import graph (DOT format)"
[ -f "imports.png" ] && echo "  - imports.png           : Import graph visualization"
echo "  - deadcode_report.txt   : Dead code analysis"
echo "  - deps_report.txt       : Dependency health check"
echo "  - size_report.txt       : Bundle size analysis"
echo "  - apk_size_report.txt   : Android APK size"
echo "  - security_audit.txt    : Security audit results"
echo "  - outdated_packages.txt : Outdated packages list"
echo

# Overall status
if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ Health scan completed successfully!${NC}"
    echo -e "${GREEN}No critical issues found.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Health scan completed with $ISSUES_FOUND critical issue(s).${NC}"
    echo -e "${YELLOW}Review the reports above for details.${NC}"
    exit 1
fi
