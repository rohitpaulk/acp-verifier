.PHONY: server test

serve:
	cd web && bun run dev

test:
	bun test ./tests
