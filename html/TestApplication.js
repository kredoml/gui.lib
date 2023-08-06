class TestLogger extends ConsoleLogger {
            
    static info(message) {
        super.info(message);
    }
    
    static err(error) {
        ConsoleLogger.err(error);
    }
}

class TestApplication extends WebApp {
    
    constructor(window, activityContainerId) {
        super(window, activityContainerId, TestLogger, true)
    }
    
    onCreate() {
        super.onCreate();
        this.initActivity(InitActivity);
    }
}