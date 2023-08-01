
class ConsoleLogger {
	
	static info(message) {
		console.log(message);
	}
	
	static err(error) {
		console.error(error);
	}
}

class System {

	static load(url, callback) {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url);
		xhr.onload = () => callback(xhr);
		xhr.send();
	};

	static globalEval(document, jsText) {
		var script = document.createElement("script");
		script.setAttribute("id", "WebAppCode");
		script.text = jsText;
		document.getElementsByTagName("head")[0].appendChild(script);
	}
	
	static getClassByName(className) {
		return Function("return " + className)();
	}
}

class LocalStorage { 
	
	constructor(localStorage, uniq) {
		try {
			this.__localStorage = localStorage.localStorage;
			this.__localStorage.setItem("test", "_");
			this.__localStorage.removeItem("test");
		} catch(e) {
			this.__localStorage = {};
		}
		this.__uniq = uniq;
	}
	
	set(key, value) {
		this.__localStorage[this.__cnvToAppKey(key)] = value;
	}
	
	get(key, defaultValue) {
		let result = this.__localStorage[this.__cnvToAppKey(key)];
		console.log(result)
        return result == undefined ? defaultValue : result;
	}
	
	__cnvToAppKey(key) {
		return this.__uniq + "." + key
	}
}

class Resource {
	
	constructor(url) {
		this.url = url;
		this.data = null;
		this.error = null;
		this.status = null;
		this.isEval = this.url.slice(-".js".length) === ".js";
		this.uniq = "?" + (new Date()).getTime();
	}
	
	setUniq(newUniq) {
		this.uniq = newUniq;
	}
	
	static load(resource) {
		return new Promise((resolve, reject) => {
			System.load(resource.url + resource.uniq, (xhr) => {
				if (xhr.status === 200) {
			    	resource.data = xhr.responseText;
			    	resolve(resource);
			    } else {
			    	alert("load: " + xhr);
			    	resource.error = JSON.stringify(resource);
			    	resource.status = xhr.status;
			    	reject(resource);
			    }
			});
		});
	}
}

class WebApp {
	
	constructor(window, activityContainerId, logger) {
		this.window = window
		this.localStorage = new LocalStorage(window, activityContainerId)
		this.view = new View(window, activityContainerId)
		this._code = null
		this.__logger = logger
		this.__resources = []
	}
	
	onCreate() {}
	
	setResources(path) {
        Array.prototype.slice.call(arguments, 1).map(link => this.__resources.push(new Resource(path + link)))
    }
	
	getTemplate(pathToTemplate) {
		return JSON.parse(this.localStorage.get(pathToTemplate, null)).data; 
	}
	
	getLastActivityClass() {
		return System.getClassByName(this.localStorage.get("currentActivityName"));
	}
	
	create(version) {
		var localStorage = this.localStorage;
		console.log(this.__resources)
		Promise.all(this.__resources.map(res => {
			return version == localStorage.get("version", null) 
				? new Promise(resolve => resolve(JSON.parse(localStorage.get(res.url))))
				: Resource.load(res);
        }))
		.then(result => {
			result.map(res => localStorage.set(res.url, JSON.stringify(res)));
			var jsCode = result.map(resource => resource.isEval ? resource.data : "").join("\n")
			System.globalEval(this.window.document, jsCode);
			localStorage.set("version", version);
			this.onCreate();
		})
		.catch(result => this.__logger.err(result + ": " + result.status + ": " + result.error));
		return this;
	}
	
	initActivity(activityClass, params) {
		try {
			this.localStorage.set("currentActivityName", activityClass.name);
			new activityClass(this).onCreate(params);
			this.window.dispatchEvent(new Event("activity" + activityClass.name));
		} catch(exc) {
			this.__logger.err("activityName: " + activityClass.name + "\n" + exc.stack);
		}
	}
}

class Activity {
	
	constructor(application) {
		this.app = application;
	}
	
	onCreate() {}
	
	switchActivity(activityClass, params) {
		this.app.initActivity(activityClass, params);
	}
}

class View {
	
	constructor(window, contentId) {
		this.__window = window;
		this.__content = this.findElement(contentId);
	}
	
	appendContent(html) {
		this.__content.innerHTML += html;
	}
	
	setContent(html) {
		this.__content.innerHTML = html;
	}
	
	appendElement(id, html) {
		this.findElement(id).innerHTML += html;
	}
	
	setElement(id, html) {
		this.findElement(id).innerHTML = html;
	}
	
	findElement(id) {
		return this.__window.document.getElementById(id);
	}
	
	hideElement(id) {
		this.findElement(id).style.display = "none";
	}
	
	showElement(id) {
		this.findElement(id).style.display = "block";
	}
	
	formatElement(id, params) {
		return this.findElement(id).innerHTML.replace(/{(\w*)}/g, (m, key) => params[key]);
	}
}

