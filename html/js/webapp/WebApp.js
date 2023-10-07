
class ConsoleLogger {
	static info(message) { console.log(message) }
	static err(error) { console.error(error) }
}

class LocalStorage { 
	
	constructor(wndw, uniq) {
		try {
			this.__ls = wndw.localStorage
			this.__ls.setItem("test", "_")
			this.__ls.removeItem("test")
		} catch(e) {
			this.__ls = {}
		}
		this.__uniq = uniq
	}
	
	get = (key, defaultValue) => this.__appKey(key) in this.__ls ? this.__ls[this.__appKey(key)] : defaultValue
	
	set = (key, value) => this.__ls[this.__appKey(key)] = value
	
	setObj = (key, obj) => this.set(key, JSON.stringify(obj))
	
	getObj = (key, defaultValue) => this.__appKey(key) in this.__ls ? JSON.parse(this.__ls[this.__appKey(key)]) : defaultValue 
	
	clear() {
        Object.keys(localStorage).forEach(k => {
            if(k.startsWith(this.__uniq)) this.__ls.removeItem(k)
        })
    }
	
	__appKey = (key) => this.__uniq + "." + key
}

class Resource {
	constructor(url) {
		this.url = url
		this.type = this.url.split(".").at(-1)
		this.data = null
		this.error = null
	}
}

class Resources {
    constructor(localStorage, ...loaders) {
        this.__state = {}
        loaders.forEach(cls => this.__state[cls.type] = {loader: new cls(localStorage), items: []})
    }
    
    add(res) { this.__state[res.type].items.push(res) }
    
    load(doc) {
        let loads = []
        Object.entries(this.__state).forEach(([_, v] = el) => loads.push(...v.loader.load(v.items, doc)))
        return loads
    }
}

class Loader {
    constructor(storage) {
        this.__storage = storage
    }
    
    _load(res, callback) {
        return res.url in this.__storage
            ? new Promise(resolve => resolve(JSON.parse(this.__storage.get(res.url))))
            : new Promise((resolve, reject) => {
                let xhr = new XMLHttpRequest()
                xhr.open("GET", res.url)
                let ok = () => {
                    res.data = xhr.responseText
                    callback(res)
                    resolve(res)
                }
                let err = () => {
                    res.error = JSON.stringify(xhr)
                    reject(res)
                }
                xhr.onload = () => xhr.status === 200 ? ok(xhr) : err(xhr)
                xhr.send()
            })
    }
}

class HtmlLoader extends Loader {
    static type = "html"
    
    load = (resources, doc) => resources.map(res => this._load(res, res => {}))
}

class JsLoader extends Loader {
    static type = "js"
    
    load = (resources, doc) => resources.map(res => this.eval(doc, res))
    
    eval = (doc, res) => this._load(res, res => this.__addScript(doc, script => script.text = res.data))
    
    __addScript(document, callback) {
        let script = document.createElement("script")
        callback(script)
        document.body.appendChild(script)
    }
}

class JsLoaderDebug extends JsLoader {
    load = (resources, doc) => resources.map(res => this.import(doc, res))
    
    import(doc, res) {
        return new Promise((resolve, reject) => {
            this.__addScript(doc, script => {
                script.setAttribute("src", res.url + "?" + Date.now())
                script.addEventListener("load", resolve)
                script.addEventListener("error", reject)
            })
        })
    }
}

class WebApp {
    constructor(window, activityContainerId, logger, debugMode) {
        this.window = window
        this.localStorage = new LocalStorage(window, activityContainerId)
        this.view = new View(window, activityContainerId)
        this.__logger = logger
        this.__resources = new Resources(this.localStorage, HtmlLoader, debugMode ? JsLoaderDebug : JsLoader)
	}
	
	onCreate() {}
	
	setResources = (path, ...args) => args.forEach(link => this.__resources.add(new Resource(path + link)))
	
	getTemplate = (pathToTemplate) => this.localStorage.getObj(pathToTemplate, null).data
	
	getLastActivityClass = () => Function("return " + this.localStorage.get("currentActivityName"))()
	
	create(version) {
        if(version != this.localStorage.get("version")) this.localStorage.clear()
        Promise.all(this.__resources.load(this.window.document))
        .then(result => {
            result.map(res => this.localStorage.setObj(res.url, res))
            this.localStorage.set("version", version)
            this.onCreate()
        })
        .catch(result => this.__logger.err(result + ": " + result.error))
		return this
	}
	
	initActivity(activityClass, params) {
		try {
			this.localStorage.set("currentActivityName", activityClass.name)
			new activityClass(this).onCreate(params)
			this.window.dispatchEvent(new Event("activity" + activityClass.name))
		} catch(exc) {
			this.__logger.err("activityName: " + activityClass.name + "\n" + exc.stack)
		}
	}
}

class Activity {
	
	constructor(application) {
		this.app = application
	}
	
	onCreate() {}
	
	switchActivity(activityClass, params) { this.app.initActivity(activityClass, params) }
}

class View {
	
	constructor(window, contentId) {
		this.__window = window
		this.__content = this.findElement(contentId)
	}
	
	appendContent(html) { this.__content.innerHTML += html }
	
	setContent(html) { this.__content.innerHTML = html }
	
	appendElement(id, html) { this.findElement(id).innerHTML += html }
	
	setElement(id, html) { this.findElement(id).innerHTML = html }
	
	findElement(id) { return this.__window.document.getElementById(id) }
	
	hideElement(id) { this.findElement(id).style.display = "none" }
	
	showElement(id) { this.findElement(id).style.display = "block" }
	
	formatElement(id, params) { return this.findElement(id).innerHTML.replace(/{(\w*)}/g, (_, key) => params[key]) }
}

