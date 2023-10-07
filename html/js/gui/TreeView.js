
class TreeView {
    
    constructor(doc, id, data, state) {
        this.__doc = doc
        this.__id = id
        this.__data = data
        this.__state = state
        this.__index = {}
        this.__onSelect = _ => {}
        this.__onToggle = node => this.__state.set(this.__id, node.id(), node.isOpen())
    }
    
    draw() {
        const tree = '<ul class="tree">' + (new _El(this.__data, this.__state.get(this.__id), this.__index)).draw() + '</ul>'
        this.__doc.getElementById(this.__id).innerHTML = tree
        for(const [_, v] of Object.entries(this.__index)) v.activate(this.__doc, this.__onToggle, this.__onSelect)
        const state = this.__state.get(this.__id)
        this.__selected = this.__index[state.get("selected", this.__data.id)].data
    }
    
    selected() { return this.__selected }
    
    onSelect(callback) {
        this.__onSelect = node => {
            this.__selected = node
            this.__state.set(this.__id, "selected", node.id)
            callback(node)
        }
    }
    
    node(id) { return this.__index[id].active }
}

class _TreeObjActive {
    constructor(doc, el, onToggle, onSelect) {
        this.doc = doc
        this.el = el
        this._onToggle = onToggle
        this._onSelect = onSelect
    }
    
    init() {
        this._get("a").addEventListener("click", e => {
            this._onSelect(this.el.data)
            e.preventDefault()
        })
    }
    
    id() { return this.el.data.id }
    
    _get(tag) { return this.doc.getElementById(this.el.data.id).getElementsByTagName(tag)[0] }
    
    clickable() { return this._get("a") }
}

class _BranchActive extends _TreeObjActive {
    init() {
        super.init()
        this._get("details").addEventListener("toggle", _ => this._onToggle(this))
    }
    
    isOpen() { return this._get("details").open }
    
    togglable() { return this._get("summary") }
}

class _TreeObj {
    constructor(data, state, index) {
        this.data = data
        this.state = state
        this.index = index
        this.index[this.data.id] = this
        this.active = null
    }
    
    _el(content) {
        const id = 'id' in this.data ? 'id="' + this.data.id + '"' : ''
        return '<li ' + id + '>' + content + '</li>'
    }
    
    activate(doc, onToggle, onSelect) {
        this.active = new (this._active())(doc, this, onToggle, onSelect)
        this.active.init()
    }
    
    _active() { return _TreeObjActive }
}

class _El extends _TreeObj {
    draw() {
        const obj = 'children' in this.data ? new _Branch(this.data, this.state, this.index) : new _Least(this.data, this.state, this.index)
        return obj.draw()
    }
}

class _Branch extends _TreeObj {
    draw() {
        let children = ''
        for(const ch of this.data.children) children += (new _El(ch, this.state, this.index)).draw()
        const open = this.state.get(this.data.id, false) ? 'open' : ''
        return this._el('<details ' + open + '><summary><a>' + this.data.name + '</a></summary><ul>' + children + '</ul></details>')
    }
    
    _active() { return _BranchActive }
}

class _Least extends _TreeObj {
    draw() { return this._el('<a>' + this.data.name + '</a>') }
}


