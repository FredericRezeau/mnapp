// Copyright (c) 2017 The Magnet developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

package com.magnetwork.mnapp;

import android.content.Context;
import android.webkit.WebView;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.widget.Toast;
import android.content.SharedPreferences;
import android.support.v4.app.NotificationCompat;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.app.Notification;

public class WebAppInterface {
    Context mContext;
    WebView mView;
    WebAppInterface(Context context, WebView view) {
        mView = view;
        mContext = context;
    }

    /** Show a toast from the web page */
    @JavascriptInterface
    public void showToast(String toast) {
        Toast.makeText(mContext, toast, Toast.LENGTH_SHORT).show();
    }

    /** Show a notification */
    @JavascriptInterface
    public void showNotification(String message) {
        Intent intent = new Intent(mContext, MainActivity.class);
        PendingIntent contentIntent = PendingIntent.getActivity(mContext, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT);

        NotificationCompat.Builder mBuilder = new NotificationCompat.Builder(mContext)
                .setDefaults(Notification.DEFAULT_ALL)
                .setWhen(System.currentTimeMillis())
                .setSmallIcon(R.drawable.ic_launcher)
                .setContentTitle("MN Manager")
                .setContentText(message)
                .setDefaults(Notification.DEFAULT_LIGHTS| Notification.DEFAULT_SOUND | Notification.FLAG_AUTO_CANCEL)
                .setContentIntent(contentIntent)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT);

        NotificationManager notificationManager = (NotificationManager) mContext.getSystemService(Context.NOTIFICATION_SERVICE);
        notificationManager.notify(1, mBuilder.build());
    }

    /** Store item */
    @JavascriptInterface
    public void setStorageItem(String item, String value){
        SharedPreferences.Editor editor = mContext.getSharedPreferences("app_data", Context.MODE_PRIVATE).edit();
        editor.putString(item, value);
        editor.apply();

        getStorageItem(item);
    }

    /** Retrieve item */
    @JavascriptInterface
    public void getStorageItem(String item){
        SharedPreferences prefs = mContext.getSharedPreferences("app_data", Context.MODE_PRIVATE);
        String retrievedItem = prefs.getString(item, null);

        if(retrievedItem != null){
            mView.evaluateJavascript("javascript:onStorageItem(\"" + item + "\", \"" + retrievedItem + "\");", new ValueCallback<String>() {
                @Override
                public void onReceiveValue(String s) {
                }
            });
        }
    }
}