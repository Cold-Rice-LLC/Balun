# Demoing the live stream with OBS

A checklist for showing the Live page working end to end from a laptop,
before the client's streamer is involved. The pipeline itself is described
in [live-streaming.md](live-streaming.md); this is just the encoder side,
with OBS in place of the ffmpeg loop used for the first tests.

## One-time setup

1. **Install OBS.** `brew install --cask obs`, or download from obsproject.com.
2. **Point it at Mux.** Settings → Stream: Service "Custom", Server
   `rtmps://global-live.mux.com:443/app`, Stream Key from the Mux dashboard
   (Video → Live Streams → the stream). Don't paste the key anywhere else.
3. **Encoder settings.** Settings → Output: video bitrate 3000–4500 kbps,
   **keyframe interval 2s** (OBS defaults to 0/auto, which Mux sometimes
   stalls on), x264 or the Apple hardware encoder. Settings → Video:
   1920×1080, 30 fps.
4. **Build a scene** (below).
5. **Studio.** Site Settings → Live Stream: **Live Source** = Mux, and check
   the Playback ID and Live Stream ID are still filled in.
6. **macOS permissions.** The first camera or screen-capture source prompts
   for Camera / Screen Recording access. If a source stays black, System
   Settings → Privacy & Security, enable OBS, quit and relaunch it.

## Building a scene

A scene is a named layout; sources are the layers inside it, drawn bottom to
top like Photoshop layers. Both panels sit along the bottom of the OBS
window (View → Docks if one is hidden).

1. **Scenes** panel → **+** → name it ("Demo").
2. **Sources** panel → **+** → pick a source type:
   - **Video Capture Device** — the webcam. Choose the camera in the
     Device dropdown of the Properties window.
   - **Media Source** — loops a video file. Tick **Loop**, browse to any
     MP4. The closest equivalent to the ffmpeg test loop.
   - **macOS Screen Capture** — a window or display. Don't capture the
     browser showing `/live` itself; that's a feedback loop.
   - **Text** / **Image** — a lower-third label, a logo.
3. Resize by dragging corners in the preview, or right-click → Transform →
   Fit to Screen.
4. Reorder by dragging in the Sources list; top of the list is on top.
   A typical layout is screen capture filling the canvas, webcam shrunk into
   a corner.
5. Check the **audio mixer** meters are bouncing. If the mic is silent:
   Settings → Audio → Mic/Auxiliary Audio. Mux prefers an audio track, even
   a quiet one.

A second scene ("Starting Soon" with a title-card image) is a nice touch:
start on it, then click the Demo scene once the page has picked up the
stream. OBS fades between them by default.

**Streaming with no sources works but sends a black picture** — add the
source before Start Streaming, so Mux isn't billed for black frames.

## Running the demo

Where the client sees it: share your screen with the dev server on port 3000,
or tunnel it (`npx cloudflared tunnel --url http://localhost:3000`) so they
can open `/live` on their own phone. The tunnel isn't needed for a
screen-share.

**The dev server must be on port 3000, 3001 or 3333** — the only origins
Sanity's CORS allowlist accepts. On any other port the page renders live on
load (server-side fetch), then flips to "not live right now" at the first
30-second client-side re-check because that fetch is refused. See the
Sanity CORS note in the project memory.

1. Start the dev server, open `/live`. It shows the offline state.
2. **Start Streaming** in OBS.
3. Flip **Live Now** on in the Studio by hand. There's no webhook yet (it's
   added at deploy time, when the production URL is stable), so say this
   out loud to the client — it's the one step that will be automatic in
   production.
4. Within ~20s the page cross-fades from the connecting note to the live
   picture, and feed stream cards start linking to `/live`. Expect 15–30s of
   glass-to-glass delay at default latency: wave at the camera and let them
   watch it arrive.
5. To stop: **Stop Streaming** in OBS, flip Live Now off. A recording
   appears as a Mux asset a minute or two later — worth showing as the
   recap-video source.

Mux bills live minutes: do a five-minute dry run the day before and keep the
demo short. To demo the simulcast story, attach your own YouTube/Twitch key
as a simulcast target first (API call in live-streaming.md) — that is exactly
the client's eventual setup.

## If the page shows "connecting" for more than a minute

- OBS's bottom bar: dropped frames, or a red/yellow connection indicator.
- Keyframe interval left on auto (see setup step 3).
- Live Now not actually on, or Live Source still set to YouTube.
