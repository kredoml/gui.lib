
window.onload = () => Suite.fromUrl(window.document.URL, new ResultsForm(window)).run()

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
    static __imports = []
    static add(testObj) {
        let script = Utils.getCallerFile()
        if(!(script in InJectX.__storage)) InJectX.__storage[script] = {}
        InJectX.__storage[script][testObj.name] = testObj
    }
    static getTests(script, testNames) {
        return testNames.length == 0
            ? Object.values(InJectX.__storage[script])
            : testNames.map(name =>  InJectX.__storage[script][name])
    }
    static getTest(script, testName) { return InJectX.__storage[script][testName] }
    static import(mod) { InJectX.__imports.push(mod) }
    static getImports() { return InJectX.__imports }
}

class Suite {
    constructor(items, resultForm) {
        this.items = items
        this.resultForm = resultForm
    }
    
    run() {
        this.items.forEach(item => {
            let script = item.script
            let testNames = item.testNames
            this.resultForm.addSuite(script)
            Utils.injectScript(window, script,
                ok  => {
                    let setResult = (name, res, err) => this.resultForm.setResult(script, name, res, err)
                    InJectX.getTests(script, testNames).map(test => test.run(setResult, script))
                },
                err => {
                    const errMsg = `Can't import ${script}`
                    this.resultForm.setResult(script, "exception", false, errMsg)
                    throw new InJectXError(errMsg)
                }
            )
        })
    }
    
    static runInjectedTest(suiteScript, testName, callback) {
        Utils.injectScript(window, suiteScript,
            ok => InJectX.getTest(suiteScript, testName).runInjectedTest(callback),
            err => callback(false, err)
        )
    }
    
    static fromUrl(url, resultForm) {
        let items = []
        let urlParts = url.split("#")
        if(urlParts.length < 2) throw new InJectXError(`Can't find any params in ${url}`)
        let anchor = urlParts[1]
        if(anchor === "InJectX") return new StubSuite()
        anchor.split(";").forEach(item => {
            let params = item.split(":");
            items.push({script: params[0], testNames: params.length == 2 ? params[1].split(",") : []})
        })
        return new Suite(items, resultForm)
    }
}

class StubSuite extends Suite {
    run() {}
}

class ResultsForm {
  
    static __form = '<details id="{suite}" close><summary><span id="{suite}.res">OK</span> | {suite}</summary><pre id="{suite}.InJectX_ERR" style="color: red;"></pre>\
            <pre id="{suite}.InJectX_OK" style="color: green;"></pre></details>';
        
    constructor(wndw) {
        this.__wndw = wndw
    }
    
    addSuite(suite) {
        this.__wndw.document.getElementById("InJectXResults").innerHTML += ResultsForm.__form.replaceAll('{suite}', suite)
    }
    
    ok(suite, name) {
        this.__wndw.document.getElementById(suite + ".InJectX_OK").innerHTML += "OK\t" + name + "\n"
    }
    
    err(suite, name, error) {
        const errLink = '<a target=”_blank” href="' + new URL(this.__wndw.document.URL).pathname + "#" + suite + ":" + name + '">' + name + '</a>'
        this.__wndw.document.getElementById(suite + ".InJectX_ERR").innerHTML += "ERROR\t" + errLink + "\t" + error + "\n"
        this.__wndw.document.getElementById(suite).open = true
        this.__wndw.document.getElementById(suite +".res").innerHTML = "ERROR"
    }
    
    setResult(suite, test, result, error) {
        if(!result) this.__wndw.document.title = "ERRORS!"
        result ? this.ok(suite, test) : this.err(suite, test, error)
    }
}

class Utils {
    
