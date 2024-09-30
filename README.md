Quick NextJS Starter Repo - Generates a changelog given two Dates

## How it works
1. First we get all commits within the given range using github API request.
2. Then we make requests in parallel to github to get the diff of each request.
3. We then send over the commit messages + diffs + LLM prompt to Greptile Query with instruction to create a changelog.
4. Show the changelog in an editable text area on the frontend.

- 🚀 **Next.js 13 & React 18**
- ⚙️ **Tailwind CSS 3** - A utility-first CSS framework
- 🍓 **Styled Components** - Styling React component
- 📏 **ESLint** — Pluggable JavaScript linter
- 💖 **Prettier** - Opinionated Code Formatter
- 🐶 **Husky** — Use git hooks with ease
- 🚫 **lint-staged** - Run linters against staged git files
- 🗂 **Absolute import** - Import folders and files using the `@` prefix
- 🤩 **Vercel Serverless/Edge Functions** - Serverless/Edge functions for Next.js

## 🚀 Getting started

If you prefer you can clone this repository and run the following commands inside the project folder:

1. `pnpm install` or `npm install`;
2. `pnpm dev`;

You will need to set the following ENV variables in your .env file:

```
GREPTILE_API_KEY=
GITHUB_TOKEN=
```

To view the project open `http://localhost:3000/changelog`.

## Notice
* We default to using `main` branch for now, there is no way frontend component to change that.
* This was done as quickly as possble and so refactoring for code readability would be a nice to have.
* Try to minimize the number of commits within the start/end date because
  too many commits may take up too much time AND may overflow the LLM prompt.

## Improvements
* Caching on Frontend Requests
* Minimize context send to Greptile through getting FINAL_DIFF of changed files instead of every diff.
* Can perhaps use black/whitelisting filenames to remove them from context.
* Batch processing of commits + Greptile querying in such a way to prevent issue of too much context.
* Build up a more structured LLM response format with JSON or
  another format to give us more flexibility/control with the output.

Made by: Ariel Frischer

