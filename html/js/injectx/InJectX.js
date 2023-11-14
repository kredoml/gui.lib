
import { FileSystem, Path } from '/js/utils/FileSystem.js'

InJectXInit()
window.runTestsFromUrl = async function (){
    InJectX.setUp(() => Suite.fromUrl(window.document.URL, window).run())
}

window.runTestsFromDir = async function() {
    let fs = new FileSystem(window, window.document.URL)
    let suite = await Suite.fromDir(await fs.dir(new Path()), window)
    InJectX.setUp(() => suite.run())
}

function InJectXInit() {
    window.onload = () => Suite.fromUrl(window.document.URL, window).run()
    window.runInjectedTest = (suiteScript, testName, callback) => Suite.runInjectedTest(suiteScript, testName, callback)
}

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

export class InJectX {
    static __storage = {}
    static __imports = []
    static setUp = async function(runTests) {runTests()}

    static add(testObj) {
        let script = Utils.getCallerFile()
        if(!(script in InJectX.__storage)) InJectX.__storage[script] = {}
        InJectX.__storage[script][testObj.name] = testObj
    }
    static getTests(script, testNames) {
        if(Object.keys(InJectX.__storage).length == 0) return []
        return testNames.length == 0
            ? Object.values(InJectX.__storage[script] || {})
            : testNames.map(name =>  InJectX.__storage[script][name])
    }
    static getTest(script, testName) { return InJectX.__storage[script][testName] }
    static import(mod) { InJectX.__imports.push(mod) }
    static getImports() { return InJectX.__imports }
}

export class Suite {
    constructor(items, resultForm) {
        this.items = items
        this.resultForm = resultForm
    }
    
    run() {
        this.resultForm._init()
        this.items.forEach(item => {
            let script = item.script
            let testNames = item.testNames
            this.resultForm.addSuite(script)
            Utils.injectScript(window, script,
                ok  => {
                    try {
                        let setResult = (name, res, err) => this.resultForm.setResult(script, name, res, err)
                        InJectX.getTests(script, testNames).map(test => test.run(setResult, script))
                    } catch(e) {
                        console.log(e)
                        this.__errMsg(script, `${e}`)
                    }
                },
                err => this.__errMsg(script, `Can't import ${script}`)
            )
        })
    }
    
    __errMsg(script, errMsg) {
        this.resultForm.setResult(script, "exception", false, errMsg)
        throw new InJectXError(errMsg)
    }
    
    __interceptError(errorMsg, url, lineNumber) {
        let script = new URL(url).pathname
        if(!(script.endsWith('Test.js') || script.endsWith('Tests.js'))) return false
        this.__errMsg(script, `${errorMsg}`)
        return false
    }
    
    static runInjectedTest(suiteScript, testName, callback) {
        Utils.injectScript(window, suiteScript,
            ok => InJectX.getTest(suiteScript, testName).runInjectedTest(callback),
            err => callback(false, err)
        )
    }
    
    static fromUrl(url, wndw) {
        let items = []
        let urlParts = url.split("#")
        if(urlParts.length < 2) return new StubSuite()
        let anchor = urlParts[1]
        if(anchor === "InJectX") return new StubSuite()
        anchor.split(";").forEach(item => {
            let params = item.split(":");
            items.push({script: params[0], testNames: params.length == 2 ? params[1].split(",") : []})
        })
        return Suite.__createSuite(items, wndw)
    }
    
    static async fromDir(dir, wndw) {
        let items = []
        let ls = await dir.listRecursive()
        await ls.go(file => {
            if(file.name().endsWith('Test.js') || file.name().endsWith('Tests.js')) items.push({script: '/' + file.uniq(), testNames: []})
        }, _ => {})
        return Suite.__createSuite(items, wndw)
    }
    
    static __createSuite(items, wndw) {
        let suite = new Suite(items, new ResultsForm(wndw))
        wndw.onerror = (errorMsg, url, lineNumber) => suite.__interceptError(errorMsg, url, lineNumber)
        return suite
    }
}

class StubSuite extends Suite {
    run() {}
}

class ResultsForm {
  
    static __form = '<details id="{suite}" close><summary><span id="{suite}.res">__</span> | {suite}</summary><pre id="{suite}.InJectX_ERR" style="color: red;"></pre>\
            <pre id="{suite}.InJectX_OK" style="color: green;"></pre></details>';
        
    constructor(wndw) {
        this.__wndw = wndw
    }
    
    _init() {
        this.__wndw.document.getElementById("InJectXResults").innerHTML = ''
    }
    
    addSuite(suite) {
        this.__wndw.document.getElementById("InJectXResults").innerHTML += ResultsForm.__form.replaceAll('{suite}', suite)
    }
    
    ok(suite, name) {
        this.__wndw.document.getElementById(suite +".res").innerHTML = "OK"
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

export class Utils {
    
    static injectScript(wndw, scriptUrl, onLoad, onError) {
        let script = wndw.document.createElement("script")
        script.setAttribute("src", scriptUrl)
        script.setAttribute("type", "module")
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

export class Unit extends Test {
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

export class Integration extends Unit {
    constructor(name, url, body) {
        super(name, body)
        this.__url = url
    }
    
    static test(name, url, body) { return new Integration(name, url, body) }
    
    run(callback, suiteScript) {
        let wndw = window.open(this.__url + "#InJectX")
        wndw.addEventListener("load", () => {
            Utils.injectScript(wndw, import.meta.url,
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
    
    equalsArray(actual, expected) {}
    
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

export class Position {
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

export class Mouse {
    
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

