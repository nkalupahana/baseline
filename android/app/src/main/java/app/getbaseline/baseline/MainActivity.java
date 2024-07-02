package app.getbaseline.baseline;

import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Build;
import android.webkit.WebSettings;

import android.content.pm.ActivityInfo;
import android.os.Bundle;

import androidx.appcompat.app.AlertDialog;
import androidx.webkit.WebViewCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    final String WEBVIEW_PACKAGE = "com.google.android.webview";

    @Override
    public void onStart() {
        super.onStart();
        // Force dark mode based on UI mode
        int nightModeFlags = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        WebSettings webSettings = this.bridge.getWebView().getSettings();
        if (nightModeFlags == Configuration.UI_MODE_NIGHT_YES && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            webSettings.setForceDark(WebSettings.FORCE_DARK_ON);
        }

        // Disable weird accessibility text scaling
        WebSettings settings = this.bridge.getWebView().getSettings();
        settings.setTextZoom(100);

        // Show update notice if WebView is too old
        SharedPreferences prefs = bridge.getActivity().getPreferences(Context.MODE_PRIVATE);
        PackageInfo webViewInfo = WebViewCompat.getCurrentWebViewPackage(bridge.getContext());

        if (webViewInfo != null && !prefs.contains("hideWarning") && webViewInfo.packageName.equals(WEBVIEW_PACKAGE)) {
            if (Integer.parseInt(webViewInfo.versionName.split("\\.")[0]) < 91) {
                AlertDialog.Builder builder = new AlertDialog.Builder(bridge.getActivity());

                builder
                        .setTitle("Warning")
                        .setMessage("You have an old version of Android WebView installed, which will " +
                                "cause significant display issues on baseline since it's what we use to display the app. " +
                                "Click below to go to the Google Play Store and update 'Android System WebView' to fix this.")
                        .setPositiveButton("Open Play Store", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialogInterface, int i) {
                                try {
                                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + WEBVIEW_PACKAGE)));
                                } catch (android.content.ActivityNotFoundException e) {
                                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=" + WEBVIEW_PACKAGE)));
                                }
                            }
                        })
                        .setNegativeButton("Ignore Forever", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialogInterface, int i) {
                                prefs.edit().putBoolean("hideWarning", true).apply();
                            }
                        })
                        .setCancelable(false)
                        .show()
                        .setCanceledOnTouchOutside(false);
            }
        }
     }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        if (getResources().getBoolean(R.bool.portrait_only)) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        }
    }
}
