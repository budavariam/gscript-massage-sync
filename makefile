SHELL := /bin/bash
.PHONY: start login

start:
	# automatically push on file changes
	npx clasp push --watch

login:
	# log in to google console
	npx clasp login

status:
	# check which files would be uploaded
	npx clasp status
