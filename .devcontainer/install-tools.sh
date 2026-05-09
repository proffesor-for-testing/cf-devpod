#!/bin/bash

# =============================================================================
# Craft Conference 2026 Workshop — Tool Installer
#
# Installs the toolchain attendees need:
#   - tmux           (terminal multiplexing)
#   - GitHub CLI     (gh)
#   - Claude Code    (@anthropic-ai/claude-code)
#   - Agentic QE     (agentic-qe — the real package, NOT agentic-qe-fleet)
#   - ccusage        (token spend visibility)
#
# Strategy:
#   - apt installs use `sudo apt-get update` first, then `sudo apt-get install -y`
#   - npm globals install to a USER-OWNED prefix ($HOME/.npm-global) so we
#     never run npm as root (avoids postinstall failures where a package's
#     postinstall script writes to $HOME and ends up in /root/.something
#     where the vscode user can't read it later).
#   - Every install writes its full output to .devcontainer/install-logs/<tool>.log
#     and on failure the last 20 lines are pasted into installation-report.md
#     so failures are debuggable instead of silent.
# =============================================================================

set -u   # error on unset vars; do NOT use -e — we want to continue past per-tool failures

# -----------------------------------------------------------------------------
# Setup paths
# -----------------------------------------------------------------------------
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPORT_FILE="$SCRIPT_DIR/installation-report.md"
LOG_DIR="$SCRIPT_DIR/install-logs"
mkdir -p "$LOG_DIR"

# Initialize report
{
    echo "# 📦 Craft 2026 Workshop — Installation Report"
    echo ""
    echo "**Generated on:** $(date)"
    echo ""
    echo "**Logs:** [\`install-logs/\`](install-logs/) (per-tool stderr+stdout for debugging)"
    echo ""
    echo "## 📊 Installation Summary"
    echo ""
} > "$REPORT_FILE"

declare -A INSTALL_STATUS
declare -A INSTALL_NOTES

command_exists() { command -v "$1" >/dev/null 2>&1; }

record_status() {
    INSTALL_STATUS["$1"]="$2"
    INSTALL_NOTES["$1"]="$3"
}

# Print and append the last 20 lines of a log file as a collapsible section
append_log_tail() {
    local label="$1"
    local log="$2"
    [ -f "$log" ] || return 0
    {
        echo ""
        echo "<details><summary>📄 ${label} install log (last 20 lines)</summary>"
        echo ""
        echo '```'
        tail -20 "$log"
        echo '```'
        echo "</details>"
        echo ""
    } >> "$REPORT_FILE"
}

# -----------------------------------------------------------------------------
# Git safe directories
# -----------------------------------------------------------------------------
echo "🔧 Configuring Git safe directories..."
git config --global --add safe.directory '*' 2>/dev/null || true
echo "✅ Git safe directories configured"

# -----------------------------------------------------------------------------
# User-level npm prefix — install all npm globals to $HOME/.npm-global
# This is the single most important fix: never run `sudo npm install -g` because
# package postinstall scripts running as root write to /root/.config/<pkg>/...
# which the (non-root) vscode user can't read at runtime.
# -----------------------------------------------------------------------------
NPM_GLOBAL="$HOME/.npm-global"
echo ""
echo "📦 Configuring user-level npm global prefix at $NPM_GLOBAL"
mkdir -p "$NPM_GLOBAL"
if command_exists npm; then
    npm config set prefix "$NPM_GLOBAL" 2>/dev/null || true
    npm config set fund false 2>/dev/null || true
    npm config set audit false 2>/dev/null || true
fi
export PATH="$NPM_GLOBAL/bin:$PATH"

# Persist PATH for future shells
NPM_PATH_LINE='export PATH="$HOME/.npm-global/bin:$PATH"'
for rc in ~/.zshrc ~/.bashrc ~/.profile; do
    [ -f "$rc" ] || continue
    if ! grep -qF '.npm-global/bin' "$rc" 2>/dev/null; then
        {
            echo ""
            echo "# Workshop: user-level npm globals on PATH"
            echo "$NPM_PATH_LINE"
        } >> "$rc"
    fi
