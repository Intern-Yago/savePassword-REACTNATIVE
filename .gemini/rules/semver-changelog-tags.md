# Directives for Versioning, Changelog & Git Release Tags

1. **Semantic Versioning (SemVer)**:
   - Always use the `MAJOR.MINOR.PATCH` format (e.g., `v1.0.0`, `v1.1.0`, `v1.0.1`).
   - Increment `MAJOR` for breaking changes.
   - Increment `MINOR` for new backward-compatible features.
   - Increment `PATCH` for backward-compatible bug fixes.

2. **CHANGELOG.md Maintenance**:
   - Maintain and update a `CHANGELOG.md` file in the root of every repository.
   - Follow the [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) standard.
   - Organize entries under standardized sections: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, and `Security`.

3. **Git Release Tags Workflow**:
   - When completing features, fixes, or releases, create an annotated Git tag matching the version:
     `git tag -a vX.Y.Z -m "Release vX.Y.Z - Short description"`
   - Always push the commits and tags to the remote repository:
     `git push origin main --tags`
