# AGENTS.md

## Cursor Cloud specific instructions

This repository is **not** a buildable/runnable software project. It contains a
single tracked file, `INSTALL.LOG`, which is a legacy Windows installer log from
a 16-bit Visual Basic 3.0 desktop application ("Function One's Southpark Fruit
Machine").

Key facts for future agents:

- There is **no application source code**, no dependency manifest
  (`package.json`, `requirements.txt`, `pyproject.toml`, `go.mod`, etc.), no
  build system, and no services (web server, API, database, queue, worker).
- The referenced binary (`SP_FRUIT.EXE`) and its `.wav` sound assets are **not**
  in the repo — only the plain-text install log remains.
- There is nothing to install, lint, test, build, or run. No dev server, no
  update/setup script, and no "hello world" flow are applicable.
- If asked to "set up the environment" or "run the app", note that no runnable
  product exists here; the only content is a static text artifact.