done
echo "✅ npm prefix configured (no sudo needed for global installs)"

# -----------------------------------------------------------------------------
# Platform detection
# -----------------------------------------------------------------------------
detect_platform() {
    if [[ "${OSTYPE:-}" == "msys" ]] || [[ "${OSTYPE:-}" == "cygwin" ]] || grep -qi microsoft /proc/version 2>/dev/null; then
        echo "windows"
    elif [[ "${OSTYPE:-}" == "darwin"* ]]; then
        echo "macos"
    else
        echo "linux"
    fi
}
PLATFORM=$(detect_platform)

# -----------------------------------------------------------------------------
# apt helper — always sudo, always update first, capture full log
# -----------------------------------------------------------------------------
APT_UPDATED=0
apt_install() {
    local pkg="$1"
    local log="$LOG_DIR/apt-${pkg}.log"
    : > "$log"

    if ! command_exists apt-get; then
        echo "  apt-get not found"
        return 2
    fi

    # Update once per script run
    if [ "$APT_UPDATED" -eq 0 ]; then
        echo "  Running apt-get update (one time)..."
        if command_exists sudo; then
            sudo apt-get update -qq >>"$log" 2>&1 || true
        else
            apt-get update -qq >>"$log" 2>&1 || true
        fi
        APT_UPDATED=1
    fi

    echo "  Installing $pkg via apt..."
    if command_exists sudo; then
        sudo DEBIAN_FRONTEND=noninteractive apt-get install -y "$pkg" >>"$log" 2>&1
    else
        DEBIAN_FRONTEND=noninteractive apt-get install -y "$pkg" >>"$log" 2>&1
    fi
}

# -----------------------------------------------------------------------------
# npm helper — install to user prefix, capture log, never sudo
# -----------------------------------------------------------------------------
npm_global_install() {
    local pkg="$1"
    local log="$LOG_DIR/npm-${pkg//[^a-zA-Z0-9]/_}.log"
    : > "$log"

    if ! command_exists npm; then
        echo "  npm not found" >>"$log"
        return 2
    fi

    echo "  npm install -g $pkg (to $NPM_GLOBAL)..."
    npm install -g --no-fund --no-audit "$pkg" >>"$log" 2>&1
}

# -----------------------------------------------------------------------------
# 1. tmux
# -----------------------------------------------------------------------------
echo ""
echo "── 🖥️  tmux ──────────────────────────────────────────────────"
if [ "$PLATFORM" == "windows" ]; then
    record_status "tmux" "⚠️ Skipped" "Not recommended on Windows — use Windows Terminal tabs"
elif command_exists tmux; then
    record_status "tmux" "✅ Already Installed" "Version: $(tmux -V 2>/dev/null || echo unknown)"
else
    if apt_install tmux; then
        record_status "tmux" "✅ Success" "Installed via apt-get (with sudo)"
    elif command_exists brew && brew install tmux >>"$LOG_DIR/apt-tmux.log" 2>&1; then
        record_status "tmux" "✅ Success" "Installed via brew"
    else
        record_status "tmux" "❌ Failed" "See log tail below"
    fi
fi

# -----------------------------------------------------------------------------
# 2. GitHub CLI
# -----------------------------------------------------------------------------
echo ""
echo "── 🐙 GitHub CLI ─────────────────────────────────────────────"
if command_exists gh; then
    record_status "gh" "✅ Already Installed" "Version: $(gh --version 2>/dev/null | head -n1 || echo unknown)"
