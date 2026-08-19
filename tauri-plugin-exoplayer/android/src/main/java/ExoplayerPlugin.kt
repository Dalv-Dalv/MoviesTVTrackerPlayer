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
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.Plugin
import app.tauri.plugin.JSObject

@InvokeArg
internal class LoadVideoArgs {
    lateinit var url: String
}

@InvokeArg
internal class ResizeArgs {
    lateinit var mode: String
}

@InvokeArg
internal class SeekArgs {
    var seconds: Double = 0.0
}

@TauriPlugin
class ExoplayerPlugin(private val activity: Activity): Plugin(activity) {
    private var player: ExoPlayer? = null
    private var playerView: PlayerView? = null
    private var pluginWebView: WebView? = null

    override fun load(webView: WebView) {
        super.load(webView)
        pluginWebView = webView

        activity.runOnUiThread {
            webView.setBackgroundColor(Color.TRANSPARENT)
            
            playerView = PlayerView(activity)
            playerView?.useController = false
            playerView?.resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FIT
            
            val parent = webView.parent as ViewGroup
            parent.addView(playerView, 0)

            player = ExoPlayer.Builder(activity).build()
            playerView?.player = player

            player?.addListener(object : Player.Listener {
                override fun onIsPlayingChanged(isPlaying: Boolean) {
                    trigger("exoplayer-event", JSObject().apply {
                        put("type", "pause")
                        put("value", !isPlaying)
                    })
                }
            })
        }
    }

    @Command
    fun loadVideo(invoke: Invoke) {
        val args = invoke.parseArgs(LoadVideoArgs::class.java)
        val urlString = args.url

        activity.runOnUiThread {
            val uri = Uri.parse(urlString)
            val mediaItem = MediaItem.fromUri(uri)
            
            player?.setMediaItem(mediaItem)
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
    fun setResizeMode(invoke: Invoke) {
        val args = invoke.parseArgs(ResizeArgs::class.java)
        
        activity.runOnUiThread {
            when (args.mode) {
                "cover" -> playerView?.resizeMode = AspectRatioFrameLayout.RESIZE_MODE_ZOOM
                "stretch" -> playerView?.resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FILL
                else -> playerView?.resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FIT
            }
            invoke.resolve()
        }
    }
}