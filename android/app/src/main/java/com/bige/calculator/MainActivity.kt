package com.bige.calculator

import android.annotation.SuppressLint
import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Bundle
import android.view.MenuItem
import android.webkit.*
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.bige.calculator.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var webView: WebView

    // GitHub Pages URL (항상 최신 반영)
    private val SITE_URL = "https://wangun1004.github.io/sunpoong-site/"
    // 오프라인 폴백 (로컬 assets)
    private val OFFLINE_URL = "file:///android_asset/index.html"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.title = "선풍건설산업"
        supportActionBar?.setDisplayHomeAsUpEnabled(false)

        webView = binding.webView

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            loadWithOverviewMode = true
            useWideViewPort = true
            setSupportZoom(true)
            builtInZoomControls = false
            displayZoomControls = false
            // 온라인: 캐시 우선, 오프라인: 캐시만 사용
            cacheMode = if (isOnline()) WebSettings.LOAD_DEFAULT else WebSettings.LOAD_CACHE_ELSE_NETWORK
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val url = request.url.toString()
                // 사이트 내 모든 페이지 이동 허용
                if (url.startsWith("https://wangun1004.github.io/sunpoong-site")) return false
                if (url.startsWith("file://")) return false
                // 전화/이메일
                if (url.startsWith("tel:") || url.startsWith("mailto:")) {
                    startActivity(android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url)))
                    return true
                }
                // 기타 외부 링크 차단
                return true
            }

            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                // 네트워크 오류 시 로컬 파일로 폴백
                if (request.isForMainFrame) {
                    view.loadUrl(OFFLINE_URL)
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onJsAlert(view: WebView, url: String, message: String, result: JsResult): Boolean {
                Toast.makeText(this@MainActivity, message, Toast.LENGTH_LONG).show()
                result.confirm()
                return true
            }
        }

        // 온라인이면 GitHub Pages, 오프라인이면 로컬 assets
        if (isOnline()) {
            webView.loadUrl(SITE_URL)
        } else {
            Toast.makeText(this, "오프라인 모드로 실행됩니다", Toast.LENGTH_SHORT).show()
            webView.loadUrl(OFFLINE_URL)
        }
    }

    private fun isOnline(): Boolean {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = cm.activeNetwork ?: return false
        val caps = cm.getNetworkCapabilities(network) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