else
    GH_LOG="$LOG_DIR/gh.log"
    : > "$GH_LOG"

    if command_exists apt-get; then
        if command_exists sudo; then
            {
                sudo apt-get install -y wget gnupg
                wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg \
                    | sudo tee /usr/share/keyrings/githubcli-archive-keyring.gpg >/dev/null
                sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
                echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
                    | sudo tee /etc/apt/sources.list.d/github-cli.list >/dev/null
                sudo apt-get update -qq
                sudo DEBIAN_FRONTEND=noninteractive apt-get install -y gh
            } >>"$GH_LOG" 2>&1
        fi
        if command_exists gh; then
            record_status "gh" "✅ Success" "Installed via apt-get"
        else
            record_status "gh" "❌ Failed" "See log tail below"
        fi
    elif command_exists brew && brew install gh >>"$GH_LOG" 2>&1; then
        record_status "gh" "✅ Success" "Installed via brew"
    else
        record_status "gh" "❌ Failed" "No supported package manager"
    fi
fi

# -----------------------------------------------------------------------------
# 3. Claude Code
# -----------------------------------------------------------------------------
echo ""
echo "── 🤖 Claude Code ────────────────────────────────────────────"
if command_exists claude; then
    record_status "claude-code" "✅ Already Installed" "Version: $(claude --version 2>/dev/null || echo unknown)"
elif npm_global_install "@anthropic-ai/claude-code"; then
    if command_exists claude; then
        record_status "claude-code" "✅ Success" "Installed via npm (user prefix)"
    else
        record_status "claude-code" "⚠️ Partial" "Installed but \`claude\` not on PATH — restart shell"
    fi
else
    record_status "claude-code" "❌ Failed" "See log tail below"
fi

# -----------------------------------------------------------------------------
# 4. Agentic QE  (THE workshop tool — give it the most diagnostic care)
# -----------------------------------------------------------------------------
echo ""
echo "── 🎯 Agentic QE ─────────────────────────────────────────────"
if command_exists aqe; then
    record_status "agentic-qe" "✅ Already Installed" "Version: $(aqe --version 2>/dev/null || echo unknown)"
elif npm_global_install "agentic-qe"; then
    # Verify the binary actually works after install
    if command_exists aqe && aqe --version >/dev/null 2>&1; then
        record_status "agentic-qe" "✅ Success" "Version: $(aqe --version 2>/dev/null)"
    else
        # Sometimes the binary is in $NPM_GLOBAL/bin but PATH isn't refreshed yet
        if [ -x "$NPM_GLOBAL/bin/aqe" ]; then
            record_status "agentic-qe" "⚠️ Partial" "Installed at $NPM_GLOBAL/bin/aqe but not on PATH this shell — restart shell or run: source ~/.bashrc"
        else
            record_status "agentic-qe" "❌ Failed" "npm reported success but aqe binary not found"
        fi
    fi
else
    record_status "agentic-qe" "❌ Failed" "See log tail below"
fi

# -----------------------------------------------------------------------------
# 5. ccusage
# -----------------------------------------------------------------------------
echo ""
echo "── 📈 ccusage ────────────────────────────────────────────────"
if command_exists ccusage; then
    record_status "ccusage" "✅ Already Installed" "$(ccusage --version 2>/dev/null || echo installed)"
elif npm_global_install "ccusage"; then
    record_status "ccusage" "✅ Success" "Installed via npm"
else
    record_status "ccusage" "❌ Failed" "See log tail below"
fi

# -----------------------------------------------------------------------------
# 6. Project deps (only if package.json at workspace root)
# -----------------------------------------------------------------------------
echo ""
echo "── 📦 Project dependencies ──────────────────────────────────"
if [ -f "$(pwd)/package.json" ]; then
    PROJ_LOG="$LOG_DIR/project-deps.log"
    if npm install --no-fund --no-audit >"$PROJ_LOG" 2>&1; then
        record_status "project-deps" "✅ Success" "npm install completed"
    else
        record_status "project-deps" "⚠️ Skipped" "npm install failed — see log"
    fi
else
    record_status "project-deps" "ℹ️ N/A" "No package.json at workspace root"
fi

# -----------------------------------------------------------------------------
# Workshop shell aliases
# -----------------------------------------------------------------------------
echo ""
echo "⚡ Setting up workshop shell aliases..."

