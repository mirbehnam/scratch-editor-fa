# Offline high-quality player

The editor ships a pinned, locally built TurboWarp Packager runtime in `runtime/`.
It is copied into every GUI output as `quality-packager/`; no network download or
adjacent TurboWarp checkout is required when building or running Scratch.
`runtime-hashes.json` records the exact generated files. The full packager source,
licenses, exact npm toolchain and lockfile are included under `toolchain/`.
Packager upstream: c115bdf525c5f49f0fb689a21b335ccb70fc22d2.

To modify/rebuild this dependency independently:

```powershell
cd vendor/quality-packager/toolchain
npm ci
cd ..
node rebuild.mjs
```

Use Node 24. Generated runtime files and their hash manifest must be committed
along with source changes. Ordinary root `npm ci` and `npm run build:android`
use the pinned runtime without installing this separate toolchain. Do not replace
Scratch's editor VM with TurboWarp's VM: only the isolated generated HTML uses it.
The local adapter uses `autobuild=high`, autostarts the current SB3 snapshot and
keeps stop/pause/fullscreen controls disabled. Close removes the builder/player
iframe and revokes the HTML blob URL; Android destroys its separate player WebView
and deletes that playback's temporary HTML directory.

Automatic high-quality playback has no artificial five-second wait; the wait is
retained only for the manual packaging UI. For file-hosted Electron, messaging
uses the actual opaque message origin (`null`) and an exact source-window check,
not Electron's displayed `location.origin` (`file://`). Windows playback provides
its own vertical Refresh/Close controls and does not depend on Android's rail.

The File menu manual packager uses this same runtime without `autobuild=high`.
It imports the current snapshot automatically and exposes presets/Advanced plus
Save, Share and Run directly. Both adapters share the host export protocol and
player lifecycle; do not create a second VM inside the editor. The manual snapshot
is temporary IndexedDB state and is removed on close. Windows native exports
accept requests only from the trusted editor main frame via the preload.
