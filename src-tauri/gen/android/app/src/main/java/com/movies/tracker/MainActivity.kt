package com.movies.tracker

import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : TauriActivity() {

  private var isImmersive = false

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    pollJs()
  }

  private fun applyImmersiveMode(hide: Boolean) {
    val windowInsetsController = WindowCompat.getInsetsController(window, window.decorView)
    if (hide) {
      windowInsetsController.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
      windowInsetsController.hide(WindowInsetsCompat.Type.systemBars())
    } else {
      windowInsetsController.show(WindowInsetsCompat.Type.systemBars())
    }
  }

  private fun pollJs() {
    val webView = findWebView(window.decorView)
    if (webView != null) {
      webView.evaluateJavascript("window.__android_immersive_state") { result ->
        if (result == "\"true\"" || result == "true") {
          if (!isImmersive) {
            isImmersive = true
            applyImmersiveMode(true)
          }
        } else if (result == "\"false\"" || result == "false") {
          if (isImmersive) {
            isImmersive = false
            applyImmersiveMode(false)
          }
        }
        window.decorView.postDelayed({ pollJs() }, 300)
      }
    } else {
      window.decorView.postDelayed({ pollJs() }, 300)
    }
  }

  private fun findWebView(view: View): WebView? {
    if (view is WebView) return view
    if (view is ViewGroup) {
      for (i in 0 until view.childCount) {
        val child = view.getChildAt(i)
        val result = findWebView(child)
        if (result != null) return result
      }
    }
    return null
  }
}
