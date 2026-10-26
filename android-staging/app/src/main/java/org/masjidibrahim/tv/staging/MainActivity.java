package org.masjidibrahim.tv.staging;

import android.app.Activity;
import android.app.AlertDialog;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.EditText;
import android.text.InputType;
import java.io.OutputStream;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import org.json.JSONObject;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Staging-only Android TV: manually entered admin-issued pairing token. */
public final class MainActivity extends Activity {
 private static final String HOST="https://masjid-ibrahim-staging.vercel.app";
 private static final String CONFIG=HOST+"/api/device/config";
 private static final String PAIR=HOST+"/api/device/pair";
 private static final String AUDIENCE=HOST+"/api/audience/current";
 private static final String D03=HOST+"/api/d03";
 private static final String D03_LIVE=HOST+"/public?tv=1";
 private static final String LIVE=HOST+"/audience-live?tv=1";
 private final Handler handler=new Handler(Looper.getMainLooper());
 private final ExecutorService io=Executors.newSingleThreadExecutor();
 private WebView browser;
 private SharedPreferences prefs;
 private String token="", defaultUrl=HOST+"/d04",tvId="";
 private boolean paired=false,followLive=false,presenting=false,running=false,requestInFlight=false,setupVisible=false;
 private long lastConfig=0;
 private String shownUrl="",pendingUrl="";
 private int pendingPolls=0;
 private boolean lastD03Live=false;
 private static final class Reply {
  final int status; final JSONObject json;
  Reply(int code,JSONObject json){this.status=code;this.json=json;}
 }
 private Reply get(String url,String bearer) throws Exception {
  HttpURLConnection conn=(HttpURLConnection)new URL(url).openConnection();
  try {
   conn.setConnectTimeout(5000);conn.setReadTimeout(5000);
   conn.setRequestProperty("Cache-Control","no-cache");
   if(bearer!=null&&!bearer.isEmpty())conn.setRequestProperty("Authorization","Bearer "+bearer);
   int status=conn.getResponseCode();
   if(status!=200)return new Reply(status,null);
   try(InputStream input=conn.getInputStream();ByteArrayOutputStream output=new ByteArrayOutputStream()){
    byte[] buffer=new byte[4096];int n;
    while((n=input.read(buffer))!=-1)output.write(buffer,0,n);
    return new Reply(status,new JSONObject(output.toString("UTF-8")));
   }
  }finally{conn.disconnect();}
 }
 private Reply exchangeCode(String code) throws Exception {
  HttpURLConnection conn=(HttpURLConnection)new URL(PAIR).openConnection();
  try{
   conn.setRequestMethod("POST");conn.setDoOutput(true);conn.setConnectTimeout(5000);conn.setReadTimeout(5000);
   conn.setRequestProperty("Content-Type","application/json");
   byte[] body=new JSONObject().put("code",code).toString().getBytes(StandardCharsets.UTF_8);
   try(OutputStream out=conn.getOutputStream()){out.write(body);}
   int status=conn.getResponseCode();
   if(status!=200)return new Reply(status,null);
   try(InputStream input=conn.getInputStream();ByteArrayOutputStream output=new ByteArrayOutputStream()){
    byte[] buffer=new byte[4096];int n;while((n=input.read(buffer))!=-1)output.write(buffer,0,n);
    return new Reply(status,new JSONObject(output.toString("UTF-8")));
   }
  }finally{conn.disconnect();}
 }
 private void navigate(String url){
  // Confirm a change twice before replacing the current WebView page. A single
  // transient status response must not blank the entire dashboard.
  if(url.equals(shownUrl)){pendingUrl="";pendingPolls=0;return;}
  if(!url.equals(pendingUrl)){pendingUrl=url;pendingPolls=1;return;}
  if(++pendingPolls<2)return;
  pendingUrl="";pendingPolls=0;
  shownUrl=url;browser.loadUrl(url);
 }
 private void showSetup(String message){
  if(setupVisible)return;
  setupVisible=true;
  paired=false;followLive=false;presenting=false;lastD03Live=false;pendingUrl="";pendingPolls=0;tvId="";
  browser.setVisibility(View.GONE);
  LinearLayout panel=new LinearLayout(this);
  panel.setOrientation(LinearLayout.VERTICAL);panel.setPadding(45,55,45,35);
  TextView title=new TextView(this);title.setText("Masjid Ibrahim · STAGING TV Pairing");title.setTextSize(23);panel.addView(title);
  TextView description=new TextView(this);description.setText(message+"\n\nGenerate a 6-digit code in /tv-management for TV01, TV02, TV03 or TV05, then enter it here.");description.setTextSize(16);panel.addView(description);
  EditText entry=new EditText(this);entry.setSingleLine(true);entry.setHint("6-digit pairing code");entry.setInputType(InputType.TYPE_CLASS_NUMBER);panel.addView(entry);
  AlertDialog dialog=new AlertDialog.Builder(this).setView(panel).setCancelable(false)
   .setPositiveButton("Pair TV",null).create();
  dialog.setOnShowListener(v->dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(clicked->{
   String candidate=entry.getText().toString().trim();
   if(!candidate.matches("[0-9]{6}")){entry.setError("Enter all six digits");return;}
   dialog.getButton(AlertDialog.BUTTON_POSITIVE).setEnabled(false);
   io.execute(()->{
    Reply reply=null;try{reply=exchangeCode(candidate);}catch(Exception ignored){}
    final Reply outcome=reply;
    handler.post(()->{
     if(outcome==null){entry.setError("Connection failed. Try again.");dialog.getButton(AlertDialog.BUTTON_POSITIVE).setEnabled(true);return;}
     String received=outcome.json==null?"":outcome.json.optString("deviceToken","");
     if(outcome.status!=200||!received.matches("[A-Za-z0-9_-]{32,128}")){
      entry.setError(outcome.status==401?"Code expired or already used. Generate a new code.":"Unable to pair. Check staging database setup.");
      dialog.getButton(AlertDialog.BUTTON_POSITIVE).setEnabled(true);return;
     }
     token=received;prefs.edit().putString("pairing_token",token).apply();
     dialog.dismiss();setupVisible=false;browser.setVisibility(View.VISIBLE);
     requestInFlight=false;lastConfig=0;handler.post(poll);
    });
   });
  }));
  dialog.show();
 }
 private final Runnable poll=new Runnable(){
  @Override public void run(){
   if(!running||requestInFlight)return;
   if(token.isEmpty()){showSetup("This staging TV is not paired.");return;}
   requestInFlight=true;
   final boolean refreshConfig=!paired||System.currentTimeMillis()-lastConfig>=15000;
   final String key=token;
   io.execute(()->{
    Reply config=null,audience=null,d03=null;
    try{
     if(refreshConfig)config=get(CONFIG,key);
     if(!refreshConfig||config.status==200)d03=get(D03,null);
     if(!refreshConfig||(config.status==200&&config.json!=null)) {
      if((!refreshConfig&&followLive)||(refreshConfig&&config.json.optBoolean("followD02",false)))audience=get(AUDIENCE,null);
     }
    }catch(Exception ignored){/* Keep existing screen on transient network errors. */}
    final Reply c=config,live=audience,screenShare=d03;
    handler.post(()->{
     requestInFlight=false;if(!running||!key.equals(token))return;
     if(c!=null){
      if(c.status==401||c.status==403){
       prefs.edit().remove("pairing_token").apply();token="";showSetup("Pairing revoked or invalid.");return;
      }
      if(c.status==200&&c.json!=null){
       String dashboard=c.json.optString("defaultDashboard","UNASSIGNED");
       String assigned=c.json.optString("tvId","");
       if(!assigned.matches("TV0[1235]")||assigned.equals("TV04")||assigned.equals("TV06")){showSetup("Device assignment not permitted.");return;}
       tvId=assigned;
       if(!"D01".equals(dashboard)&&!"D04".equals(dashboard)){showSetup("Assign D01 or D04 to this TV in TV Management.");return;}
       defaultUrl="D01".equals(dashboard)?HOST+"/":HOST+"/d04";
       followLive=c.json.optBoolean("followD02",false);
       if(!followLive)lastD03Live=false;
       paired=true;lastConfig=System.currentTimeMillis();
      }
     }
     if(paired){
      // Failed checks never switch away from the current screen. Non-participating TVs never enter D02.
      if(!followLive)presenting=false;
      else if(live!=null&&live.status==200&&live.json!=null)presenting="live".equals(live.json.optString("state"));
      // A failed /api/d03 request is not evidence that the stream stopped.
      // Retain the last confirmed state until a successful status check.
      if(screenShare!=null&&screenShare.status==200&&screenShare.json!=null)
       lastD03Live=screenShare.json.optBoolean("live",false);
      boolean d03Live=followLive&&lastD03Live;
      navigate(d03Live?D03_LIVE:(presenting?LIVE:defaultUrl));
     }
     handler.postDelayed(poll,1500);
    });
   });
  }
 };
 @Override public void onCreate(Bundle saved){
  super.onCreate(saved);getWindow().getDecorView().setSystemUiVisibility(5894|1024|512);
  prefs=getSharedPreferences("staging_pairing",MODE_PRIVATE);token=prefs.getString("pairing_token","");
  browser=new WebView(this);browser.setBackgroundColor(0xff071a37);
  browser.setWebViewClient(new WebViewClient(){
   @Override public boolean shouldOverrideUrlLoading(WebView view,String url){return !url.startsWith(HOST+"/");}
  });
  WebSettings settings=browser.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);
  settings.setMediaPlaybackRequiresUserGesture(false);setContentView(browser);
  if(token.isEmpty())showSetup("No pairing token has been saved.");
 }
 @Override protected void onResume(){super.onResume();running=true;handler.removeCallbacks(poll);handler.post(poll);}
 @Override protected void onPause(){running=false;handler.removeCallbacks(poll);super.onPause();}
 @Override protected void onDestroy(){running=false;handler.removeCallbacks(poll);io.shutdownNow();browser.destroy();super.onDestroy();}
 @Override public void onBackPressed(){
  new AlertDialog.Builder(this).setTitle(tvId.isEmpty()?"Staging pairing":"TV "+tvId)
   .setMessage("Change the pairing for this TV?")
   .setPositiveButton("Change pairing",(d,w)->showSetup("Enter a new six-digit code generated by Admin."))
   .setNegativeButton("Keep current",null).show();
 }
}
