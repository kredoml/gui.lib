class InitActivity extends Activity {
    
    onCreate() {
        super.onCreate();
        this.app.view.setContent(this.app.getTemplate("/resources/init_app/InitActivity.template.html"));
        this.app.view.findElement("switchToAnotherActivity").addEventListener("click", () => {
            this.switchActivity(SwitchActivity, {});
        });
    }
}