HYTTIOAOA? — Have You Tried Turning It Off and On Again?

A tiny VS Code extension that puts a one-click reload button in the Activity Bar.
Click the meme, VS Code reloads. After reload it briefly shows a “working” image for ~20s, then flips back to the meme.

Because sometimes the most powerful fix is… rebooting the window. 😉

Features

Activity Bar view named HYTTIOAOA? with a meme in a compact sidebar webview

One click = Developer: Reload Window (workbench.action.reloadWindow)

Post-reload status: shows working.jpg for a configurable duration, then returns to the meme

Optional command to reload without opening the view

How it works

Clicking the image posts a message to the extension.

The extension sets a short-lived timestamp in globalState and calls workbench.action.reloadWindow.

After VS Code restarts, the extension reads the timestamp:

If it’s still “fresh”, the webview shows working.jpg and automatically switches back after the remaining time.

While working.jpg is visible, clicks are disabled to avoid accidental re-reloads.

Requirements

None. Standard VS Code API only.

Extension Settings
Setting	Type	Default	Description
hyttioaoa.workingDurationMs (optional if you add it)	number	20000	How long working.jpg should be shown after a reload, in milliseconds.
Commands
Command	Title	What it does
hyttioaoa.reload	HYTTIOAOA?: Reload VS Code (Have you tried…)	Triggers the same behavior as clicking the image: sets the “working” timer and reloads the window.
Installation

From VSIX

Download hyttioaoa-1.0.0.vsix

VS Code → Extensions (left sidebar) → … → Install from VSIX…

From Marketplace
Search for HYTTIOAOA? and click Install.

Usage

Click the HYTTIOAOA? icon in the Activity Bar.

Click the image → VS Code reloads.

After reload, a working screen appears for ~20s, then switches back to the meme.

Troubleshooting

The icon looks tiny: ensure your Activity Bar icon is an SVG with viewBox="0 0 24 24" and no extra padding; use fill="currentColor" or stroke="currentColor".

Clicking during the working screen: clicks are disabled intentionally until the timer ends, to prevent double reloads.

No image showing: verify files exist at media/have-you-tried.jpg and media/working.jpg, and that media is in webview.options.localResourceRoots.

Known Issues

If VS Code closes unexpectedly during the working phase, the “show until” timestamp may expire while it’s closed — harmless; the next start will just show the meme view.

Security / Privacy

No telemetry.

No external network requests.

Uses VS Code’s globalState only for a short-lived timestamp.

Credits

Meme image inspired by The IT Crowd.

License

MIT

Release Notes
1.0.0

First stable release

Activity Bar webview with meme

Post-reload “working” screen + timed swap back

Command hyttioaoa.reload
