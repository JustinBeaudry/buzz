# Install the Actual Reality build of Buzz Desktop

This fork's Buzz Desktop shows the **remote (relay) agents** on the Agents page,
such as the Compliance and PM agents that run on Railway. It also drops the default bee
agents and starter team.

**Requirements:** an Apple Silicon Mac (M1 or newer). Your Buzz public key must
already be on the Actual Reality relay (ask Justin).

## Install (one command)

Open **Terminal** and paste:

```bash
curl -fsSL https://github.com/JustinBeaudry/buzz/releases/latest/download/install.sh | bash
```

The script:
1. downloads the latest release and checks its SHA-256;
2. quits Buzz if it is running;
3. replaces `/Applications/Buzz.app` (it may ask for your Mac password);
4. opens Buzz.

Your Buzz account, keys and settings are kept: this build uses the same app data
as the regular Buzz app.

## Why a Terminal command, not a download?

The build is not notarized by Apple yet. A `.zip` downloaded in a browser is
blocked by macOS ("Buzz is damaged" or "can't be opened"). The command above
installs it without that block.

## Manual install

1. Download `Buzz-AR-arm64.zip` from the
   [latest release](https://github.com/JustinBeaudry/buzz/releases/latest).
2. Unzip it and drag **Buzz.app** into **Applications**.
3. In Terminal, run:
   `xattr -dr com.apple.quarantine /Applications/Buzz.app`
4. Open Buzz.

## Going back to the regular Buzz

Reinstall Buzz from [block/buzz releases](https://github.com/block/buzz/releases/latest).
