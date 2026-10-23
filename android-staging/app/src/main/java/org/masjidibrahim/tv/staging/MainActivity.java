package org.masjidibrahim.tv.staging;

import android.app.Activity;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import org.json.JSONObject;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Staging-only Android TV prototype; does not replace the production package. */
public final class MainActivity extends Activity {
 private static final String HOST = "https://masjid-ibrahim-staging.vercel.app";
 private static final String DEFAULT = HOST + "/";
 private static final String LIVE = HOST + "/audience-live";
 private static final String API = HOST + "/api/audience/current";
 private final Handler handler = new Handler(Looper.getMainLooper());
 private final ExecutorService io = Executors.newSingleThreadExecutor();
 private WebView browser;
 private boolean presenting = false;
 private boolean running = false;
 private final Runnable poll = new Runnable() {
  @Override public void run() {
   if (!running) return;
   io.execute(() -> {
    Boolean live = null;
    HttpURLConnection conn = null;
    try {
     conn = (HttpURLConnection)new URL(API).openConnection();
     conn.setConnectTimeout(4500);
     conn.setReadTimeout(4500);
     conn.setRequestProperty("Cache-Control","no-cache");
     if(conn.getResponseCode()==200){
      java.io.ByteArrayOutputStream output=new java.io.ByteArrayOutputStream();
      try(java.io.InputStream input=conn.getInputStream()){
       byte[] buffer=new byte[4096];int count;
       while((count=input.read(buffer))!=-1)output.write(buffer,0,count);
      }
      byte[] bytes=output.toByteArray();
      JSONObject json=new JSONObject(new String(bytes,java.nio.charset.StandardCharsets.UTF_8));
      live="live".equals(json.optString("state"));
     }
    } catch(Exception ignored) { /* Keep current screen on transient network failures. */ }
    finally { if(conn!=null)conn.disconnect(); }
    final Boolean state=live;
    handler.post(() -> {
     if(!running)return;
     if(state!=null&&state!=presenting){
      presenting=state;
      browser.loadUrl(presenting?LIVE:DEFAULT);
     }
     handler.postDelayed(poll,1500);
    });
   });
  }
 };
 @Override public void onCreate(Bundle saved){
  super.onCreate(saved);
  getWindow().getDecorView().setSystemUiVisibility(5894|1024|512);
  browser=new WebView(this);
  browser.setBackgroundColor(0xff071a37);
  browser.setWebViewClient(new WebViewClient(){
   @Override public boolean shouldOverrideUrlLoading(WebView view,String url){
    return !url.startsWith(HOST+"/");
   }
  });
  WebSettings settings=browser.getSettings();
  settings.setJavaScriptEnabled(true);
  settings.setDomStorageEnabled(true);
  settings.setMediaPlaybackRequiresUserGesture(false);
  setContentView(browser);
  browser.loadUrl(DEFAULT);
 }
 @Override protected void onResume(){super.onResume();running=true;handler.removeCallbacks(poll);handler.post(poll);}
 @Override protected void onPause(){running=false;handler.removeCallbacks(poll);super.onPause();}
 @Override protected void onDestroy(){running=false;handler.removeCallbacks(poll);io.shutdownNow();browser.destroy();super.onDestroy();}
 @Override public void onBackPressed(){browser.loadUrl(presenting?LIVE:DEFAULT);}
}
