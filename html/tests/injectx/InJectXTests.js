
import { InJectX, Integration, Unit, Utils, Suite } from '/js/injectx/InJectX.js'

InJectX.add(Integration.test("Integration.injectScript", "/tests/injectx/resources/InJectXTests.html", async (assert) => {
    let calls = assert.calls(1, 1000)
    let scriptUrl = "/tests/injectx/resources/StubScriptUrl.js"
    let onLoad = (ok) => {
        assert.true(testCall())
        calls.plusOne()
    }
    let onError = (event) => {
        assert.fail("Script exists but can't be injected! ")
    }
    Utils.injectScript(window, scriptUrl, onLoad, onError)
    await assert.all(calls)
}))

InJectX.add(Integration.test("Integration.inject404Script", "/js/injectx/tests/resources/InJectXTests.html", async (assert) => {
    let calls = assert.calls(1, 1000)
    let scriptUrl = "/js/injectx/tests/resources/StubScriptUrl404.js"
    let onLoad = () => assert.fail("Script doesn't exists but be injected!")
    let onError = () => {
        calls.plusOne()
    }
    Utils.injectScript(window, scriptUrl, onLoad, onError)
    await assert.all(calls)
}))

InJectX.add(Unit.test("Unit.injectScriptWithErr", async (assert) => {
    let calls = assert.calls(2, 5000)
    let scriptUrl = "/tests/injectx/resources/StubScriptUrlWithErr.js"
    let onLoad = (ok) => {calls.plusOne()}
    let onError = (err) => assert.fail("The file has syntax errors but it exists")
    window.addEventListener("error", (event) => {calls.plusOne()})
    Utils.injectScript(window, scriptUrl, onLoad, onError)
    await assert.all(calls)
}))

InJectX.add(Unit.test("Suite.fromUrl", (assert) => {
    let url = "http://localhost:9922/tests/run.tests.html#/tests/TestSuite1.js:test1,test2,testN;/tests/TestSuite2.js;/tests/TestSuite3.js:test4"
    let suite = Suite.fromUrl(url, window)
    assert.equals(suite.items[0].script, "/tests/TestSuite1.js")
    assert.equals(suite.items[0].testNames, ["test1", "test2", "testN"])
    assert.equals(suite.items[1].script, "/tests/TestSuite2.js")
    assert.equals(suite.items[1].testNames, [])
    assert.equals(suite.items[2].script, "/tests/TestSuite3.js")
    assert.equals(suite.items[2].testNames, ["test4"])
}))


