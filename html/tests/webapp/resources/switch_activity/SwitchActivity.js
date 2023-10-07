class SwitchActivity extends Activity {
    
    onCreate() {
        super.onCreate();
        this.app.view.setContent(this.app.getTemplate("/resources/switch_activity/SwitchActivity.template.html"));
    }
}