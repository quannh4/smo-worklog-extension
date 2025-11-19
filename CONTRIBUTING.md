# Contributing to SMO Worklog Extension

Thank you for your interest in contributing! We welcome contributions from everyone.

## How to Contribute

### 1. Fork the Repository

1. Click the **Fork** button at the top right of this repository
2. This creates a copy in your GitHub account

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/smo-worklog-extension.git
cd smo-worklog-extension
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

**Branch naming conventions:**
- `feature/` - for new features
- `fix/` - for bug fixes
- `docs/` - for documentation updates
- `refactor/` - for code refactoring

### 4. Make Your Changes

- Write clear, concise commit messages
- Follow the existing code style
- Test your changes thoroughly
- Update documentation if needed

### 5. Commit Your Changes

```bash
git add .
git commit -m "feat: add your feature description"
# or
git commit -m "fix: fix the bug description"
```

**Commit message format:**
- `feat:` - new feature
- `fix:` - bug fix
- `docs:` - documentation changes
- `style:` - formatting changes
- `refactor:` - code refactoring
- `test:` - adding tests
- `chore:` - maintenance tasks

### 6. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 7. Create a Pull Request

1. Go to the original repository
2. Click **New Pull Request**
3. Select your fork and branch
4. Fill in the PR template with:
   - Clear description of changes
   - Related issue numbers (if any)
   - Screenshots (if UI changes)
   - Testing steps

## Development Setup

1. Load the extension in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked**
   - Select the project folder

2. Make changes to the code

3. Reload the extension:
   - Go to `chrome://extensions/`
   - Click the **Reload** button

## Code Guidelines

### JavaScript
- Use modern ES6+ syntax
- Use `const` and `let` (avoid `var`)
- Write descriptive variable names
- Add comments for complex logic
- Handle errors gracefully

### HTML/CSS
- Keep HTML semantic
- Use consistent indentation (2 spaces)
- Mobile-first responsive design
- Accessible markup (ARIA labels where needed)

### Testing
- Test all changes manually
- Verify on different screen sizes
- Check browser console for errors
- Test with different date ranges and edge cases

## What to Contribute

### Good First Issues
- Documentation improvements
- UI/UX enhancements
- Bug fixes
- Adding tests
- Code refactoring

### Feature Ideas
- Dark mode support
- Multiple project selection
- Export worklog to CSV
- Worklog history view
- Customizable work templates
- Support for other browsers (Firefox, Edge)

### Reporting Bugs
Open an issue with:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Browser version and OS
- Screenshots if applicable

### Suggesting Features
Open an issue with:
- Clear description of the feature
- Use cases and benefits
- Potential implementation approach
- Mockups or examples (if applicable)

## Pull Request Process

1. **Update documentation** if your changes require it
2. **Test thoroughly** before submitting
3. **Keep PRs focused** - one feature/fix per PR
4. **Respond to feedback** - be open to suggestions
5. **Be patient** - maintainers will review as soon as possible

## Code Review

- All PRs require at least one approval
- Address review comments promptly
- Be respectful and constructive
- Learn from feedback

## Community Guidelines

- Be respectful and inclusive
- Welcome newcomers
- Provide constructive feedback
- Ask questions if unclear
- Help others learn and grow

## Questions?

If you have questions:
- Open a GitHub issue with the `question` label
- Check existing issues and discussions
- Reach out to maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for making SMO Worklog Extension better! 🚀**