WORKSHOP_ALIASES='
# =============================================================================
# Craft 2026 Workshop Aliases
# All aliases use the REAL `aqe` CLI from the agentic-qe npm package.
# =============================================================================

# Quick security scan (SAST on a path)
alias aqe-sec="aqe security --sast --target"

# Security gate including PII URL validation
alias aqe-url="aqe security --url-validate"

# Code intelligence (complexity, deps, search)
alias aqe-complex="aqe code complexity"
alias aqe-deps="aqe code deps"

# Coverage analysis
alias aqe-cov="aqe coverage"

# Quality gate
alias aqe-gate="aqe quality --gate"

# Test commands
alias aqe-gen="aqe test generate"
alias aqe-run="aqe test execute"

# Workshop directory shortcuts (single-quoted so git rev-parse runs at use time,
# not at .zshrc-source time)
alias ws='\''cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"'\''
alias samples='\''cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)/workshop-samples"'\''
alias buggy='\''cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)/workshop-samples/buggy-samples"'\''

# Claude Code shortcut
alias cc="claude"
'

for rc in ~/.zshrc ~/.bashrc; do
    if [ -f "$rc" ] && ! grep -q "Craft 2026 Workshop Aliases" "$rc" 2>/dev/null; then
        echo "$WORKSHOP_ALIASES" >> "$rc"
        echo "  ✓ Aliases added to $rc"
    fi
done

# -----------------------------------------------------------------------------
# Git basic config (idempotent)
# -----------------------------------------------------------------------------
git config --global init.defaultBranch main 2>/dev/null || true
git config --global pull.rebase false 2>/dev/null || true
git config --global core.autocrlf input 2>/dev/null || true

# -----------------------------------------------------------------------------
# Write summary table
# -----------------------------------------------------------------------------
{
    echo "| Tool | Status | Notes |"
    echo "|------|--------|-------|"
    echo "| tmux            | ${INSTALL_STATUS[tmux]:-N/A}            | ${INSTALL_NOTES[tmux]:-} |"
    echo "| GitHub CLI      | ${INSTALL_STATUS[gh]:-N/A}              | ${INSTALL_NOTES[gh]:-} |"
    echo "| Claude Code     | ${INSTALL_STATUS[claude-code]:-N/A}     | ${INSTALL_NOTES[claude-code]:-} |"
    echo "| Agentic QE      | ${INSTALL_STATUS[agentic-qe]:-N/A}      | ${INSTALL_NOTES[agentic-qe]:-} |"
    echo "| ccusage         | ${INSTALL_STATUS[ccusage]:-N/A}         | ${INSTALL_NOTES[ccusage]:-} |"
    echo "| Project deps    | ${INSTALL_STATUS[project-deps]:-N/A}    | ${INSTALL_NOTES[project-deps]:-} |"
    echo ""
} >> "$REPORT_FILE"

# Append failure-specific log tails AND manual install instructions
FAILED_ITEMS=0
for tool in tmux gh claude-code agentic-qe ccusage; do
    if [[ "${INSTALL_STATUS[$tool]:-}" == *"Failed"* ]] || [[ "${INSTALL_STATUS[$tool]:-}" == *"Partial"* ]]; then
        ((FAILED_ITEMS++))
    fi
done

