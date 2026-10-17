package org.masjidibrahim.tv;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.view.KeyEvent;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceError;
import android.webkit.WebSettings;
import android.graphics.Color;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.view.Gravity;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.content.Context;

public final class MainActivity extends Activity {
    private static final String DASHBOARD = "https://masjid-ibrahim-dashboard.vercel.app/";
    private WebView browser;
    private TextView offline;
    private boolean pageFailed = false;

    private void immersive() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        immersive();
        getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(7,29,52));
        browser = new WebView(this);
        browser.setBackgroundColor(Color.rgb(7,29,52));
        browser.setFocusable(true);
        browser.setFocusableInTouchMode(true);
        WebSettings settings = browser.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMediaPlaybackRequiresUserGesture(false);
        browser.setWebViewClient(new WebViewClient() {
            @Override public void onPageStarted(WebView view, String url, android.graphics.Bitmap icon) {
                if (DASHBOARD.equals(url)) { pageFailed=false; offline.setVisibility(View.GONE); }
            }
            @Override public void onPageFinished(WebView view, String url) {
                if (pageFailed) offline.setVisibility(View.VISIBLE);
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) { pageFailed=true; offline.setVisibility(View.VISIBLE); }
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !request.getUrl().toString().startsWith("https://masjid-ibrahim-dashboard.vercel.app/");
            }
        });
        root.addView(browser, new FrameLayout.LayoutParams(-1,-1));
        offline = new TextView(this);
        offline.setText("Masjid Ibrahim dashboard is unavailable.\nCheck Wi-Fi, then press OK to retry.");
        offline.setTextColor(Color.WHITE);
        offline.setTextSize(23);
        offline.setGravity(Gravity.CENTER);
        offline.setBackgroundColor(Color.rgb(7,29,52));
        offline.setVisibility(View.GONE);
        offline.setFocusable(true);
        offline.setOnClickListener(v -> retry());
        root.addView(offline, new FrameLayout.LayoutParams(-1,-1));
        setContentView(root);
        browser.loadUrl(DASHBOARD);
    }
    private void retry() { offline.setVisibility(View.GONE); browser.loadUrl(DASHBOARD); }
    @Override public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER || keyCode == KeyEvent.KEYCODE_ENTER) {
            if (offline.getVisibility()==View.VISIBLE) { retry(); return true; }
        }
        if (keyCode == KeyEvent.KEYCODE_BACK) { return true; }
        return super.onKeyDown(keyCode,event);
    }
    @Override public void onWindowFocusChanged(boolean focus) { super.onWindowFocusChanged(focus); if(focus)immersive(); }
    @Override protected void onDestroy() { browser.destroy(); super.onDestroy(); }
}
