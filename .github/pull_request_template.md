## Summary
- [ ] Purpose of this change

## Checks
- [ ] `npm run scan:strict` passes
- [ ] Coverage ≥ ${{ env.TEST_COVERAGE_LINES || 70 }}%
- [ ] `npm run deadcode` shows **no** removable exports
- [ ] `npm run deps:check` shows **no** unused deps
- [ ] `npm run size:report` within budget
- [ ] (If Android) `npm run apk:size` within budget
