# Contributing to CasaTrack

Thank you for your interest in contributing to CasaTrack! This document provides guidelines and instructions for contributing.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CasaTrack
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy `.env.example` to `.env.local` and fill in the required values.

4. **Set up the database**
   Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor.

5. **Start the development server**
   ```bash
   npm run dev
   ```

## Code Style

### TypeScript
- Use strict TypeScript settings
- Avoid `any` types
- Use proper type definitions
- Add JSDoc comments for public APIs

### React Components
- Use functional components with hooks
- Keep components small and focused (<300 lines)
- Extract reusable logic into custom hooks
- Use TypeScript for props

### File Naming
- Components: PascalCase (e.g., `PropertyCard.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useProperties.ts`)
- Utilities: camelCase (e.g., `common.ts`)
- Types: PascalCase (e.g., `Property.ts`)

## Git Workflow

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Update documentation as needed

3. **Commit your changes**
   ```bash
   git commit -m "feat: add new feature"
   ```
   
   Use conventional commit messages:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `style:` for formatting changes
   - `refactor:` for code refactoring
   - `chore:` for maintenance tasks

4. **Push your changes**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request**
   - Provide a clear description of your changes
   - Reference any related issues

## Code Review Process

1. All code must be reviewed before merging
2. Address review comments promptly
3. Ensure CI checks pass
4. Get approval from maintainers

## Questions?

If you have questions, please open an issue or contact the maintainers.
