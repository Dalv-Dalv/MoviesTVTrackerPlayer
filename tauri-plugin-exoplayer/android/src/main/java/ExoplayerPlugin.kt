package com.plugin.exoplayer

import android.app.Activity
import android.graphics.Color
import android.net.Uri
import android.view.SurfaceView
import android.view.ViewGroup
import android.webkit.WebView
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.common.C
import androidx.media3.exoplayer.SeekParameters
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.exoplayer.DefaultRenderersFactory
import androidx.media3.exoplayer.text.TextRenderer
import androidx.media3.exoplayer.text.TextOutput
import androidx.media3.exoplayer.Renderer
import android.content.Context
import java.util.ArrayList
import android.graphics.Bitmap
import androidx.media3.common.VideoSize
import android.widget.FrameLayout
import android.os.Handler
import android.os.Looper
import android.view.PixelCopy
import java.io.File
import java.io.FileOutputStream
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.Plugin
import app.tauri.plugin.JSObject
import app.tauri.plugin.JSArray
import androidx.media3.common.text.CueGroup
import androidx.media3.common.Tracks

@InvokeArg
internal class SetPauseArgs {
    var isPaused: Boolean = false
}

@InvokeArg
internal class LoadVideoArgs {
    lateinit var url: String
    var startTime: Double? = null
}

@InvokeArg
internal class ResizeArgs {
    lateinit var mode: String
}

@InvokeArg
internal class SeekArgs {
    var seconds: Double = 0.0
}

@InvokeArg
internal class SeekToArgs {
    var seconds: Double = 0.0
}

@InvokeArg
internal class SetTrackArgs {
    lateinit var id: String
}

@InvokeArg
internal class AddSubtitleArgs {
    lateinit var url: String
}

@InvokeArg
internal class SeekToPercentageArgs {
    var percent: Double = 0.0
}

@InvokeArg
internal class SetVolumeArgs {
    var vol: Double = 0.0
}

@InvokeArg
internal class AddVolumeArgs {
    var vol: Double = 0.0
}

@InvokeArg
internal class SetSubVisibilityArgs {
    var visible: Boolean = true
}

@InvokeArg
internal class SetBrightnessArgs {
    var brightness: Double = 0.0
}

@InvokeArg
internal class AddBrightnessArgs {
    var brightness: Double = 0.0
}

@TauriPlugin
class ExoplayerPlugin(private val activity: Activity): Plugin(activity) {
    private var player: ExoPlayer? = null
    private var playerView: PlayerView? = null
    private var pluginWebView: WebView? = null
    private val handler = Handler(Looper.getMainLooper())
    
