
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
    new ResizableGrid("mainGrid")
    new VerticalResizer(window.document, "leftResizer")
    new VerticalResizer(window.document, "rightResizer")
    new HorizontalResizer(window.document, "middleResizer")
</script>

*/

class MousePointer {
    constructor(event) {
        this.event = event
    }
    x = () => this.event.clientX
    y = () => this.event.clientY
}

class Resizer {
    constructor(doc, resizer, onResize) {
        this.onResize = onResize
        this.doc = doc
        this.resizer = resizer
        this.resizableSide = this.resizer.previousElementSibling
        this.restSide = this.resizer.nextElementSibling
        this.coord = 0
        this.resizableSize = 0
        this.resizer.addEventListener("mousedown", this.mouseDownHandler)
    }
    
    mouseDownHandler = (event) => {
        console.log("mouseDownHandler" + event.clientX + " : " + event.clientY)
        this.coord = event[this._getAxis()]
        this.resizableSize = this.resizableSide.getBoundingClientRect()[this._getDimension()]
        this.doc.addEventListener("mousemove", this.mouseMoveHandler)
        this.doc.addEventListener("mouseup", this.mouseUpHandler)
    }
    
    mouseMoveHandler = (event) => {
        //console.log(event[this._getAxis()])
        const dCoord = event[this._getAxis()] - this.coord
        const size = ((this.resizableSize + dCoord) * 100) / this.resizer.parentNode.getBoundingClientRect()[this._getDimension()]
        this.resizableSide.style[this._getDimension()] = `${size}%`
        this.__addProp("cursor", getComputedStyle(this.resizer).getPropertyValue("cursor"), this.resizer, this.doc.body)
        this.__addProp("userSelect", "none", this.resizableSide, this.restSide)
        this.__addProp("pointerEvents", "none", this.resizableSide, this.restSide)
    }

    mouseUpHandler = (event) => {
        console.log("mouseUpHandler" + event.clientX + " : " + event.clientY)
        this.__removeProp("cursor", this.resizer, this.doc.body)
        this.__removeProp("user-select", this.resizableSide, this.restSide)
        this.__removeProp("pointer-events", this.resizableSide, this.restSide)
        this.doc.removeEventListener("mousemove", this.mouseMoveHandler)
        this.doc.removeEventListener("mouseup", this.mouseUpHandler)
        this.onResize()
    }
    
    __addProp = (name, value, ...els) => els.forEach(el => el.style[name] = value)
    __removeProp = (name, ...els) => els.forEach(el => el.style.removeProperty(name))
}

class HorizontalResizer extends Resizer {
    _getDimension = () => "height"
    _getAxis = () => "clientY"
}

class VerticalResizer extends Resizer {
    _getDimension = () => "width"
    _getAxis = () => "clientX"
}

class ResizableGrid {
    constructor(doc, gridId, onResize) {
        this.onResize = onResize
        this.grid = doc.getElementById(gridId)
        this.__getEls("ui-vertical-resizer").forEach(el => new VerticalResizer(window.document, el, this.__onResizeBlocks))
        this.__getEls("ui-horizontal-resizer").forEach(el => new HorizontalResizer(window.document, el, this.__onResizeBlocks))
    }
    
    setState = (state) => this.__getAllBlocks().forEach((el, i) => {
        el.style["width"] = state[i].w
        el.style["height"] = state[i].h
    })
    
    __getEls = (cls) => Array.from(this.grid.getElementsByClassName(cls))
    
    __onResizeBlocks = () => this.onResize(this.__getAllBlocks().map(el => ({w: el.style["width"], h: el.style["height"]})))
    
    __getAllBlocks = () => this.__getEls("ui-resizable-block")
}

