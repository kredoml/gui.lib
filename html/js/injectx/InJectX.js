
window.onload = () => Suite.fromUrl(window.document.URL, new TestEnv(window)).run()

runInjectedTest = (suiteScript, testName, callback) => Suite.runInjectedTest(suiteScript, testName, callback)

class InJectXError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}


class AssertionError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}

class InJectX {
    static __storage = {}
    static add(testObj) { InJectX.__storage[testObj.name] = testObj }
    static getTests(testNames) {
        return testNames.length == 0
            ? Object.values(InJectX.__storage)
            : testNames.map(name =>  InJectX.__storage[name])
    }
    static getTest(testName) { return InJectX.__storage[testName] }
}

class Suite {runTest
    constructor(suiteScript, testNames, testEnv) {
        this.suiteScript = suiteScript
        this.testNames = testNames
        this.testEnv = testEnv
    }
    
    run() {
        let setResult = (name, res, err) => this.testEnv.setResult(name, res, err)
        Utils.injectScript(window, this.suiteScript,
            ok  => InJectX.getTests(this.testNames).map(test => test.run(setResult, this.suiteScript)),
            err => { throw new InJectXError(`Can't import ${this.suiteScript}`) }
        )
    }
    
    static runInjectedTest(suiteScript, testName, callback) {
        Utils.injectScript(window, suiteScript,
            (ok) => InJectX.getTest(testName).runInjectedTest(callback),
            (err) => callback(false, err)
        )
    }
    
    static fromUrl(url, testEnv) {
        let urlParts = url.split("#")
        if(urlParts.length < 2) throw new InJectXError(`Can't find any params in ${url}`)
        let anchor = urlParts[1]
        if(anchor === "InJectX") return new StubSuite()
        let params = anchor.split(":");
        let suiteScript = params[0]
        let testNames = params.length == 2 ? params[1].split(",") : []
        return new Suite(suiteScript, testNames, testEnv)
    }
}

class StubSuite extends Suite {
    run() {}
}

class TestEnv {
    
    constructor(wndw) {
        this.__wndw = wndw
    }
    
    resultContainer() { return window.document.getElementById("InJectXResults") }
    
    libInJectX() { return Utils.getScriptPathByName(this.__wndw, "InJectX.js") }
    
    setResult(name, result, error) {
        if(!result) this.__wndw.document.title = "ERRORS!"
        this.resultContainer().innerText += (result ? "OK" : "ERROR") + "\t" + name + "\t" + error + "\n"
    }
    
    checkEnv() {
        if(this.resultContainer() === null) throw new InJectXError(`Can't find result block id "InJectXResults"`)
    }
}

class Utils {
    
    static getScriptPathByName(wndw, scriptName) {
        let allFoundScripts = []
        for(let el of Array.from(wndw.document.getElementsByTagName("script"))) {
            if(el.src.endsWith(scriptName)) return el.src
            allFoundScripts.push(el)
        }
        throw new InJectXError(`Can't found script ${scriptName} in ${allFoundScripts}`)
    }
    
    static injectScript(wndw, scriptUrl, onLoad, onError) {
        let script = wndw.document.createElement("script")
        script.setAttribute("src", scriptUrl + "?" + Date.now())
        script.addEventListener("load", onLoad)
        script.addEventListener("error", onError)
        wndw.document.body.appendChild(script)
    }

}

class Test {
    constructor(name, body) {
        this.name = name
        this.body = body
    }
}

class Unit extends Test {
    constructor(name, body) {
        super(name, body)
    }
    
    static test(name, body) { return new Unit(name, body) }
    
    run(callback) {
        console.log("UNIT run", this.name)
        try {
            let assert = new Assert()
            this.body(assert)
            assert._checkAsserts()
            callback(this.name, true, "")
        } catch (err) {
            callback(this.name, false, err.stack)
        }
    }
}

class AsyncUnit extends Unit {
    constructor(name, body) {
        super(name, body)
    }
    
    static test(name, body) { return new AsyncUnit(name, body) }
    
    async run(callback) {
        console.log("ASYNC UNIT run 1", this.name)
        console.log(callback)
        let assert = new AsyncAssert()
        try {
            this.body(assert)
            console.log("ASYNC UNIT run 2")
            await assert._wait()
            console.log("ASYNC UNIT run 3")
            assert._checkAsserts()
            console.log("ASYNC UNIT run 4")
            assert._checkComplete()
            console.log("ASYNC UNIT run 5")
            callback(this.name, true, "")
        } catch (err) {
            console.log("ASYNC UNIT err 1")
            callback(this.name, false, err.stack)
            console.log("ASYNC UNIT err 2")
        }
    }
}

class Integration extends AsyncUnit {
    constructor(name, url, body) {
        super(name, body)
        this.__url = url
    }
    
    static test(name, url, body) { return new Integration(name, url, body) }
    
    run(callback, suiteScript) {
        console.log("INTEGRATION UNIT run 1", this.name)
        let wndw = window.open(this.__url + "#InJectX")
        wndw.addEventListener("load", () => {
            Utils.injectScript(wndw, new TestEnv(window).libInJectX(),
                (ok) => {
                    wndw.runInjectedTest(suiteScript, this.name, (name, result, error) => {
                        wndw.document.title = wndw.document.title + " [" + this.name + "]"
                        if(result) wndw.close()
                        callback(name, result, error)
                    })
                },
                (err) => {
                    console.log(err)
                }
            )
        }, false)
    }
    
    runInjectedTest(callback) {
        super.run(callback)
    }
}

class Assert {
    constructor() {
        this._assertCount = 0
    }
    
    equals(actual, expected) { this.__assertion(actual.toString() !== expected.toString(), actual, expected) }
    
    false(param) { this.__assertion(param, param, false) }
    
    true(param) { this.__assertion(!param, param, true) }
    
    fail(msg) { this._err(msg) }
    
    ok() { this.true(true) }
    
    __assertion(fail, actual, expected) {
        if(fail) {
            this.__msg(actual, expected)
        } else {
            this._assertCount += 1
        }
    }
    
    __msg(actual, expected) { this._err(`expected [${expected}] but found [${actual}]`) }
    
    _err(msg) { throw new AssertionError(msg) }
    
    _checkAsserts() { if(this._assertCount == 0) this._err("No assert was called") }
}

class AsyncAssert extends Assert {
    
    constructor() {
        super()
        this.__delay = 0
        this.__numberOfCompleted = 0
        this.__reallyCompleted = 0
        this.__resolve = () => {}
        this.__reject = () => {}
    }
    
    timeout(delay) { this.__delay = delay }
    
    numberOfCompleted(number) {
        this.__numberOfCompleted = number
        this.__promise = new Promise((resolve, reject) => {
            this.__resolve = resolve
            this.__reject = reject
            setTimeout(() => resolve(), this.__delay)
        })
    }
    
    complete() {
        this.ok()
        this.__reallyCompleted += 1
        if(this.__numberOfCompleted == this.__reallyCompleted) this.__resolve()
    }
    
    _wait() { return this.__promise }
    
    _checkComplete() {
        if(this.__numberOfCompleted > this.__reallyCompleted) {
            this._err(`Expected ${this.__numberOfCompleted} calls "complete" but found only ${this.__reallyCompleted}`)
        }
    }
    
    _err(msg) {
        let err = new AssertionError(msg)
        this.__reject(err)
        throw err
    }
}
