
InJectX.add(Integration.test("Utils.injectScript", "/tests/InJectXTests.html", (assert) => {
    assert.timeout(2000)
    let done = assert.async()
    let scriptUrl = "/tests/resources/StubScriptUrl.js"
    let onLoad = (ok) => {
        assert.true(StubScriptUrl.testCall())
        done()
    }
    let onError = (event) => {
        console.log(event)
        assert.fail("Script exists but can't be injected! ")
    }
    Utils.injectScript(window, scriptUrl, onLoad, onError)
}))

InJectX.add(Integration.test("Utils.inject404Script", "/tests/InJectXTests.html", (assert) => {
    assert.timeout(1000)
    let done = assert.async()
    let scriptUrl = "/tests/resources/StubScriptUrl404.js"
    let onLoad = () => assert.fail("Script doesn't exists but be injected!")
    let onError = () => done()
    Utils.injectScript(window, scriptUrl, onLoad, onError)
}))

InJectX.add(Integration.test("Utils.injectScriptWithErr", "/tests/InJectXTests.html", (assert) => {
    assert.timeout(1000)
    let done = assert.async(2)
    let scriptUrl = "/tests/resources/StubScriptUrlWithErr.js"
    let onLoad = (ok) => done()
    let onError = (err) => assert.fail("The file has syntax errors but it exists")
    window.addEventListener("error", (event) => done())
    Utils.injectScript(window, scriptUrl, onLoad, onError)
}))

InJectX.add(Unit.test("Suite.fromUrl", (assert) => {
    let url = "http://localhost:9922/tests/run.tests.html#/tests/TestSuite.js:test1,test2,testN"
    let suite = Suite.fromUrl(url)
    assert.equals(suite.suiteScript, "/tests/TestSuite.js")
    assert.equals(suite.testNames, ["test1", "test2", "testN"])
}))

InJectX.add(Unit.test("Utils.getScriptByName", (assert) => {
    let path = "/tests"
    let script = "InJectX.js"
    assert.true(Utils.getScriptPathByName(window, script).endsWith(`${path}/${script}`))
}))