    private fun emitEvent(payload: JSObject) {
        activity.runOnUiThread {
            try {
                trigger("exoplayer-event", payload)
                val b64 = android.util.Base64.encodeToString(payload.toString().toByteArray(), android.util.Base64.NO_WRAP)
                val js = "window.dispatchEvent(new CustomEvent('exoplayer-event-raw', { detail: JSON.parse(atob('$b64')) }));"
                pluginWebView?.evaluateJavascript(js, null)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
    
    private val timePosRunnable = object : Runnable {
        override fun run() {
            player?.let {
                emitEvent(JSObject().apply {
                    put("name", "time-pos")
                    put("data", it.currentPosition / 1000.0)
                })
            }
            handler.postDelayed(this, 500)
        }
    }

    override fun load(webView: WebView) {
        super.load(webView)
        pluginWebView = webView

        activity.runOnUiThread {
            webView.setBackgroundColor(Color.TRANSPARENT)
            playerView = PlayerView(activity)
            playerView?.useController = false
            playerView?.resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FIT
            playerView?.setBackgroundColor(Color.BLACK)
            
            val parent = webView.parent as ViewGroup
            parent.addView(playerView, 0)

            val loadControl = DefaultLoadControl.Builder()
                .setBufferDurationsMs(
                    2000,  // minBufferMs (2 seconds)
                    5000,  // maxBufferMs (5 seconds)
                    100,
                    500
                ).build()

            val mediaSourceFactory = DefaultMediaSourceFactory(activity)
                .experimentalParseSubtitlesDuringExtraction(false)

            val renderersFactory = object : DefaultRenderersFactory(activity) {
                override fun buildTextRenderers(
                    context: Context,
                    output: TextOutput,
                    outputLooper: Looper,
                    extensionRendererMode: Int,
                    out: ArrayList<Renderer>
                ) {
                    val textRenderer = TextRenderer(output, outputLooper)
                    textRenderer.experimentalSetLegacyDecodingEnabled(true)
                    out.add(textRenderer)
                }
            }

            player = ExoPlayer.Builder(activity, renderersFactory)
                .setMediaSourceFactory(mediaSourceFactory)
                .setLoadControl(loadControl)
                .build()
            
            val audioAttributes = androidx.media3.common.AudioAttributes.Builder()
                .setUsage(C.USAGE_MEDIA)
                .setContentType(C.AUDIO_CONTENT_TYPE_MOVIE)
                .build()
            player?.setAudioAttributes(audioAttributes, true)
            
            playerView?.player = player

            player?.addListener(object : Player.Listener {
                override fun onRenderedFirstFrame() {
                    emitEvent(JSObject().apply {
                        put("name", "first-frame-rendered")
                        put("data", true)
                    })
                }

                override fun onIsPlayingChanged(isPlaying: Boolean) {
                    emitEvent(JSObject().apply {
                        put("name", "pause")
                        put("data", !isPlaying)
                    })
                    
                    if (isPlaying) {
                        handler.post(timePosRunnable)
                    } else {
                        handler.removeCallbacks(timePosRunnable)
                    }
                }

                override fun onDeviceVolumeChanged(volume: Int, muted: Boolean) {
                    if (muted) {
                        emitEvent(JSObject().apply {
                            put("name", "mute")
                            put("data", true)
                        })
                    } else {
                        val maxVol = player?.deviceInfo?.maxVolume ?: 1
                        emitEvent(JSObject().apply {
                            put("name", "volume")
                            put("data", (volume.toDouble() / maxVol) * 100.0)
                        })
                    }
                }

                override fun onPlaybackStateChanged(playbackState: Int) {
                    emitEvent(JSObject().apply {
                        put("name", "buffering")
                        put("data", playbackState == Player.STATE_BUFFERING)
                    })

                    if (playbackState == Player.STATE_READY) {
                        val durationMs = player?.duration ?: 0L
                        if (durationMs > 0) {
                            emitEvent(JSObject().apply {
                                put("name", "duration")
                                put("data", durationMs / 1000.0)
                            })
                        }
                    } else if (playbackState == Player.STATE_ENDED) {
                        emitEvent(JSObject().apply {
                            put("name", "eof-reached")
                            put("data", true)
                        })
                    }
                }

                override fun onCues(cueGroup: CueGroup) {
                    val text = cueGroup.cues.joinToString("\n") { it.text?.toString() ?: "" }
                    emitEvent(JSObject().apply {
                        put("name", "sub-text")
                        put("data", text)
                    })
                }

                override fun onTracksChanged(tracks: Tracks) {
                    val trackList = JSArray()
                    var currentSid: String? = null
                    var currentAid: String? = null
                    
                    var index = 0
                    for (group in tracks.groups) {
                        val type = group.type
                        
                        if (type != C.TRACK_TYPE_AUDIO && type != C.TRACK_TYPE_TEXT) continue
                        
                        val format = group.mediaTrackGroup.getFormat(0)
                        
                        val trackId = format.id ?: index.toString()
                        val typeStr = if (type == C.TRACK_TYPE_AUDIO) "audio" else "sub"
                        
                        val trackObj = JSObject().apply {
                            put("id", trackId)
                            put("type", typeStr)
                            put("lang", format.language ?: "unknown")
                            put("title", format.label ?: format.language ?: "unknown")
                            put("selected", group.isSelected)
                        }
                        trackList.put(trackObj)

                        if (group.isSelected) {
                            if (type == C.TRACK_TYPE_AUDIO) currentAid = trackId
                            if (type == C.TRACK_TYPE_TEXT) currentSid = trackId
                        }
                        index++
                    }

                    emitEvent(JSObject().apply {
                        put("name", "track-list")
                        put("data", trackList)
                    })
                    
                    currentAid?.let { aid ->
                        emitEvent(JSObject().apply {
                            put("name", "aid")
                            put("data", aid)
                        })
                    }
                    
                    currentSid?.let { sid ->
                        emitEvent(JSObject().apply {
                            put("name", "sid")
                            put("data", sid)
                        })
                    }
                }
            })
            
            handler.post(timePosRunnable)
        }
    }

    @Command
    fun loadVideo(invoke: Invoke) {
        val args = invoke.parseArgs(LoadVideoArgs::class.java)
        val urlString = args.url

        activity.runOnUiThread {
            val uri = if (urlString.startsWith("/")) Uri.fromFile(File(urlString)) else Uri.parse(urlString)
            val mediaItem = MediaItem.fromUri(uri)
            
            player?.setMediaItem(mediaItem)
            
            args.startTime?.let { startTime ->
                if (startTime > 0) {
                    player?.seekTo((startTime * 1000).toLong())
                }
            }
            
            player?.prepare()
            player?.play()
            
            invoke.resolve()
        }
    }

    @Command
    fun playPause(invoke: Invoke) {
        activity.runOnUiThread {
            player?.let {
                if (it.isPlaying) {
                    it.pause()
                } else {
                    it.play()
                }
            }
            invoke.resolve()
        }
    }

    @Command
    fun setPaused(invoke: Invoke) {
        val args = invoke.parseArgs(SetPauseArgs::class.java)

        activity.runOnUiThread {
            player?.let {
                if (args.isPaused) {
                    it.pause()
                } else {
                    it.play()
                }
            }
            invoke.resolve()
        }
    }

    @Command
    fun seek(invoke: Invoke) {
        val args = invoke.parseArgs(SeekArgs::class.java)
        
        activity.runOnUiThread {
            player?.let {
                val currentPosMs = it.currentPosition
                val seekOffsetMs = (args.seconds * 1000).toLong()
                
                it.seekTo(currentPosMs + seekOffsetMs)
            }
            invoke.resolve()
        }
    }

    @Command
    fun seekTo(invoke: Invoke) {
        val args = invoke.parseArgs(SeekToArgs::class.java)

        activity.runOnUiThread {
            player?.let {
                val positionMs = (args.seconds * 1000).toLong()
                
                it.seekTo(positionMs)
            }
            invoke.resolve()
        }
    }

    @Command
    fun seekToPercentage(invoke: Invoke) {
        val args = invoke.parseArgs(SeekToPercentageArgs::class.java)

        activity.runOnUiThread {
            player?.let {
                val duration = it.duration
                if (duration > 0) {
                    val positionMs = (duration * (args.percent / 100.0)).toLong()
                    it.seekTo(positionMs)
                }
            }
            invoke.resolve()
        }
    }

    @Command
    fun setVolume(invoke: Invoke) {
        val args = invoke.parseArgs(SetVolumeArgs::class.java)

        activity.runOnUiThread {
            try {
                val audioManager = activity.getSystemService(Context.AUDIO_SERVICE) as android.media.AudioManager
                val maxVol = audioManager.getStreamMaxVolume(android.media.AudioManager.STREAM_MUSIC)
                val targetVol = (maxVol * (args.vol / 100.0)).toInt().coerceIn(0, maxVol)
                audioManager.setStreamVolume(android.media.AudioManager.STREAM_MUSIC, targetVol, 0)
                
                emitEvent(JSObject().apply {
                    put("name", "volume")
                    put("data", (targetVol.toDouble() / maxVol) * 100.0)
                })
                
                invoke.resolve()
            } catch (e: Exception) {
                e.printStackTrace()
                invoke.resolve()
            }
        }
    }

    @Command
    fun addVolume(invoke: Invoke) {
        val args = invoke.parseArgs(AddVolumeArgs::class.java)

        activity.runOnUiThread {
            try {
                val audioManager = activity.getSystemService(Context.AUDIO_SERVICE) as android.media.AudioManager
                val maxVol = audioManager.getStreamMaxVolume(android.media.AudioManager.STREAM_MUSIC)
                val currentVol = audioManager.getStreamVolume(android.media.AudioManager.STREAM_MUSIC)
                var step = (maxVol * (args.vol / 100.0)).toInt()
                
                if (step == 0 && args.vol > 0) step = 1
                if (step == 0 && args.vol < 0) step = -1
                
                val targetVol = (currentVol + step).coerceIn(0, maxVol)
                audioManager.setStreamVolume(android.media.AudioManager.STREAM_MUSIC, targetVol, 0)
                
                emitEvent(JSObject().apply {
                    put("name", "volume")
                    put("data", (targetVol.toDouble() / maxVol) * 100.0)
                })
                
                invoke.resolve()
            } catch (e: Exception) {
                e.printStackTrace()
                invoke.resolve()
            }
        }
    }

    @Command
    fun getVolume(invoke: Invoke) {
        activity.runOnUiThread {
            try {
                val audioManager = activity.getSystemService(Context.AUDIO_SERVICE) as android.media.AudioManager
                val maxVol = audioManager.getStreamMaxVolume(android.media.AudioManager.STREAM_MUSIC)
                val currentVol = audioManager.getStreamVolume(android.media.AudioManager.STREAM_MUSIC)
                val percent = (currentVol.toDouble() / maxVol.toDouble()) * 100.0
                invoke.resolve(JSObject().apply { put("volume", percent) })
            } catch (e: Exception) {
                e.printStackTrace()
                invoke.resolve(JSObject().apply { put("volume", 100.0) })
            }
        }
    }

    @Command
    fun restoreBrightness(invoke: Invoke) {
        activity.runOnUiThread {
            try {
                val window = activity.window
                val layoutParams = window.attributes
                layoutParams.screenBrightness = android.view.WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE
                window.attributes = layoutParams
                invoke.resolve()
            } catch (e: Exception) {
                e.printStackTrace()
                invoke.resolve()
            }
        }
    }

    @Command
    fun getBrightness(invoke: Invoke) {
        activity.runOnUiThread {
            try {
                val window = activity.window
                val layoutParams = window.attributes
                var current = layoutParams.screenBrightness
                if (current < 0) {
                    current = android.provider.Settings.System.getInt(
                        activity.contentResolver,
                        android.provider.Settings.System.SCREEN_BRIGHTNESS,
                        128
                    ) / 255.0f
                }
                invoke.resolve(JSObject().apply { put("brightness", (current * 100.0).coerceIn(0.0, 100.0)) })
            } catch (e: Exception) {
                e.printStackTrace()
                invoke.resolve(JSObject().apply { put("brightness", 50.0) })
            }
        }
    }
    @Command
    fun toggleMute(invoke: Invoke) {
        activity.runOnUiThread {
            player?.let {
                it.setDeviceMuted(!it.isDeviceMuted, C.VOLUME_FLAG_VIBRATE)
            }
            invoke.resolve()
        }
    }

    @Command
    fun setBrightness(invoke: Invoke) {
        val args = invoke.parseArgs(SetBrightnessArgs::class.java)

        activity.runOnUiThread {
            try {
                val window = activity.window
                val layoutParams = window.attributes
                layoutParams.screenBrightness = (args.brightness / 100.0).toFloat().coerceIn(0.0f, 1.0f)
                window.attributes = layoutParams
                
                emitEvent(JSObject().apply {
                    put("name", "brightness")
                    put("data", args.brightness)
                })
                
                invoke.resolve()
            } catch (e: Exception) {
                e.printStackTrace()
                invoke.resolve()
            }
        }
    }

    @Command
    fun addBrightness(invoke: Invoke) {
        val args = invoke.parseArgs(AddBrightnessArgs::class.java)

        activity.runOnUiThread {
            try {
                val window = activity.window
                val layoutParams = window.attributes
                var current = layoutParams.screenBrightness
                if (current < 0) {
                    current = 0.5f 
                }
                layoutParams.screenBrightness = (current + (args.brightness / 100.0).toFloat()).coerceIn(0.0f, 1.0f)
                window.attributes = layoutParams
                
                emitEvent(JSObject().apply {
                    put("name", "brightness")
                    put("data", layoutParams.screenBrightness * 100.0)
                })
                
                invoke.resolve()
            } catch (e: Exception) {
                e.printStackTrace()
                invoke.resolve()
            }
        }
    }

    @Command
    fun setResizeMode(invoke: Invoke) {
        val args = invoke.parseArgs(ResizeArgs::class.java)
        
        activity.runOnUiThread {
            when (args.mode.lowercase()) {
                "cover" -> playerView?.resizeMode = AspectRatioFrameLayout.RESIZE_MODE_ZOOM
                "stretch" -> playerView?.resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FILL
                else -> playerView?.resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FIT
            }
            invoke.resolve()
        }
    }

    @Command
    fun stop(invoke: Invoke) {
        activity.runOnUiThread {
            player?.let {
                it.stop()
                it.clearMediaItems()
            }
            invoke.resolve()
        }
    }

    @Command
    fun setAudioTrack(invoke: Invoke) {
        val args = invoke.parseArgs(SetTrackArgs::class.java)
        activity.runOnUiThread {
            player?.let { exo ->
                if (args.id == "0") {
                    exo.trackSelectionParameters = exo.trackSelectionParameters.buildUpon()
                        .setTrackTypeDisabled(C.TRACK_TYPE_AUDIO, true).build()
                } else {
                    var index = 0
                    for (group in exo.currentTracks.groups) {
                        val type = group.type
                        if (type != C.TRACK_TYPE_AUDIO && type != C.TRACK_TYPE_TEXT) continue
                        val format = group.mediaTrackGroup.getFormat(0)
                        val trackId = format.id ?: index.toString()
                        
                        if (trackId == args.id && type == C.TRACK_TYPE_AUDIO) {
                            exo.trackSelectionParameters = exo.trackSelectionParameters.buildUpon()
                                .setTrackTypeDisabled(C.TRACK_TYPE_AUDIO, false)
                                .setOverrideForType(androidx.media3.common.TrackSelectionOverride(group.mediaTrackGroup, 0))
                                .build()
                            break
                        }
                        index++
                    }
                }
            }
            invoke.resolve()
        }
    }

    @Command
    fun setSubtitleTrack(invoke: Invoke) {
        val args = invoke.parseArgs(SetTrackArgs::class.java)
        activity.runOnUiThread {
            player?.let { exo ->
                if (args.id == "0") {
                    exo.trackSelectionParameters = exo.trackSelectionParameters.buildUpon()
                        .setTrackTypeDisabled(C.TRACK_TYPE_TEXT, true).build()
                } else {
                    var index = 0
                    for (group in exo.currentTracks.groups) {
                        val type = group.type
                        if (type != C.TRACK_TYPE_AUDIO && type != C.TRACK_TYPE_TEXT) continue
                        val format = group.mediaTrackGroup.getFormat(0)
                        val trackId = format.id ?: index.toString()
                        
                        if (trackId == args.id && type == C.TRACK_TYPE_TEXT) {
                            exo.trackSelectionParameters = exo.trackSelectionParameters.buildUpon()
                                .setTrackTypeDisabled(C.TRACK_TYPE_TEXT, false)
                                .setOverrideForType(androidx.media3.common.TrackSelectionOverride(group.mediaTrackGroup, 0))
                                .build()
                            break
                        }
                        index++
                    }
                }
            }
            invoke.resolve()
        }
    }

    @Command
    fun addSubtitle(invoke: Invoke) {
        val args = invoke.parseArgs(AddSubtitleArgs::class.java)
        activity.runOnUiThread {
            player?.let { exo ->
                val currentMediaItem = exo.currentMediaItem
                if (currentMediaItem != null) {
                    val mime = if (args.url.lowercase().endsWith(".vtt")) androidx.media3.common.MimeTypes.TEXT_VTT else androidx.media3.common.MimeTypes.APPLICATION_SUBRIP
                    val subtitleConfig = MediaItem.SubtitleConfiguration.Builder(android.net.Uri.parse(args.url))
                        .setMimeType(mime)
                        .setLanguage("en")
                        .setSelectionFlags(C.SELECTION_FLAG_DEFAULT)
                        .build()
                        
                    val newConfigs = currentMediaItem.localConfiguration?.subtitleConfigurations?.toMutableList() ?: mutableListOf()
                    newConfigs.add(subtitleConfig)
                    
                    val newMediaItem = currentMediaItem.buildUpon()
                        .setSubtitleConfigurations(newConfigs)
                        .build()
                        
                    val pos = exo.currentPosition
                    exo.setMediaItem(newMediaItem)
                    exo.seekTo(pos)
                    exo.prepare()
                    exo.play()
                }
            }
            invoke.resolve()
        }
    }

    @Command
    fun setSubVisibility(invoke: Invoke) {
        val args = invoke.parseArgs(SetSubVisibilityArgs::class.java)
        activity.runOnUiThread {
            if (args.visible) {
                playerView?.subtitleView?.visibility = android.view.View.VISIBLE
            } else {
                playerView?.subtitleView?.visibility = android.view.View.INVISIBLE
            }
            invoke.resolve()
        }
    }

    @Command
    fun captureFrame(invoke: Invoke) {
        activity.runOnUiThread {
            val surfaceView = playerView?.videoSurfaceView as? SurfaceView
            
            if (surfaceView == null || surfaceView.width == 0 || surfaceView.height == 0) {
                invoke.resolve(null)
                return@runOnUiThread
            }

            val bitmap = Bitmap.createBitmap(surfaceView.width, surfaceView.height, Bitmap.Config.ARGB_8888)
            
            PixelCopy.request(surfaceView, bitmap, { result ->
                if (result == PixelCopy.SUCCESS) {
                    Thread {
                        try {
                            val file = File(activity.cacheDir, "capture_frame.jpg")
                            val out = FileOutputStream(file)
                            
                            bitmap.compress(Bitmap.CompressFormat.JPEG, 80, out)
                            out.flush()
                            out.close()
                            
                            activity.runOnUiThread {
                                invoke.resolve(JSObject().apply { put("path", file.absolutePath) })
                            }
                        } catch (e: Exception) {
                            e.printStackTrace()
                            activity.runOnUiThread {
                                invoke.resolve(null)
                            }
                        }
                    }.start()
                } else {
                    invoke.resolve(null)
                }
            }, Handler(Looper.getMainLooper()))
        }
    }
}