    static getScriptPathByName(wndw, scriptName) {
        let allFoundScripts = []
        for(let el of Array.from(wndw.document.getElementsByTagName("script"))) {
            if(el.src.indexOf(scriptName) >= 0) return el.src.split("?")[0]
            allFoundScripts.push(el.src)
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
    
    static getCallerFile() {
        var originalFunc = Error.prepareStackTrace;
        var callerfile;
        try {
            var err = new Error();
            var currentfile;
            Error.prepareStackTrace = function (err, stack) { return stack; };
            currentfile = err.stack.shift().getFileName();
            while (err.stack.length) {
                callerfile = err.stack.shift().getFileName();
                if(currentfile !== callerfile) break;
            }
        } catch (e) {}
        Error.prepareStackTrace = originalFunc; 
        return new URL(callerfile).pathname;
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
    
    async run(callback) {
        try {
            let assert = new Assert()
            await this.body(assert)
            assert._checkAsserts()
            callback(this.name, true, "")
        } catch (err) {
            callback(this.name, false, err.stack)
        }
    }
}

class Integration extends Unit {
    constructor(name, url, body) {
        super(name, body)
        this.__url = url
    }
    
    static test(name, url, body) { return new Integration(name, url, body) }
    
    run(callback, suiteScript) {
        let wndw = window.open(this.__url + "#InJectX")
        wndw.addEventListener("load", () => {
            Utils.injectScript(wndw, Utils.getScriptPathByName(window, "InJectX.js"),
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
    
    notEquals(actual, expected) { this.__assertion(actual.toString() === expected.toString(), actual, expected) }
    
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
    
    calls(count, timeout) {
        return new Calls(count, timeout)
    }
    
    all(calls) {
        this.ok()
        return calls.forAllEvents()
    }
}

class Calls {
    constructor(count, timeout) {
        this.__numberOfCompleted = count
        this.__reallyCompleted = 0
        this.__resolve = null
        this.__reject = null
        this.__timeoutId = null
        this.__promise = new Promise((resolve, reject) => {
            this.__resolve = resolve
            this.__reject = reject
            this.__timeoutId = setTimeout(() => this.__err(), timeout)
        })
    }
    
    __end() {
        clearTimeout(this.__timeoutId)
        this.__resolve()
    }
    
    __err() {
        let msg = `Expected ${this.__numberOfCompleted} calls "plusOne" but found only ${this.__reallyCompleted}`
        this.__reject(new AssertionError(msg))
    }
    
    plusOne() {
        this.__reallyCompleted += 1
        if(this.__reallyCompleted == this.__numberOfCompleted) this.__end()
    }
    
    forAllEvents() {
        return this.__promise
    }
}

class Position {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
    
    x(x) { 
        this.x = x
        return this
    }
    
    y(y) {
        this.y = y
        return this
    }
    
    left(x) {
        this.x -= x
        return this
    }
    right(x) {
        this.x += x
        return this
    }
    top(y) {
        this.y -= y
        return this
    }
    bottom(y) {
        this.y += y
        return this
    }
    
    clone() {
        return new Position(this.x, this.y)
    }
}
class Mouse {
    
    constructor(element) {
        this.__el = element
        let rect = this.__el.getBoundingClientRect()
        this.__pos = new Position((rect.left + rect.right)/2, (rect.top + rect.bottom)/2)
    }
    
    downLeftButton() {
        this.__dispatch("mousedown")
    }
    
    upLeftButton() {
        this.__dispatch("mouseup")
    }
    
    moveTo(position) {
        this.__pos = position
        this.__dispatch("mousemove")
    }
    
    cursorPosition() {
        return this.__pos.clone()
    }
    
    __dispatch(type) {
        this.__el.dispatchEvent(new MouseEvent(type, {
            'bubbles': true,
            'cancelable': true,
            'clientX': this.__pos.x,
            'clientY': this.__pos.y}))
    }
    
    click() {
        this.__el.click()
    }
}


/*

class AsyncUnit extends Unit {
    constructor(name, body) {
        super(name, body)
    }
    
    static test(name, body) { return new AsyncUnit(name, body) }
    
    async run(callback) {
        let assert = new AsyncAssert()
        try {
            await this.body(assert)
            await assert._wait()
            assert._checkAsserts()
            assert._checkComplete()
            callback(this.name, true, "")
        } catch (err) {
            callback(this.name, false, err.stack)
        }
    }
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

*/

