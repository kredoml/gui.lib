InJectX.add(AsyncUnit.test("AsyncUnit.injectScriptWithErr", (assert) => {
    assert.timeout(5000)
    assert.numberOfCompleted(2)
    let scriptUrl = "/js/injectx/tests/resources/StubScriptUrlWithErr.js"
    let onLoad = (ok) => assert.complete()
    let onError = (err) => assert.fail("The file has syntax errors but it exists")
    window.addEventListener("error", (event) => assert.complete())
    Utils.injectScript(window, scriptUrl, onLoad, onError)
}))

InJectX.add(AsyncUnit.test("AsyncUnit.complete", (assert) => {
    assert.timeout(5000)
    assert.numberOfCompleted(1)
    setTimeout(() => assert.complete(), 100)
}))

InJectX.add(AsyncUnit.test("AsyncUnit.equals", (assert) => {
    assert.equals(123, 123)
    assert.equals("abc", "abc")
    assert.equals(["abc", 123], ["abc", 123])
    
    let afterErr = false
    try {
        assert.equals(123, 321)
        afterErr = true
    } catch(err) {
        console.log(err)
    }
    assert.equals(afterErr, false)
}))

InJectX.add(AsyncUnit.test("AsyncUnit.asyncEquals", (assert) => {
    assert.timeout(5000)
    assert.numberOfCompleted(1)
    setTimeout(() => {
        console.log("zz1")
        assert.equals(123, 3211)
        assert.complete()
        console.log("zz1.1")
        }, 300)
    setTimeout(() => {
        console.log("zz2")
       assert.equals(123, 3212)
       console.log("zz2.1") 
    }, 200)
    setTimeout(() => {
        console.log("zz3")
        assert.equals(123, 3213)
        console.log("zz3.1")
    }, 100)
    setTimeout(() => {
        console.log("zz4")
        assert.complete()
        console.log("zz4.1")
    }, 3000)
    
}))

InJectX.add(AsyncUnit.test("AsyncUnit.true", (assert) => {
    assert.true(true)
    let afterErr = false
    try {
        assert.true(false)
        afterErr = true
    } catch(err) {
    }
    assert.equals(afterErr, false)
}))

InJectX.add(AsyncUnit.test("AsyncUnit.false", (assert) => {
    assert.false(false)
    let afterErr = false
    try {
        assert.false(true)
        afterErr = true
    } catch(err) {
    }
    assert.equals(afterErr, false)
    
}))

InJectX.add(AsyncUnit.test("AsyncUnit.fail", (assert) => {
    let afterErr = false
    try {
        assert.fail("")
        afterErr = true
    } catch(err) {
    }
    assert.equals(afterErr, false)
    
}))

InJectX.add(AsyncUnit.test("AsyncUnit.ok", (assert) => {
    assert.ok()
}))
