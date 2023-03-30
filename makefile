SHELL := /bin/bash
.PHONY: start login

start:
	npx clasp push --watch

login:
	npx clasp login