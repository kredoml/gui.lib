
import { UIState } from '/js/gui/UIState.js'
import { ResizableGrid } from '/js/gui/ResizableGrid.js'
import { InJectX, Integration, Mouse } from '/js/injectx/InJectX.js'

function initGrid() {
    let stub = window.document.getElementById("stub").innerHTML
    window.document.getElementById("test").innerHTML = stub.replaceAll('$', '')
}

InJectX.add(Integration.test("saveState", "/tests/gui/resources/resizable.grid.html", async (assert) => {
    initGrid()
    let resizer = window.document.getElementById("verticalResizerLeft")
    
    let resizerRect = resizer.getBoundingClientRect()
    
    let storage = {}
    let state = new UIState(storage)
    new ResizableGrid(window.document, "editorGrid", state)
    
    let resizerRectStart = resizer.getBoundingClientRect()
    
    assert.equals(resizerRect.left, resizerRectStart.left)
    
    let mouse = new Mouse(resizer)
    mouse.downLeftButton()
    mouse.moveTo(mouse.cursorPosition().right(100).bottom(10))
    mouse.upLeftButton()
    
    let resizerRectChange = resizer.getBoundingClientRect()
    assert.notEquals(resizerRectStart.left, resizerRectChange.left)
    
    initGrid()
    resizer = window.document.getElementById("verticalResizerLeft")
    
    let resizerRectRestart = resizer.getBoundingClientRect()
    
    assert.equals(resizerRectStart.left, resizerRectRestart.left)
    
    new ResizableGrid(window.document, "editorGrid", state)
    
    let resizerRectReinit = resizer.getBoundingClientRect()
    
    assert.equals(resizerRectChange.left, resizerRectReinit.left)
}))

InJectX.add(Integration.test("verticalResize", "/tests/gui/resources/resizable.grid.html", (assert) => {
    initGrid()
    
    let state = new UIState((state, key, val) => {})
    new ResizableGrid(window.document, "editorGrid", state)
        
    let resizer = window.document.getElementById("verticalResizerLeft")
    let resizerRectStart = resizer.getBoundingClientRect()
    
    let mouse = new Mouse(resizer)
    mouse.downLeftButton()
    mouse.moveTo(mouse.cursorPosition().right(100).bottom(10))
    
    let resizerRectRight = resizer.getBoundingClientRect()
    assert.equals(resizerRectRight.left - resizerRectStart.left, 100)
    assert.equals(resizerRectRight.top - resizerRectStart.top, 0)
    
    mouse.moveTo(mouse.cursorPosition().left(50).top(5))
    
    let resizerRectLeft = resizer.getBoundingClientRect()
    assert.equals(resizerRectLeft.left - resizerRectStart.left, 50)
    assert.equals(resizerRectLeft.top - resizerRectStart.top, 0)
    
    mouse.upLeftButton()
    
    assert.equals(resizerRectLeft.left - resizerRectStart.left, 50)
    assert.equals(resizerRectLeft.top - resizerRectStart.top, 0)
}))

InJectX.add(Integration.test("horizontalResize", "/tests/gui/resources/resizable.grid.html", (assert) => {
    initGrid()
    
    let state = new UIState((state, key, val) => {})
    new ResizableGrid(window.document, "editorGrid", state)
        
    let resizer = window.document.getElementById("horizontalResizer")
    let resizerRectStart = resizer.getBoundingClientRect()
    
    let mouse = new Mouse(resizer)
    mouse.downLeftButton()
    mouse.moveTo(mouse.cursorPosition().right(10).bottom(30))
    
    let resizerRectRight = resizer.getBoundingClientRect()
    assert.equals(resizerRectRight.left - resizerRectStart.left, 0)
    assert.equals(resizerRectRight.top - resizerRectStart.top, 30)
    
     mouse.moveTo(mouse.cursorPosition().left(10).top(15))
    
    let resizerRectLeft = resizer.getBoundingClientRect()
    assert.equals(resizerRectLeft.left - resizerRectStart.left, 0)
    assert.equals(resizerRectLeft.top - resizerRectStart.top, 15)
    
    mouse.upLeftButton()
    
    assert.equals(resizerRectLeft.left - resizerRectStart.left, 0)
    assert.equals(resizerRectLeft.top - resizerRectStart.top, 15)
}))

