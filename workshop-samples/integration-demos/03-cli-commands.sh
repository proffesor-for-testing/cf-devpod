#!/bin/bash

# =============================================================================
# INTEGRATION DEMO #3: CLI One-Liners for Ad-Hoc Quality Checks
#
# Workshop: Quality Engineering in the Agentic Age
# Phase: ORCHESTRATE
#
# These commands use the REAL `aqe` CLI from the `agentic-qe` npm package
# (installed by .devcontainer/install-tools.sh). Where Agentic QE does not
# have a direct subcommand for the task — verifying test quality, finding
# spec contradictions, code review — we delegate to Claude Code with a
# precise prompt or slash command.
#
# Verify the tool first:
#   aqe --version            # should print 3.9.x or newer
#   aqe --help               # shows all subcommands
# =============================================================================

# -----------------------------------------------------------------------------
# BASIC AGENTIC QE COMMANDS
#
# This file is a reference, NOT a script to run end-to-end. Copy individual
# lines into your shell. Lines starting with `#` are comments.
# -----------------------------------------------------------------------------

# Initialize the AQE v3 system in this project once (creates .agentic-qe/)
# aqe init --auto

# Security SAST scan on a directory or file
aqe security --sast --target src/api/

# DAST (dynamic) scan
aqe security --dast --target src/api/

# Compliance check (gdpr, hipaa, soc2)
aqe security --compliance gdpr,soc2 --target .

# URL safety / PII validation
aqe security --url-validate https://example.com

# Code complexity analysis
aqe code complexity src/

# Map dependencies
aqe code deps src/

# Semantic code search across the indexed codebase
aqe code index src/                         # build the index first
aqe code search "authentication middleware" # then query

# Coverage analysis
aqe coverage --threshold 80 --gaps src/

# Quality gate evaluation
aqe quality --gate

# Generate tests for a file
aqe test generate src/utils/parser.ts --framework vitest

# Execute tests
aqe test execute tests/

# -----------------------------------------------------------------------------
# CLAUDE CODE FOR TASKS AQE DOESN'T DIRECTLY EXPOSE
# -----------------------------------------------------------------------------
#
# These tasks (test-quality verification, spec contradictions, AI hallucination
# detection) live in workshop-samples/integration-demos/04-claude-code-commands.md
# as slash commands. From the shell you can also call them inline:

# Verify test quality (does the test actually verify the behavior?)
claude -p "Review ../buggy-samples/02-tests-wrong-behavior.ts for weak assertions, missing edge cases, and coincidental correctness. Quote each problematic test, explain why, suggest a better test."

# Spec contradiction check
claude -p "Read ../buggy-samples/03-spec-contradictions.md. List every contradiction, ambiguity, and numeric inconsistency. Quote each conflicting pair."

# Hallucinated API detection (AI-generated code review)
claude -p "Review ../buggy-samples/04-hallucinated-api.ts. This was AI-generated. Verify every API endpoint, parameter name, and response field against the real OpenWeatherMap docs. Flag anything that looks invented."

# -----------------------------------------------------------------------------
# OUTPUT FORMATS AND PIPELINES
# -----------------------------------------------------------------------------

# JSON output, pipe to jq for filtering
aqe security --sast --target src/ -F json | jq '.issues[] | select(.severity == "high")'

# SARIF output (compatible with GitHub code scanning)
aqe security --sast --target src/ -F sarif -o security.sarif

# Markdown report for sharing
aqe quality --gate -F markdown -o quality-report.md

# Coverage gaps in JSON
aqe coverage --gaps -F json src/

# -----------------------------------------------------------------------------
# COMPOSED PIPELINES
# -----------------------------------------------------------------------------

# Scan only files changed in last commit
git diff --name-only HEAD~1 -- '*.ts' '*.js' | while read f; do
    [ -f "$f" ] && aqe security --sast --target "$f"
done

# Pre-commit-style quality gate
aqe quality --gate || { echo "Quality gate failed"; exit 1; }

# Generate tests for every uncovered file (combine coverage gaps + test generate)
aqe coverage --gaps -F json src/ \
  | jq -r '.gaps[].file' \
  | xargs -I{} aqe test generate {} --framework vitest

# -----------------------------------------------------------------------------
# WORKSHOP EXERCISE COMMANDS
# -----------------------------------------------------------------------------

# Exercise 1: Scan the buggy samples
# (Run from the workshop root directory)

# 1. Security agent finds the auth bypass in 01-api-auth-bypass.ts
aqe security --sast --target ../buggy-samples/01-api-auth-bypass.ts

# 2. Test verification — Claude Code (no direct AQE subcommand)
claude -p "Open ../buggy-samples/02-tests-wrong-behavior.ts. Identify every test that passes but doesn't verify the right thing. For each, quote the test, explain the issue, propose a stronger assertion."

# 3. Spec contradiction check — Claude Code
claude -p "Read ../buggy-samples/03-spec-contradictions.md. List every contradiction, ambiguity, and numeric inconsistency in the requirements."

# 4. Hallucinated API detection — Claude Code
claude -p "Review ../buggy-samples/04-hallucinated-api.ts. The code is AI-generated. Verify every URL, parameter name, and response field against real APIs. Flag invented APIs."

# Exercise 2: Compare human vs agent findings
# 1. Manually review a buggy sample, write down what you found
# 2. Run the corresponding agent command above
# 3. Compare — what did the agent catch that you missed? And vice versa?

# Exercise 3: Custom security focus
aqe security --sast --target ../buggy-samples/ -F markdown -o my-findings.md
cat my-findings.md

# =============================================================================
# WORKSHOP ALIASES (also auto-loaded by install-tools.sh)
# =============================================================================
#
# alias aqe-sec="aqe security --sast --target"
# alias aqe-url="aqe security --url-validate"
# alias aqe-complex="aqe code complexity"
# alias aqe-deps="aqe code deps"
# alias aqe-cov="aqe coverage"
# alias aqe-gate="aqe quality --gate"
# alias aqe-gen="aqe test generate"
# alias aqe-run="aqe test execute"
#
# Usage:
#   aqe-sec src/                  # SAST on src/
#   aqe-url https://example.com   # URL safety check
#   aqe-gate                      # quality gate verdict
#
# =============================================================================
# PACT ALIGNMENT
# =============================================================================
#
# - Proactive: Run before commit, before PR, before deployment
# - Autonomous: Each `aqe` subcommand runs independently
# - Collaborative: Output formats (markdown, SARIF, JSON) feed humans + tools
# - Targeted: --target / --threshold / --compliance scope each invocation
#
# =============================================================================
# TIP — Makefile pattern:
#
# .PHONY: quality
# quality:
# 	aqe security --sast --target src/
# 	aqe coverage --threshold 80 src/
# 	aqe quality --gate
#
# =============================================================================
