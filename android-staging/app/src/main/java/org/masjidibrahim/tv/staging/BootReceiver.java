package org.masjidibrahim.tv.staging;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

/**
 * Attempts to reopen the TV dashboard after a full Android boot.
 * Some Android TV firmware restricts activity starts from boot receivers;
 * in that case users can always launch the app manually from the TV launcher.
 */
public final class BootReceiver extends BroadcastReceiver {
 @Override public void onReceive(Context context, Intent intent) {
  if (intent == null || !Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) return;
  Intent launch = new Intent(context, MainActivity.class);
  launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
  try {
   context.startActivity(launch);
  } catch (RuntimeException e) {
   Log.w("MasjidIbrahimTV", "TV firmware prevented dashboard auto-launch; manual launch remains available", e);
  }
 }
}
