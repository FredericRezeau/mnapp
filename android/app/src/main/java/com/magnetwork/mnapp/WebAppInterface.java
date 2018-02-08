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