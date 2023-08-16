
InJectX.add(Integration.test("ResizableGrid.verticalResize", "/js/gui/tests/resources/resizable.grid/index.html", (assert) => {
    //assert.timeout(2000)
    //let done = assert.async()
    //window.onload = () => new ResizableGrid(window.document, "editorGrid", () => {})
    assert.fail("just wait")
}))

/*
QUnit.test("Init app", assert => {
    
    const newWindow = window.open("/resources/components/index.html")
    newWindow.focus()
    
    newWindow.addEventListener("readyToTests", () => {
        //let rGrid = new ResizableGrid(newWindow.document, "editorGrid", d => console.log(d))
        
        
        
        let resizer1 = newWindow.document.getElementById("resizer1")
        let rect = resizer1.getBoundingClientRect()
        
        resizer1.dispatchEvent(new MouseEvent("mousedown", {
            'view': newWindow,
            'bubbles': true,
            'cancelable': true,
            'clientX': 410,
            'clientY': 55}))
            
        resizer1.addEventListener("mousedown", () => {
            resizer1.dispatchEvent(new MouseEvent("mouseup", {
                'view': newWindow,
                'bubbles': true,
                'cancelable': true,
                'clientX': 411,
                'clientY': 56}))
        })
    }, true)
    
    assert.equal("11", "11")
    
    assert.timeout(1000);
    let done = assert.async()
    
    let newWindow = window.open("/index.html")
    
    newWindow.addEventListener("activityInitActivity", event => {
        let msg = newWindow.document.getElementById("testApp").innerText
        assert.equal(msg, "InitActivity.template.html")
        newWindow.close()
        done()
    }, true);
    
})
*/

