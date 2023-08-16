
InJectX.add(Integration.test("Integration.injectScript", "/js/injectx/tests/resources/InJectXTests.html", (assert) => {
    assert.timeout(1000)
    assert.numberOfCompleted(1)
    let scriptUrl = "/js/injectx/tests/resources/StubScriptUrl.js"
    let onLoad = (ok) => {
        assert.true(StubScriptUrl.testCall())
        assert.complete()
    }
    let onError = (event) => {
        assert.fail("Script exists but can't be injected! ")
    }
    Utils.injectScript(window, scriptUrl, onLoad, onError)
}))

InJectX.add(Integration.test("Integration.inject404Script", "/js/injectx/tests/resources/InJectXTests.html", (assert) => {
    assert.timeout(1000)
    assert.numberOfCompleted(1)
    let scriptUrl = "/js/injectx/tests/resources/StubScriptUrl404.js"
    let onLoad = () => assert.fail("Script doesn't exists but be injected!")
    let onError = () => {
        assert.complete()
    }
    Utils.injectScript(window, scriptUrl, onLoad, onError)
}))

InJectX.add(AsyncUnit.test("AsyncUnit.injectScriptWithErr", (assert) => {
    assert.timeout(5000)
    assert.numberOfCompleted(2)
    let scriptUrl = "/js/injectx/tests/resources/StubScriptUrlWithErr.js"
    let onLoad = (ok) => assert.complete()
    let onError = (err) => assert.fail("The file has syntax errors but it exists")
    window.addEventListener("error", (event) => assert.complete())
    Utils.injectScript(window, scriptUrl, onLoad, onError)
}))

InJectX.add(Unit.test("Suite.fromUrl", (assert) => {
    let url = "http://localhost:9922/tests/run.tests.html#/tests/TestSuite.js:test1,test2,testN"
    let suite = Suite.fromUrl(url)
    assert.equals(suite.suiteScript, "/tests/TestSuite.js")
    assert.equals(suite.testNames, ["test1", "test2", "testN"])
}))

InJectX.add(Unit.test("Utils.getScriptByName", (assert) => {
    let path = "/js/injectx"
    let script = "InJectX.js"
    assert.true(Utils.getScriptPathByName(window, script).endsWith(`${path}/${script}`))
}))


