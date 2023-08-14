
window.onload = () => Suite.fromUrl(window.document.URL, new TestEnv(window)).run()

runTest = (suiteScript, testName, callback) => Suite.runTest(suiteScript, testName, callback)

class InJectXError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}

class Test {
    constructor(name, body) {
        this.name = name
        this.body = body
    }
    
    run = (suite) => this.exec((result, error) => suite.testEnv.setResult(this.name, result, error))
    
    async exec(callback) {
        let assert = new Assert()
        try {
            this.body(assert)
            await assert._wait()
            callback(true, "")
        } catch (err) {
            console.log(err)
            callback(false, err.stack)
        }
    }
}

class Unit extends Test {
    constructor(name, body) {
        super(name, body)
    }
    
    static test = (name, body) => new Unit(name, body)
}

class Integration extends Test {
    constructor(name, url, body) {
        super(name, body)
        this.__url = url
    }
    
    static test = (name, url, body) => new Integration(name, url, body)
    
    run(suite) {
        let wndw = window.open(this.__url + "#InJectX")
        wndw.addEventListener("load", () => {
            Utils.injectScript(wndw, suite.testEnv.libInJectX(),
                (ok) => {
                    wndw.runTest(suite.suiteScript, this.name, (result, error) => {
                        wndw.document.title = wndw.document.title + " [" + this.name + "]"
                        if(result) wndw.close()
                        suite.testEnv.setResult(this.name, result, error)
                    })
                },
                (err) => {
                    console.log(err)
                }
            )
        }, false)
    }
}

class InJectX {
    static __storage = {}
    static add = (testObj) => InJectX.__storage[testObj.name] = testObj
    static getTests = (testNames) => {
        return testNames.length == 0
            ? Object.values(InJectX.__storage)
            : testNames.map(name =>  InJectX.__storage[name])
    }
    static getTest = (testName) => InJectX.__storage[testName]
}

class Suite {
    constructor(suiteScript, testNames, testEnv) {
        this.suiteScript = suiteScript
        this.testNames = testNames
        this.testEnv = testEnv
    }
    
    run() {
        Utils.injectScript(window, this.suiteScript,
            ok  => InJectX.getTests(this.testNames).map(testObj => testObj.run(this)),
            err => { throw new InJectXError(`Can't import ${this.suiteScript}`) }
        )
    }
    
    static runTest(suiteScript, testName, callback) {
        Utils.injectScript(window, suiteScript,
            (ok) => InJectX.getTest(testName).exec(callback),
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
    run = () => {}
}

class TestEnv {
    
    constructor(wndw) {
        this.__wndw = wndw
    }
    
    resultContainer = () => window.document.getElementById("InJectXResults")
    
    libInJectX = () => Utils.getScriptPathByName(this.__wndw, "InJectX.js")
    
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

class AssertionError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}

class Async {
    constructor(countOfWaitedCalls) {
        this.__count = countOfWaitedCalls == undefined ? 1 : countOfWaitedCalls
        this.__called = 0
        this.__resolve = () => {}
        this.__reject = () => {}
        this.__promise = null
    }
    
    run(delay) {
        this.__promise = new Promise((resolve, reject) => {
            this.__resolve = resolve
            this.__reject = reject
            setTimeout(() => resolve(), delay)
        })
        return () => { this.done() }
    }
    
    done() {
        this.__called += 1
        if(this.__called >= this.__count) this.__resolve()
    }
    
    fail(err) {
        this.__reject(err)
    }
    
    async check() {
        if(this.__promise != null) await this.__promise
        if(this.__called < this.__count) throw new AssertionError(`Expected ${this.__count} calls but found only ${this.__called}`)
    }
}

class StubAsync {
    check() {}
}

class Assert {
    constructor() {
        this.__delay = 0
        this.__async = new StubAsync()
    }
    
    equals(actual, expected) { if(actual.toString() !== expected.toString()) this.__msg(actual, expected) }
    
    false(param) { if(param) this.__msg(param, false) }
    
    true(param) { if(!param) this.__msg(param, true) }
    
    fail(msg) { this.__err(msg) }
    
    timeout = (delay) => this.__delay = delay
    
    async = (count) => {
        this.__async = new Async(count)
        return this.__async.run(this.__delay)
    }
    
    _wait = () => this.__async.check()
    
    __msg = (actual, expected) => this.__err(`expected [${expected}] but found [${actual}]`)
    
    __err = (msg) => {
        this.__async.fail(new AssertionError(msg))
        throw new AssertionError(msg)
    }
}





