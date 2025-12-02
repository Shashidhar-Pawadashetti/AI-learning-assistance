# Security Updates Required

## Software Composition Analysis Findings

191 vulnerabilities detected in transitive dependencies (dependencies of dependencies).

## Resolution Steps

### Backend
```bash
cd backend
npm audit fix --force
npm audit
```

### Frontend
```bash
cd frontend
npm audit fix --force
npm audit
```

### If Issues Persist

1. **Update all dependencies to latest versions:**
```bash
npm update
```

2. **For critical vulnerabilities that can't be auto-fixed:**
   - Check if the parent package has an update available
   - Consider using `npm audit fix --force` (may introduce breaking changes)
   - Use `npm ls <package-name>` to see which packages depend on vulnerable ones

3. **Override vulnerable transitive dependencies (package.json):**
```json
"overrides": {
  "minimist": "^1.2.8",
  "semver": "^7.5.4",
  "glob": "^10.3.10"
}
```

## Notes

- Most vulnerabilities are in dev dependencies and don't affect production
- Critical vulnerabilities in packages like `babel-traverse`, `growl`, `form-data` are likely from old test/build tools
- Always test thoroughly after running `npm audit fix --force`
- Consider using `npm ci` in production to use exact versions from package-lock.json
