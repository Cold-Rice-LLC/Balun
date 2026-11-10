# Video

**Rule:** no video files in Sanity. Anything uploaded — autoplaying loops,
short click-to-play pieces — goes to **Mux**. Long-form video stays on
**Vimeo or YouTube** and is embedded by URL. (Live streaming is also Mux;
see [live-streaming.md](./live-streaming.md).)

## Where video appears

| Where | Studio field | Source | Front end |
| --- | --- | --- | --- |
| Hero modules (Big Image Headline / Logo, Headline Over Image) → Media Type: Video | `video` (`mux.video`, from `mediaFields` in `studio/schemaTypes/lib/fields.js`) | Mux | `HomeModuleMedia` — Mux's MP4 (`highest.mp4`) in a plain `<video>`, autoplay, muted, looped, no controls; falls back to `<mux-video>` (HLS) if the upload has no MP4 |
| Video module (home, info, feed post modules, feed Recap Video) | `videoType`: **Upload (Mux)** / **Vimeo** / **YouTube** | Mux, or an embed | `HomeVideo` — poster + "watch" pill, then `<mux-video controls>` or the Vimeo/YouTube iframe |

Uploads use `sanity-plugin-mux-input`: the Studio sends the file straight to
Mux and stores a `mux.videoAsset` document. GROQ dereferences it to the
**playback ID** (`video.asset->playbackId`). The Studio asks Mux for a plain
MP4 of every upload (`static_renditions: ['highest']` in `sanity.config.js`).
Silent loops play that MP4 (`stream.mux.com/{id}/highest.mp4`) in a native
`<video>`, which needs no player code. Click-to-play videos stream adaptive HLS
through `@mux/mux-video` (a drop-in `<video>` element), imported client-side
only on modules that use it; a loop falls back to it when its upload has no
MP4. Loops get Mux's first-frame thumbnail as their poster.

Uploads from before MP4s were switched on need one added in Mux:
`POST https://api.mux.com/video/v1/assets/{ASSET_ID}/static-renditions` with
`{"resolution": "highest"}` (Mux token auth). The asset ID is on the
`mux.videoAsset` document in Sanity.

Embeds don't load until the visitor clicks the poster. YouTube uses
`youtube-nocookie.com` and Vimeo uses `dnt=1`. Unlisted Vimeo links work: the
private hash (`vimeo.com/{id}/{hash}` or `?h=`) is carried into the embed URL
(`web/app/utils/vimeoEmbedUrl.ts`).

## One-time Studio setup

The plugin needs Mux API credentials, entered once in the Studio:

1. In the Mux dashboard, go to **Settings → Access Tokens**. Create a token
   for the same environment as the live stream, with **Mux Video:
   Read + Write**. The `MUX_TOKEN_ID`/`MUX_TOKEN_SECRET` in `web/.env` work
   if they have those permissions.
2. In the Studio, open any document with a video field and click the field's
   **plug icon (Configure plugin)**. Paste the Token ID and Secret, then save.
   The plugin stores them in a `secrets.mux` document in the dataset, which
   isn't readable without auth. Only an admin needs to do this, and only once.

Uploads, thumbnails and the asset browser all work after that.

## Cost note

Mux bills by encoding, storage and **delivered minutes**. Autoplay loops on
the home page count against delivery on every visit, so keep loops short and
upload them at a sensible resolution. Long-form video is on Vimeo/YouTube
partly so it doesn't add to this.
