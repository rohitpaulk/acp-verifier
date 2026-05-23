.PHONY: server test

serve:
	cd web && bun run dev

test:
	bun test ./tests

test_junie:
	AGENTS=junie bun test ./tests
