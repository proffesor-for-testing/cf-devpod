# 🔋 Batteries-Included Development DevPod modified

# Original Batteries-Included Development DevPod https://github.com/jedarden/agentists-quickstart/tree/workspace/batteries-included 

This repo contains a **fully-loaded** development environment with Docker-in-Docker, Node.js, Claude Flow, AI Swarm orchestration, and automatic Claude Code launch capabilities.

## 🚀 Quick Start with DevPod

```bash
# Launch the batteries-included environment
devpod up https://github.com/proffesor-for-testing/cf-devpod.git

```

## ⚡ One-Command Launch

After the DevPod starts, simply run:

```bash
chmod +x start.sh
./start.sh
```

This will:
- ✅ Check and install all prerequisites
- 🌊 Initialize claude-flow (with optional --force flag)
- 🖥️ Create a tmux session with phonetic naming (alpha, bravo, charlie...)
- 🚀 Launch Claude Code with proper MCP configuration
- 📊 Provide session management commands

## 📦 What's Included

- **🖼️ Base Image**: Debian-based development container
- **🐳 Docker-in-Docker**: Build and run containers within your development environment
- **🟢 Node.js**: Full Node.js development environment
- **🐍 Python**: Python development environment
- **🛠️ Development Tools** (auto-installed on container creation):
  - tmux: Terminal multiplexer for managing multiple sessions
  - claude-code: Anthropic's official CLI for Claude
  - GitHub CLI (gh): Command-line interface for GitHub
  - UV: Fast Python package manager written in Rust
  - claude-monitor: Monitor and track Claude API usage
  - **🌊 claude-flow@alpha**: AI swarm orchestration and SPARC methodology
  - **🐝 ruv-swarm**: Distributed AI agent coordination
  - **📈 ccusage**: Claude Code usage tracking and analytics
- **🧬 VS Code Extensions**:
  - Roo Cline: AI-powered coding assistant
  - GistFS: Access GitHub Gists directly in VS Code
  - GitHub Copilot: AI pair programming
  - GitHub Copilot Chat: Conversational AI assistance
  - Claude Code: Anthropic's official VS Code extension for Claude
  - Claude Code Extension: Enhanced Claude Code cost tracking and features

## ✨ Features

- Runs with privileged access to support Docker operations
- Configured for the `vscode` user
- Persistent container (won't shutdown on disconnect)
- Automatic tool installation with graceful fallback and detailed installation report
- Installation report saved to `.devcontainer/installation-report.md` for troubleshooting
- If automatic installation fails during container startup, run manually: `bash .devcontainer/install-tools.sh`

## 📋 Requirements

- [DevPod CLI](https://devpod.sh/docs/getting-started/install)
- Docker Desktop or Docker Engine
- Active GitHub Copilot subscription (for Copilot features)

## 🎯 Using the Start Script

The `start.sh` script provides an interactive, batteries-included launch experience:

### Features:
- **Prerequisite Checking**: Automatically verifies all required tools are installed
- **Interactive Initialization**: Choose between force initialization, normal initialization, or skip
- **Smart Session Management**: Uses phonetic alphabet naming (alpha, bravo, charlie...) to avoid conflicts
- **MCP Configuration Detection**: Automatically detects and uses `.mcp.json` if present
- **Graceful Error Handling**: Provides helpful troubleshooting tips if something goes wrong
- **Tmux Integration**: Launches Claude Code in a detached tmux session for persistence

### Usage:
```bash
# Run the start script
./start.sh

# Choose initialization option when prompted:
# [y] - Force reinitialize (overwrites existing config)
# [n] - Normal initialization (preserves existing config)  
# [s] - Skip initialization

# Choose whether to attach to the tmux session immediately or later
```

### Tmux Commands:
Once launched, use these commands to manage your session:
- **Attach to session**: `tmux attach -t [session-name]`
- **Detach from session**: `Ctrl+b`, then `d`
- **List all sessions**: `tmux ls`
- **Kill a session**: `tmux kill-session -t [session-name]`

## 🛠️ Tool Installation

The development tools are automatically installed when the container starts via `.devcontainer/install-tools.sh`. The enhanced script now includes claude-flow, ruv-swarm, and ccusage with intelligent detection to skip already-installed components.

### Manual Installation

If any tools fail to install automatically, you can run the installation script manually:

```bash
bash .devcontainer/install-tools.sh
```

This will:
- Attempt to install all missing tools
- Generate a detailed report at `.devcontainer/installation-report.md`
- Provide manual installation instructions for any tools that fail

### Viewing Installation Status

To check which tools were successfully installed:

```bash
cat .devcontainer/installation-report.md
```

## 🔧 Manual VS Code Usage

If you prefer to use VS Code directly:

1. Clone this branch: `git clone -b workspace/basic https://github.com/jedarden/agentists-quickstart`
2. Open in VS Code
3. Install the Dev Containers extension
4. Click "Reopen in Container" when prompted

## 📚 Learn More

For more information about the Agentists project, visit the [main branch](https://github.com/jedarden/agentists-quickstart).