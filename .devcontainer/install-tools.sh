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
# Mirrors the structure of /Users/profa/qe-ruvector/.devcontainer/install-tools.sh:
# tries without sudo first, falls back with sudo, writes a Markdown report.
# =============================================================================

# Configure Git safe directories first
echo "🔧 Configuring Git safe directories..."
git config --global --add safe.directory '*' 2>/dev/null || true
git config --global --add safe.directory /workspaces 2>/dev/null || true
git config --global --add safe.directory /workspaces/* 2>/dev/null || true
git config --global --add safe.directory /workspace 2>/dev/null || true
echo "✅ Git safe directories configured"

# Initialize report file
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPORT_FILE="$SCRIPT_DIR/installation-report.md"
{
    echo "# 📦 Craft 2026 Workshop — Installation Report"
    echo ""
    echo "**Generated on:** $(date)"
    echo ""
    echo "## 📊 Installation Summary"
    echo ""
} > "$REPORT_FILE"

# Track installation results
declare -A INSTALL_STATUS
declare -A INSTALL_NOTES

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

record_status() {
    local tool="$1"
    local status="$2"
    local note="$3"
    INSTALL_STATUS["$tool"]="$status"
    INSTALL_NOTES["$tool"]="$note"
}

try_install() {
    local package="$1"
    local install_cmd="$2"

    echo "Attempting to install $package..."

    if $install_cmd 2>/dev/null; then
        echo "$package installed successfully without sudo"
        return 0
    fi

    if command_exists sudo; then
        echo "Retrying with sudo..."
        if sudo $install_cmd 2>/dev/null; then
            echo "$package installed successfully with sudo"
            return 0
        fi
    fi

    echo "Failed to install $package - continuing without it"
    return 1
}

# Platform detection
detect_platform() {
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || grep -qi microsoft /proc/version 2>/dev/null; then
        echo "windows"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    else
        echo "linux"
    fi
}

PLATFORM=$(detect_platform)

# -----------------------------------------------------------------------------
# tmux
# -----------------------------------------------------------------------------
if [ "$PLATFORM" == "windows" ]; then
    echo "Windows environment detected - skipping tmux installation"
    record_status "tmux" "⚠️ Skipped" "Not recommended on Windows - use Windows Terminal tabs instead"
elif ! command_exists tmux; then
    if command_exists apt-get; then
        if try_install "tmux" "apt-get install -y tmux"; then
            record_status "tmux" "✅ Success" "Installed via apt-get"
        else
            record_status "tmux" "❌ Failed" "Installation failed"
        fi
    elif command_exists yum; then
        if try_install "tmux" "yum install -y tmux"; then
            record_status "tmux" "✅ Success" "Installed via yum"
        else
            record_status "tmux" "❌ Failed" "Installation failed"
        fi
    elif command_exists brew; then
        if try_install "tmux" "brew install tmux"; then
            record_status "tmux" "✅ Success" "Installed via brew"
        else
            record_status "tmux" "❌ Failed" "Installation failed"
        fi
    else
        record_status "tmux" "❌ Failed" "No supported package manager found"
    fi
else
    record_status "tmux" "✅ Already Installed" "Version: $(tmux -V 2>/dev/null || echo 'unknown')"
fi

# -----------------------------------------------------------------------------
# GitHub CLI
# -----------------------------------------------------------------------------
if ! command_exists gh; then
    if command_exists apt-get; then
        echo "Installing GitHub CLI for Debian/Ubuntu..."
        INSTALL_GH_DEB="(type -p wget >/dev/null || apt-get install wget -y) && \
            wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | tee /usr/share/keyrings/githubcli-archive-keyring.gpg > /dev/null && \
            chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg && \
            echo 'deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main' | tee /etc/apt/sources.list.d/github-cli.list > /dev/null && \
            apt-get update && \
            apt-get install gh -y"

        if bash -c "$INSTALL_GH_DEB" 2>/dev/null; then
            record_status "gh" "✅ Success" "Installed via apt-get"
        elif command_exists sudo && sudo bash -c "$INSTALL_GH_DEB" 2>/dev/null; then
            record_status "gh" "✅ Success" "Installed via apt-get with sudo"
        else
            record_status "gh" "❌ Failed" "Installation failed"
        fi
    elif command_exists brew; then
        if try_install "gh" "brew install gh"; then
            record_status "gh" "✅ Success" "Installed via brew"
        else
            record_status "gh" "❌ Failed" "Installation failed"
        fi
    else
        record_status "gh" "❌ Failed" "No supported package manager found"
    fi
else
    record_status "gh" "✅ Already Installed" "Version: $(gh --version 2>/dev/null | head -n1 || echo 'unknown')"
fi

# -----------------------------------------------------------------------------
# Claude Code (@anthropic-ai/claude-code)
# -----------------------------------------------------------------------------
if ! command_exists claude; then
    if command_exists node && command_exists npm; then
        echo "Installing claude-code via npm..."

        if npm install -g @anthropic-ai/claude-code 2>/dev/null; then
            record_status "claude-code" "✅ Success" "Installed via npm"
        elif command_exists sudo && sudo npm install -g @anthropic-ai/claude-code 2>/dev/null; then
            record_status "claude-code" "✅ Success" "Installed via npm with sudo"
        else
            record_status "claude-code" "❌ Failed" "npm install failed"
        fi
    else
        record_status "claude-code" "❌ Failed" "Node.js and npm are required"
    fi
else
    record_status "claude-code" "✅ Already Installed" "Version: $(claude --version 2>/dev/null || echo 'unknown')"
fi

# -----------------------------------------------------------------------------
# Agentic QE (the workshop's main tool — package name is agentic-qe)
# -----------------------------------------------------------------------------
if ! command_exists aqe; then
    if command_exists npm; then
        echo "Installing agentic-qe via npm..."

        if npm install -g agentic-qe 2>/dev/null; then
            record_status "agentic-qe" "✅ Success" "Installed via npm"
        elif command_exists sudo && sudo npm install -g agentic-qe 2>/dev/null; then
            record_status "agentic-qe" "✅ Success" "Installed via npm with sudo"
        else
            record_status "agentic-qe" "❌ Failed" "npm install failed"
        fi
    else
        record_status "agentic-qe" "❌ Failed" "npm not available - install Node.js first"
    fi
else
    record_status "agentic-qe" "✅ Already Installed" "Version: $(aqe --version 2>/dev/null || echo 'unknown')"
fi

# -----------------------------------------------------------------------------
# ccusage (token spend visibility — useful during workshop demos)
# -----------------------------------------------------------------------------
if command_exists npm; then
    if npm list -g ccusage 2>/dev/null | grep -q "ccusage@"; then
        CCUSAGE_VERSION=$(npm list -g ccusage 2>/dev/null | grep "ccusage@" | grep -oE '@[0-9a-z.-]+' || echo 'unknown')
        record_status "ccusage" "✅ Already Installed" "Version: $CCUSAGE_VERSION"
    else
        echo "Installing ccusage via npm..."
        if npm install -g ccusage 2>/dev/null; then
            record_status "ccusage" "✅ Success" "Installed via npm"
        elif command_exists sudo && sudo npm install -g ccusage 2>/dev/null; then
            record_status "ccusage" "✅ Success" "Installed via npm with sudo"
        else
            record_status "ccusage" "❌ Failed" "npm install failed"
        fi
    fi
else
    record_status "ccusage" "❌ Failed" "npm not available"
fi

# -----------------------------------------------------------------------------
# Project dependencies (if package.json exists at workspace root)
# -----------------------------------------------------------------------------
if [ -f "$(pwd)/package.json" ]; then
    echo ""
    echo "📦 Installing project dependencies (npm install)..."
    if npm install 2>/dev/null; then
        record_status "project-deps" "✅ Success" "npm install completed"
    else
        record_status "project-deps" "⚠️ Skipped" "npm install failed — run manually if needed"
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

# Append to zshrc and bashrc (idempotent — guard with marker)
for rc in ~/.zshrc ~/.bashrc; do
    if [ -f "$rc" ] && ! grep -q "Craft 2026 Workshop Aliases" "$rc" 2>/dev/null; then
        echo "$WORKSHOP_ALIASES" >> "$rc"
        echo "  ✓ Aliases added to $rc"
    fi
done

# -----------------------------------------------------------------------------
# Git basic config (only if not already set)
# -----------------------------------------------------------------------------
git config --global init.defaultBranch main 2>/dev/null || true
git config --global pull.rebase false 2>/dev/null || true
git config --global core.autocrlf input 2>/dev/null || true

# -----------------------------------------------------------------------------
# Write report
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

# Failed-tool manual instructions
FAILED_ITEMS=0
for tool in tmux gh claude-code agentic-qe ccusage; do
    if [[ "${INSTALL_STATUS[$tool]}" == *"Failed"* ]]; then
        ((FAILED_ITEMS++))
    fi
done

if [ $FAILED_ITEMS -gt 0 ]; then
    {
        echo "## ⚠️ Manual Installation Instructions"
        echo ""
        echo "Some tools failed to install automatically. Run these manually:"
        echo ""
        if [[ "${INSTALL_STATUS[tmux]}" == *"Failed"* ]]; then
            echo "### tmux"
            echo '```bash'
            echo "sudo apt update && sudo apt install -y tmux   # Debian/Ubuntu"
            echo "brew install tmux                              # macOS"
            echo '```'
            echo ""
        fi
        if [[ "${INSTALL_STATUS[gh]}" == *"Failed"* ]]; then
            echo "### GitHub CLI"
            echo "See: https://github.com/cli/cli#installation"
            echo ""
        fi
        if [[ "${INSTALL_STATUS[claude-code]}" == *"Failed"* ]]; then
            echo "### Claude Code"
            echo '```bash'
            echo "npm install -g @anthropic-ai/claude-code"
            echo "# or, if permission errors:"
            echo "sudo npm install -g @anthropic-ai/claude-code"
            echo '```'
            echo ""
        fi
        if [[ "${INSTALL_STATUS[agentic-qe]}" == *"Failed"* ]]; then
            echo "### Agentic QE"
            echo '```bash'
            echo "npm install -g agentic-qe"
            echo "# or, if permission errors:"
            echo "sudo npm install -g agentic-qe"
            echo '```'
            echo ""
        fi
        if [[ "${INSTALL_STATUS[ccusage]}" == *"Failed"* ]]; then
            echo "### ccusage"
            echo '```bash'
            echo "npm install -g ccusage"
            echo '```'
            echo ""
        fi
    } >> "$REPORT_FILE"
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
echo "║   ✅ Workshop environment ready                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "  Node.js:     $(node --version 2>/dev/null || echo 'not installed')"
echo "  npm:         $(npm --version 2>/dev/null || echo 'not installed')"
echo "  Claude Code: $(command_exists claude && echo 'installed' || echo 'NOT installed')"
echo "  Agentic QE:  $(command_exists aqe && aqe --version 2>/dev/null || echo 'NOT installed')"
echo ""
echo "📋 Full report: cat .devcontainer/installation-report.md"
echo ""
echo "🔑 Next step — authenticate Claude Code:"
echo "      claude /login"
echo ""
echo "   (Use a Claude.ai Pro/Max subscription, or paste an API key from"
echo "    https://console.anthropic.com/ when prompted.)"
echo ""
