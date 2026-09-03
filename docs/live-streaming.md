# Live streaming (Mux)

How the Live page gets its stream, how the site knows the stream is on, and
how to test the whole thing before the client's streamer is involved.

## Shape

- **Ingest.** Mux only sees video pushed to it. We create one Mux **live
  stream** (a permanent stream key + RTMP ingest URL + playback ID). The
  streamer puts that key in OBS in place of the YouTube/Twitch one.
- **Simulcast.** Mux restreams to YouTube and Twitch at the same time via
  _simulcast targets_ on the live stream, so the platform audiences keep
  their feed. What we don't get is platform chat on our page.
- **Playback.** `/live` plays the stream by playback ID with Mux's player
  (`@mux/mux-player`, `stream-type="live"`) — `LivePlayer`, filling the stage
  edge to edge.
- **YouTube instead.** Site Settings' **Live Source** switches the page to a
  YouTube embed (`LiveYouTube`) fed by a pasted broadcast URL — for streams
  that run on YouTube rather than through Mux. It sits centered at the home
  video module's size rather than full-bleed, and autoplays muted (no
  click-to-play poster, so YouTube is contacted on load). YouTube gives each
  broadcast its own URL, so it's re-pasted per session; there's no webhook
  either, so **Live Now** is the on/off switch. Mux deliveries are ignored
  while the source is YouTube, so a late `idle` from the old Mux stream can't
  cut a YouTube broadcast off.
- **Live state.** Mux webhooks (`video.live_stream.active` / `.idle`) hit
  `POST /api/mux/webhook`, which verifies the signature and sets `isLive` on
  Site Settings when its `muxLiveStreamId` matches. The stream is global —
  one streamer, live for every market at once — so these fields live on the
  Site Settings singleton; the per-market live pages carry only their
  editorial overlay. Everything already keyed
  off `isLive` (feed stream cards linking to `/live`, the live chip) works
  unchanged, and editors keep the toggle as a manual override. The live page
  re-fetches every 30s while open.
- **Recordings.** With `new_asset_settings` on the live stream, every
  session becomes a Mux asset automatically — the raw material for a stream
  post's recap video (today an MP4 upload / YouTube; the official
  `sanity-plugin-mux-input` would let editors pick Mux assets directly).

## Config

Studio, on Site Settings → Live Stream:

| Field                 | Value                                                     |
| --------------------- | --------------------------------------------------------- |
| Live Source           | Mux or YouTube — which of the fields below the page uses  |
| Mux Playback ID       | the live stream's playback ID (`playback_ids[0].id`)      |
| Mux Live Stream ID    | the live stream's `id`                                    |
| YouTube URL           | the broadcast's link, when the source is YouTube          |
| Live Now              | machine-set by the webhook on Mux; hand-set on YouTube    |

Site (`web/.env`, server-only — see `.env.example`):

| Variable                   | From                                                       |
| -------------------------- | ---------------------------------------------------------- |
| `NUXT_MUX_WEBHOOK_SECRET`  | Mux → Settings → Webhooks → the endpoint's Signing Secret  |
| `NUXT_SANITY_WRITE_TOKEN`  | manage.sanity.io → API → Tokens, Editor role               |

## Testing without the client

Everything on our side is the same whichever way the client goes; only whose
OBS holds the stream key changes. So the full pipeline can be exercised with a
personal Mux account and a stream from a laptop.

1. **Mux account.** New accounts carry trial credit; each _environment_ has
   its own API tokens. Settings → API Access Tokens → new token with Mux
   Video read + write. Note the token ID and secret.
2. **Create the live stream** (once — the key is reusable across sessions):

   ```bash
   curl https://api.mux.com/video/v1/live-streams \
     -u "$MUX_TOKEN_ID:$MUX_TOKEN_SECRET" \
     -H 'Content-Type: application/json' \
     -d '{"playback_policy":["public"],"new_asset_settings":{"playback_policy":["public"]},"reconnect_window":60}'
   ```

   From the response: `data.id` → Site Settings **Mux Live Stream ID**,
   `data.playback_ids[0].id` → **Mux Playback ID**, `data.stream_key` → OBS.
   (`latency_mode: "low"` brings glass-to-glass down to ~5s from the default
   ~15–30s, for a small quality/stability trade.)
3. **Webhook.** Mux must reach the dev server, so tunnel it:

   ```bash
   npx cloudflared tunnel --url http://localhost:3000
   ```

   Mux → Settings → Webhooks → new endpoint at
   `https://<tunnel>/api/mux/webhook`. Copy its Signing Secret into
   `NUXT_MUX_WEBHOOK_SECRET`, add a Sanity write token, restart `nuxt dev`.
   The dashboard lists every delivery with its response and can resend one,
   which is the quickest way to iterate on the handler.
4. **Go live.** OBS: Stream → Custom, server `rtmps://global-live.mux.com:443/app`,
   the stream key. Or loop a file with ffmpeg (Mux needs a real encode with
   regular keyframes):

   ```bash
   ffmpeg -re -stream_loop -1 -i test.mp4 \
     -c:v libx264 -preset veryfast -b:v 3000k -maxrate 3000k -bufsize 6000k \
     -pix_fmt yuv420p -g 60 -keyint_min 60 -c:a aac -b:a 128k -ar 44100 \
     -f flv "rtmps://global-live.mux.com:443/app/$STREAM_KEY"
   ```

   Within seconds Mux fires `connected` then `active`; the webhook flips Live
   Now; `/live` shows the player and feed stream cards link to it.
5. **Stop.** Ctrl-C the encoder. After `reconnect_window` Mux fires `idle`,
   the page goes back to its offline state, and a recorded asset appears in
   Mux a minute or two later.
6. **Simulcast (optional).** Attach your own YouTube/Twitch stream key as a
   simulcast target (`POST /video/v1/live-streams/{id}/simulcast-targets`)
   and confirm the platform picks it up. That is exactly the client's setup.

Mux bills live encoding by the minute even in testing — keep sessions short.

## Still to decide with the client

- Which platform the streamer uses today, and whether they'll stream to Mux
  (with Mux simulcasting on). If not, the live layer becomes a YouTube/Twitch
  embed plus their API for live detection (Twitch: trivial with an app token;
  YouTube: needs the channel's OAuth or a manual toggle), and Mux stays for
  recordings and editorial video.
- Whether platform chat matters on our page.
- Whether recordings should publish automatically as feed posts.
- The "{count} viewing" figure: Mux Data's real-time concurrent-viewers API,
  a separate add-on.

## Not built yet

The live page's right-hand status tab ("live in …", viewer count), and Mux
for non-live video (the video module's MP4 upload).
