

class InJect {
    static storage = {}
    
    static test(name, url, test) {
        InJect.storage[name] = {"url": url, "test": test, "win": null}
    }
    
    static runTests() {
        let injectScript = window.document.getElementsByTagName("script")[0].src
        let currentUrl = window.document.URL
        let anchor = currentUrl.split("#")
        if(anchor.length < 2) return
        let [testClass, testNames] = InJect.__initTests(anchor[1])
        __injectScript(window, testClass,
            (ok) => {
                if(InJect.__resCnt() === null) return
                if(testNames.length == 0) testNames = Object.keys(InJect.storage)
                testNames.map(name => {
                    let win = window.open(InJect.storage[name].url)
                    InJect.storage[name].win = win
                    win.addEventListener("load", () => {
                        __injectScript(win, injectScript,
                            (ok) => {
                                win.runTest(testClass, name, (result, error) => {
                                    win.document.title = win.document.title + " [" + name + "]"
                                    if(result) win.close()
                                    InJect.setResult(name, result, error)
                                })
                            },
                            (err, a, b, c) => {
                                console.log(err, a, b, c)
                            }
                        )
                    }, false)
                })
            },
            (err) => {
                console.log(err)
            }
        )
    }
    
    static __initTests(anchor) {
        let testParams = anchor.split(":");
        let testClass = testParams[0]
        let testNames = testParams.length == 2 ? testParams[1].split(",") : []
        return [testClass, testNames]
    }
    
    static setResult(name, result, error) {
        if(!result) window.document.title = "ERRORS!"
        InJect.__resCnt().innerText += name + "\t" + (result ? "OK" : "ERROR") + "\t" + error + "\n"
    }
    
    static __resCnt() {
        return window.document.getElementById("InJectResults")
    }
}

function __injectScript(win, scriptUrl, onLoad, onError) {
    let script = win.document.createElement("script")
    script.setAttribute("src", scriptUrl + "?" + Date.now())
    script.addEventListener("load", onLoad)
    script.addEventListener("error", onError)
    win.document.body.appendChild(script)
}

function runTest(testClass, name, callback) {
    let result = true
    let error = ""
    __injectScript(window, testClass,
        (ok) => {
            try {
                InJect.storage[name].test(window)
            } catch (err) {
                result = false
                error = err.stack
                console.log(err)
            }
            callback(result, error)
        },
        (err) => {
            console.log(err)
        }
    )
}

window.onload = () => InJect.runTests()

class AssertionError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}

class Assert {
    static equals(actual, expected) { if(actual !== expected) throw new AssertionError(Assert.__msg(actual, expected)) }
    
    static false(param) { if(param) throw new AssertionError(Assert.__msg(param, false)) }
    
    static true(param) { if(!param) throw new AssertionError(Assert.__msg(param, true)) }
    
    static fail(msg) { throw new AssertionError(msg) }
    
    static __msg = (actual, expected) => `expected [${expected}] but found [${actual}]`
}
