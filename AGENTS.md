<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# afterbuild skill

Use this skill to turn a finished codebase into a polished document. Follow this order:

## 1. Analyze
Run `afterbuild analyze` in your project root. I will read the output from `.afterbuild/brief.md` and `.afterbuild/brief.json` to understand your project’s purpose, architecture, and features.

## 2. Choose a mode
Let me know which type of document you want:
- **product-docs** – user‑friendly documentation for your product or library
- **technical-docs** – technical documentation for developers
- **research-report** – structured research report with citations
- **storytelling** – narrative journey of building your project
- **case-study** – retrospective analysis and lessons learned

## 3. Interview
I will ask up to 5 questions about your project and goals to tailor the document. For example:
- What is the main problem you’re solving?
- Who is the target audience?
- What are the key features or decisions?

## 4. Draft
I will write the document using the mode’s structure and voice. Every technical claim will trace to code or the brief. I won’t invent features, benchmarks, or numbers.

## 5. Verify
Run `afterbuild verify <draft.md>` to check:
- All hyperlinks are working
- Code references (file paths, function names) exist in the repo
- CLI flags are documented in config files

I will fix or remove anything flagged and show you a summary.

## 6. Export
Choose your output format (`md`, `docx`, `pdf`) and run `afterbuild export <draft.md> --to <format>`. I will save the result in `/docs/` and ask before overwriting.

---

**Remember:** This skill is bundled with the `afterbuild` CLI. Use `afterbuild init` to install it into your project.

