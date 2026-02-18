# Architecture Documentation

This directory contains architecture documentation for the Tindera React application.

## Contents

### Component Hierarchies
- **[InventoryListPage-Component-Hierarchy.md](./InventoryListPage-Component-Hierarchy.md)** - Detailed component hierarchy diagram and documentation for the Inventory List Page, including all child components, state management, and navigation patterns.

### Directory Structure & Naming
- **[Pages-vs-Features-Analysis.md](./Pages-vs-Features-Analysis.md)** - ⭐ **Important**: Analysis and recommendation for renaming `src/pages/` to `src/features/`. Includes rationale, comparison of options, and migration strategy.

### Reorganization Proposals
- **[Inventory-Folder-Reorganization-Proposal.md](./Inventory-Folder-Reorganization-Proposal.md)** - Comprehensive proposal for reorganizing the Inventory folder structure from flat to feature-based organization. Includes three different options with detailed analysis.

- **[Inventory-Structure-Comparison.md](./Inventory-Structure-Comparison.md)** - Visual side-by-side comparison of current vs. recommended Inventory folder structures, including decision matrices and migration complexity analysis.

### Migration Scripts
- **[pages-to-features-migration.sh](./pages-to-features-migration.sh)** - ⭐ **Run First**: Automated script to rename `pages/` to `features/` and update all import paths.
- **[inventory-migration-script.sh](./inventory-migration-script.sh)** - Automated bash script for executing the Inventory folder reorganization. Use with caution in a feature branch.

## Quick Links

### For Developers
- Understanding component relationships: See [InventoryListPage-Component-Hierarchy.md](./InventoryListPage-Component-Hierarchy.md)
- Finding components in Inventory: See current structure in comparison docs
- Contributing to Inventory: Review reorganization proposal first

### For Architects
- Structural improvements: See [Inventory-Folder-Reorganization-Proposal.md](./Inventory-Folder-Reorganization-Proposal.md)
- Decision rationale: See comparison document with decision matrix
- Migration planning: Review proposal document phases 1-8

## Document Summaries

### InventoryListPage Component Hierarchy
**Purpose:** Visual and textual documentation of all components used in the Inventory List Page

**Key Sections:**
- Mermaid diagram showing component tree
- Component structure outline with descriptions
- State management documentation
- Navigation patterns (desktop vs mobile)
- Component file locations

**Use When:**
- Learning the Inventory page architecture
- Adding new features to Inventory
- Debugging component relationships
- Onboarding new developers

---

### Pages vs Features Analysis
**Purpose:** Comprehensive analysis of whether to rename `src/pages/` to `src/features/`

**Key Sections:**
- Current structure analysis (what we actually have)
- Four naming options compared (features, pages, modules, domains)
- Detailed recommendation: Use `features/` directory
- Migration strategy with automated script
- Impact analysis and risk assessment
- Naming convention decisions (lowercase vs PascalCase)

**Use When:**
- Making architectural naming decisions
- Understanding why features > pages
- Planning the pages → features migration
- Discussing directory structure with team

**Recommendation:** ⭐ Rename to `features/` - it accurately describes the structure

---

### Inventory Folder Reorganization Proposal
**Purpose:** Comprehensive proposal for improving Inventory folder structure

**Key Sections:**
- Current structure issues
- Three reorganization options:
  - Option 1: Feature-Based (Recommended)
  - Option 2: Component-Type Based
  - Option 3: Hybrid Approach
- Migration strategy (8 phases)
- Import path examples
- Testing checklist

**Use When:**
- Planning structural improvements
- Discussing architecture changes
- Estimating refactoring effort
- Reviewing migration approach

---

### Inventory Structure Comparison
**Purpose:** Visual comparison and analysis of structural options

**Key Sections:**
- Side-by-side structure comparison
- Component count by category
- Migration complexity matrix
- Decision matrix (with ratings)
- Benefits summary
- Developer experience improvements

**Use When:**
- Making architectural decisions
- Presenting proposals to team
- Understanding trade-offs
- Justifying reorganization effort

---

### Migration Script
**Purpose:** Automated execution of Inventory folder reorganization