if [ "$FAILED_ITEMS" -gt 0 ]; then
    echo "## ⚠️ Failures — Diagnostics + Manual Recovery" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    if [[ "${INSTALL_STATUS[tmux]:-}" == *"Failed"* ]]; then
        echo "### tmux" >> "$REPORT_FILE"
        append_log_tail "tmux" "$LOG_DIR/apt-tmux.log"
        {
            echo "**Manual install:**"
            echo '```bash'
            echo "sudo apt-get update && sudo apt-get install -y tmux   # Debian/Ubuntu"
            echo "brew install tmux                                      # macOS"
            echo '```'
            echo ""
        } >> "$REPORT_FILE"
    fi

    if [[ "${INSTALL_STATUS[gh]:-}" == *"Failed"* ]]; then
        echo "### GitHub CLI" >> "$REPORT_FILE"
        append_log_tail "gh" "$LOG_DIR/gh.log"
        echo "**Manual:** see https://github.com/cli/cli#installation" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi

    if [[ "${INSTALL_STATUS[claude-code]:-}" == *"Failed"* ]] || [[ "${INSTALL_STATUS[claude-code]:-}" == *"Partial"* ]]; then
        echo "### Claude Code" >> "$REPORT_FILE"
        append_log_tail "claude-code" "$LOG_DIR/npm-_anthropic_ai_claude_code.log"
        {
            echo "**Manual install (user-level, no sudo):**"
            echo '```bash'
            echo "npm config set prefix \"\$HOME/.npm-global\""
            echo "export PATH=\"\$HOME/.npm-global/bin:\$PATH\""
            echo "npm install -g @anthropic-ai/claude-code"
            echo '```'
            echo ""
        } >> "$REPORT_FILE"
    fi

    if [[ "${INSTALL_STATUS[agentic-qe]:-}" == *"Failed"* ]] || [[ "${INSTALL_STATUS[agentic-qe]:-}" == *"Partial"* ]]; then
        echo "### Agentic QE" >> "$REPORT_FILE"
        append_log_tail "agentic-qe" "$LOG_DIR/npm-agentic_qe.log"
        {
            echo "**Manual install (user-level, no sudo):**"
            echo '```bash'
            echo "npm config set prefix \"\$HOME/.npm-global\""
            echo "export PATH=\"\$HOME/.npm-global/bin:\$PATH\""
            echo "npm install -g agentic-qe"
            echo "aqe --version"
            echo '```'
            echo ""
            echo "**Workaround if global install still fails — use npx:**"
            echo '```bash'
            echo "npx -y agentic-qe@latest --help"
            echo "npx -y agentic-qe@latest security --sast --target ."
            echo '```'
            echo ""
        } >> "$REPORT_FILE"
    fi

    if [[ "${INSTALL_STATUS[ccusage]:-}" == *"Failed"* ]]; then
        echo "### ccusage" >> "$REPORT_FILE"
        append_log_tail "ccusage" "$LOG_DIR/npm-ccusage.log"
        echo '```bash' >> "$REPORT_FILE"
        echo "npm install -g ccusage" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi
else
    {
        echo "## ✅ All Tools Successfully Installed!"
        echo ""
        echo "Next: authenticate Claude Code with \`claude /login\`."
    } >> "$REPORT_FILE"
fi

{
    echo ""
    echo "---"
    echo ""
    echo "*Report generated at: $(date)*"
} >> "$REPORT_FILE"

# -----------------------------------------------------------------------------
# Summary printed to terminal
# -----------------------------------------------------------------------------
echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║   Workshop environment setup complete                            ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "  Node.js:     $(node --version 2>/dev/null || echo 'not installed')"
echo "  npm:         $(npm --version 2>/dev/null || echo 'not installed')"
echo "  Claude Code: $(command_exists claude && claude --version 2>/dev/null || echo 'NOT installed')"
echo "  Agentic QE:  $(command_exists aqe && aqe --version 2>/dev/null || echo 'NOT installed')"
echo "  GitHub CLI:  $(command_exists gh && gh --version 2>/dev/null | head -n1 || echo 'NOT installed')"
echo "  tmux:        $(command_exists tmux && tmux -V 2>/dev/null || echo 'NOT installed')"
echo ""
echo "📋 Full report: cat .devcontainer/installation-report.md"
echo "📂 Logs:        ls .devcontainer/install-logs/"
echo ""
echo "🔑 Next step — authenticate Claude Code:"
echo "      claude /login"
echo ""
echo "   (Use a Claude.ai Pro/Max subscription, or paste an API key from"
echo "    https://console.anthropic.com/ when prompted.)"
echo ""

# IMPORTANT: exit success even if some tools failed — the postCreateCommand
# should not block the codespace from starting.
exit 0
