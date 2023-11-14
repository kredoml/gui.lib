

class _Dict {
    constructor(dict) {
        this.dict = dict
    }
    
    get(key, deflt) {
        return key in this.dict ? this.dict[key] : deflt
    }
}

export class UIState {
    
    constructor(storage) {
        this.__storage = storage
        this.__onChange = (storage, key, value) => {}
    }
    
    get(componentId) {
        return new _Dict(componentId in this.__storage ? this.__storage[componentId] : {})
    }
    
    set(componentId, key, value) {
        if(!(componentId in this.__storage)) this.__storage[componentId] = {}
        this.__storage[componentId][key] = value
        this.__onChange(this.__storage, key, value)
    }
    
    onChange(callback) {
        this.__onChange = callback
        return this
    }
}


