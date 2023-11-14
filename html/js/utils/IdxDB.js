
export class IdxDB {
    
    constructor(wndw, dbName, storeName) {
        const request = wndw.indexedDB.open(dbName)
        request.onupgradeneeded = () => request.result.createObjectStore(storeName)
        const dbp = this.__pr(request)
        this.rStore = (callback) => dbp.then((db) => callback(db.transaction(storeName, 'readonly').objectStore(storeName)))
        this.rwStore = (callback) => dbp.then((db) => callback(db.transaction(storeName, 'readwrite').objectStore(storeName)))
    }
    
    __pr(request) {
        return new Promise((resolve, reject) => {
            request.oncomplete = request.onsuccess = () => resolve(request.result)
            request.onabort = request.onerror = () => reject(request.error)
        })
    }
    
    get(key) {
        return this.rStore((store) => this.__pr(store.get(key)))
    }
    
    set(key, value) {
        return this.rwStore((store) => {
            store.put(value, key)
            return this.__pr(store.transaction)
        })
    }
    
    setMany(entries) {
        return this.rwStore((store) => {
            entries.forEach((entry) => store.put(entry[1], entry[0]))
            return this.__pr(store.transaction)
        })
    }
    
    getMany(keys) {
        return this.rStore((store) => Promise.all(keys.map((key) => this.__pr(store.get(key)))))
    }
    
    update(key, updater) {
        return this.rwStore((store) => 
        new Promise((resolve, reject) => {
            store.get(key).onsuccess = function () {
                try {
                    store.put(updater(this.result), key)
                    resolve(this.__pr(store.transaction))
                } catch(err) {
                    reject(err)
                }
            }
        }))
    }
    
    del(key) {
        return this.rwStore((store) => {
            store.delete(key)
            return this.__pr(store.transaction)
        })
    }
    
    clear() {
        return this.rwStore((store) => {
            store.clear()
            return this.__pr(store.transaction)
        })
    }
    
    keys() {
        const items = []
        return this.__eachCursor((cursor) => items.push(cursor.key)).then(() => items)
    }
    
    values() {
        const items = []
        return this.__eachCursor((cursor) => items.push(cursor.value)).then(() => items)
    }
    
    entries() {
        const items = []
        return this.__eachCursor((cursor) => items.push([cursor.key, cursor.value])).then(() => items)
    }
    
    __eachCursor(callback) {
        return this.rStore((store) => {
            store.openCursor().onsuccess = function () {
                if (!this.result) return
                callback(this.result)
                this.result.continue()
            }
            return this.__pr(store.transaction)
        })
    }
}