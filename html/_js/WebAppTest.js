
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
        super(window, activityContainerId, TestLogger)
    }
    
    onCreate() {
        super.onCreate();
        this.initActivity(TestActivity);
    }
}

QUnit.test("Init app", assert => {
    assert.timeout(1000);
    let done = assert.async()
    
    let newWindow = window.open("/index.html")
    
    newWindow.addEventListener("activityInitActivity", event => {
        let msg = newWindow.document.getElementById("testApp").innerText
        assert.equal(msg, "InitActivity.template.html")
        newWindow.close()
        done()
    }, true);
})

QUnit.test("Switch activity", assert => {
    assert.timeout(1000);
    let done = assert.async()
    
    let newWindow = window.open("/index.html")
    
    newWindow.addEventListener("activityInitActivity", event => {
        newWindow.document.getElementById("switchToAnotherActivity").click()
    }, true);
    
    newWindow.addEventListener("activitySwitchActivity", event => {
        let msg = newWindow.document.getElementById("testApp").innerText
        assert.equal(msg, "SwitchActivity.template.html")
        newWindow.close()
        done()
    }, true);
})



