package app.getbaseline.baseline;

import android.content.res.Configuration;
import android.webkit.WebSettings;

import android.content.pm.ActivityInfo;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onStart() {
        super.onStart();
        int nightModeFlags = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        WebSettings webSettings = this.bridge.getWebView().getSettings();
        if (nightModeFlags == Configuration.UI_MODE_NIGHT_YES && android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            webSettings.setForceDark(WebSettings.FORCE_DARK_ON);
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
