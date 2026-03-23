When a new GitHub issue is provided to you, perform the following workflow:
- analyze the issue
- reproduce it locally
- use Playwright MCP if browser reproduction is needed and take screenshots before fixing and after fixing
- identify the root cause
- implement the fix
- validate locally
- retest the original scenario after the fix
- prepare a PR draft
- prepare an RCA email draft with subject and body

Do not stop at “could not reproduce” unless you clearly document all attempted reproduction steps, environments, and blockers.