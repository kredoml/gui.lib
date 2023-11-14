
/*
<style>
    .ui-vertical-resizable-container {
        display: flex;
        width: 100%;
        height: 100%;
    }
    .ui-horizontal-resizable-container {
        flex-direction: column;
        display: flex;
        width: 100%;
        height: 100%;
    }
    .ui-vertical-resizer {
        background-color: #cbd5e0;
        cursor: ew-resize;
        height: 100%;
        width: 2px;
    }
    .ui-horizontal-resizer {
        background-color: #cbd5e0;
        cursor: ns-resize;
        width: 100%;
        height: 2px;
    }
    .ui-resizable-block {
        align-items: center;
        display: flex;
        justify-content: center;
        width: 100%;
        height: 100%;
    }
</style>

<div id="mainGrid" class="ui-vertical-resizable-container">
    <div class="ui-resizable-block" style="width: 25%;">left</div>
    <div class="ui-vertical-resizer"></div>
    <div class="ui-resizable-block" style="flex: 1;">
        <div class="ui-resizable-block" style="width: 70%;">
            <div class="ui-horizontal-resizable-container">
                <div class="ui-resizable-block" style="height: 75%;">top</div>
                <div class="ui-horizontal-resizer"></div>
                <div class="ui-resizable-block" style="flex: 1;">bottom</div>
            </div>
        </div>
        <div class="ui-vertical-resizer"></div>
        <div class="ui-resizable-block" style="flex: 1;">right</div>
    </div>
</div>

<script>
    new ResizableGrid(document, "mainGrid", new UIState({}))
</script>

*/

export class ResizableGrid {
    constructor(doc, id, state) {
        this.__id = id
        this.__state = state
        this.grid = doc.getElementById(id)
        this.__getEls("ui-vertical-resizer").forEach(el => new VerticalResizer(doc, el, this.__onResizeBlocks))
        this.__getEls("ui-horizontal-resizer").forEach(el => new HorizontalResizer(doc, el, this.__onResizeBlocks))
        this.__setState(this.__state.get(this.__id).get('sizes', []))
    }
    
    __setState(state) {
        if(state.length == 0) return
        this.__getAllBlocks().forEach((el, i) => {
            el.style["width"] = state[i].w
            el.style["height"] = state[i].h
        })
    }
    
    __getEls = (cls) => Array.from(this.grid.getElementsByClassName(cls))
    
    __onResizeBlocks = () => {
        let currentState = this.__getAllBlocks().map(el => ({w: el.style["width"], h: el.style["height"]}))
        this.__state.set(this.__id, 'sizes', currentState)
    }
    
    __getAllBlocks = () => this.__getEls("ui-resizable-block")
}

class Resizer {
    constructor(doc, resizer, onChange) {
        this.onResize = onChange
        this.doc = doc
        this.resizer = resizer
        this.resizableSide = this.resizer.previousElementSibling
        this.restSide = this.resizer.nextElementSibling
        this.coord = 0
        this.resizableSize = 0
        this.resizer.addEventListener("mousedown", this.mouseDownHandler)
    }
    
    mouseDownHandler = (event) => {
        this.coord = event[this._getAxis()]
        this.resizableSize = this.resizableSide.getBoundingClientRect()[this._getDimension()]
        this.doc.addEventListener("mousemove", this.mouseMoveHandler)
        this.doc.addEventListener("mouseup", this.mouseUpHandler)
    }
    
    mouseMoveHandler = (event) => {
        const dCoord = event[this._getAxis()] - this.coord
        const size = ((this.resizableSize + dCoord) * 100) / this.resizer.parentNode.getBoundingClientRect()[this._getDimension()]
        this.resizableSide.style[this._getDimension()] = `${size}%`
        this.__addProp("cursor", getComputedStyle(this.resizer).getPropertyValue("cursor"), this.resizer, this.doc.body)
        this.__addProp("userSelect", "none", this.resizableSide, this.restSide)
        this.__addProp("pointerEvents", "none", this.resizableSide, this.restSide)
    }

    mouseUpHandler = (event) => {
        this.__removeProp("cursor", this.resizer, this.doc.body)
        this.__removeProp("user-select", this.resizableSide, this.restSide)
        this.__removeProp("pointer-events", this.resizableSide, this.restSide)
        this.doc.removeEventListener("mousemove", this.mouseMoveHandler)
        this.doc.removeEventListener("mouseup", this.mouseUpHandler)
        this.onResize()
    }
    
    __addProp(name, value, ...els) { els.forEach(el => el.style[name] = value) }
    __removeProp(name, ...els) { els.forEach(el => el.style.removeProperty(name)) }
}

class HorizontalResizer extends Resizer {
    _getDimension() { return "height" }
    _getAxis() { return "clientY" }
}

class VerticalResizer extends Resizer {
    _getDimension() { return "width" }
    _getAxis() { return "clientX" }
}