**Key Features:**
- Creates new directory structure
- Moves all files to correct locations
- Creates barrel export (index.ts) files
- Cleans up old directories
- Uses git mv to preserve history

**Use When:**
- Executing approved reorganization
- Testing migration in feature branch
- Automating repetitive file moves

**Safety:**
- Always run in a feature branch
- Commit all changes before running
- Review script before execution
- Test thoroughly after migration

## Recommended Reading Order

### For New Developers
1. Start with **InventoryListPage-Component-Hierarchy.md** to understand current architecture
2. Browse **Inventory-Structure-Comparison.md** to see where things are located
3. Reference docs as needed when working on features

### For Team Leads / Architects

**If planning structural improvements:**

1. **READ FIRST:** **Pages-vs-Features-Analysis.md** - Understand the pages → features rename
2. **THEN:** **Inventory-Folder-Reorganization-Proposal.md** - Plan inventory reorganization
3. **COMPARE:** **Inventory-Structure-Comparison.md** - See visual comparisons
4. **DECIDE:** Migration order (see "Recommended Migration Order" below)
5. **EXECUTE:** Use migration scripts after team approval

### For Code Reviewers
1. Keep **InventoryListPage-Component-Hierarchy.md** open for reference
2. Check that changes align with architectural patterns
3. Verify import paths follow conventions

## Recommended Migration Order

If implementing both refactorings, follow this sequence:

### ✅ Recommended: Sequential Approach

**Phase 1: Rename pages → features** (Week 1)
1. Run `pages-to-features-migration.sh`
2. Update config files manually
3. Test thoroughly
4. Merge to main
5. **Benefits:** Smaller PR, easier review, clean foundation

**Phase 2: Reorganize Inventory** (Week 2)
1. Run `inventory-migration-script.sh`
2. Update import paths
3. Test thoroughly
4. Merge to main
5. **Benefits:** Changes are isolated, easier to track

**Total Time:** 2 weeks (safer, cleaner git history)

### ⚠️ Alternative: Combined Approach

**Do both in one PR** (Week 1)
- Rename pages → features
- Reorganize inventory components
- Update all imports at once

**Pros:** One-time disruption, faster overall
**Cons:** Larger PR, harder to review, riskier to rollback

**Recommendation:** Use sequential approach unless time-constrained

## Contributing

When adding new architecture documentation:

1. **Use clear naming** - Include feature/component name in filename
2. **Include diagrams** - Mermaid diagrams are preferred for version control
3. **Provide context** - Explain why, not just what
4. **Show examples** - Include code snippets and file paths
5. **Update this README** - Add your new document to the contents section

## Document Templates

### Component Hierarchy Template
```markdown
# [ComponentName] Component Hierarchy

## Visual Diagram
[Mermaid diagram]

## Component Structure Outline
[Detailed tree structure]

## State Management
[State variables and logic]

## File Locations
[Directory structure]
```

### Reorganization Proposal Template
```markdown
# [Feature] Folder Reorganization Proposal

## Current Structure Issues
[Problems with current structure]

## Proposed Structure
[New structure with options]

## Migration Strategy
[Step-by-step migration plan]

## Testing Checklist
[What to test after migration]
```

## Tools and Resources

### Diagram Tools
- **Mermaid** - For flowcharts and diagrams (recommended)
- **PlantUML** - Alternative diagram tool
- **Excalidraw** - For hand-drawn style diagrams

### Useful Commands
```bash
# Generate file tree
tree -L 3 src/pages/Inventory

# Count components by directory
find src/pages/Inventory -name "*.tsx" | wc -l

# Find all imports of a component
grep -r "import.*ComponentName" src/

# Make migration script executable
chmod +x docs/architecture/inventory-migration-script.sh
```

## Questions?

If you have questions about these documents or need clarification:
1. Check the document's examples section
2. Review the comparison documents for trade-offs
3. Ask in team architecture discussions
4. Update docs if information is missing

## Future Documentation

Planned additions:
- [ ] State management patterns
- [ ] API integration architecture
- [ ] Component composition guidelines
- [ ] Performance optimization strategies
- [ ] Testing architecture
- [ ] Routing patterns
- [ ] Form handling patterns
- [ ] Data fetching strategies
