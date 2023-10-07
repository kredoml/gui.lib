
InJectX.add(Integration.test("TreeView.generate", "/tests/gui/resources/tree.view.html", (assert) => {
    let treeViewGenerateData = {
        "id": "id1",
        "name": "Solar system",
        "children": [{
            "id": "id2",
            "name": "Giant planets",
            "children": [
                {"name": "Gas giants",
                "id": "id3",
                "children": [
                    {"id": "id3.1", "name": "Jupiter"},
                    {"id": "id3.2", "name": "Saturn"}]},
                {"id": "id4",
                "name": "Ice giants",
                "children": [
                    {"id": "id4.1", "name": "Uranus"},
                    {"id": "id4.2", "name": "Neptune"}]
                }]},
        {"name": "Small planets",
        "id": "id5",
        "children": [
            {"id": "id5.1", "name": "Earth"},
            {"id": "id5.2", "name": "Mars"}]}]}
    
    let state = new UIState({})
    let tree = new TreeView(window.document, "treeView", treeViewGenerateData, state)
    tree.draw()
    
    let actual = document.getElementById("treeView").innerHTML.replace(/>\s+</g,'><').trim()
    let expected = document.getElementById("expected").innerHTML.replace(/>\s+</g,'><').trim()
    
    assert.equals(actual, expected)
    
}))

InJectX.add(Integration.test("TreeView.openClose", "/tests/gui/resources/tree.view.html", (assert) => {
    let treeViewOpenCloseData = {
        "id": "id1",
        "name": "Solar system",
        "children": [{
            "id": "id2",
            "name": "Giant planets",
            "children": [
                {"name": "Gas giants",
                "id": "testClosed",
                "children": [
                    {"id": "id3.1", "name": "Jupiter"},
                    {"id": "id3.2", "name": "Saturn"}]},
                {"id": "id4",
                "name": "Ice giants",
                "children": [
                    {"id": "id4.1", "name": "Uranus"},
                    {"id": "id4.2", "name": "Neptune"}]
                }]},
        {"name": "Small planets",
        "id": "id5",
        "children": [
            {"id": "id5.1", "name": "Earth"},
            {"id": "id5.2", "name": "Mars"}]}]}
    
    let state = new UIState({})
    let tree = new TreeView(window.document, "treeView", treeViewOpenCloseData, state)
    tree.draw()
    
    let closedEl = tree.node("testClosed")
    let mouse = new Mouse(closedEl.togglable())
    assert.false(closedEl.isOpen())
    mouse.click()
    assert.true(closedEl.isOpen())
    mouse.click()
    assert.false(closedEl.isOpen())
}))

InJectX.add(Integration.test("TreeView.saveState", "/tests/gui/resources/tree.view.html", async (assert) => {
    let treeViewSaveStateData = {
        "id": "id1",
        "name": "Solar system",
        "children": [{
            "id": "id2",
            "name": "Giant planets",
            "children": [
                {"name": "Gas giants",
                "id": "id3",
                "children": [
                    {"id": "id3.1", "name": "Jupiter"},
                    {"id": "id3.2", "name": "Saturn"}]},
                {"id": "id4",
                "name": "Ice giants",
                "children": [
                    {"id": "id4.1", "name": "Uranus"},
                    {"id": "id4.2", "name": "Neptune"}]
                }]},
        {"name": "Small planets",
        "id": "id5",
        "children": [
            {"id": "id5.1", "name": "Earth"},
            {"id": "id5.2", "name": "Mars"}]}]}
    
    let calls = assert.calls(4, 1000)
    let state = new UIState({}).onChange((state, key, val) => { if(key.startsWith("id")) calls.plusOne() })
    let treeAllClose = new TreeView(window.document, "treeView", treeViewSaveStateData, state)
    treeAllClose.draw()
    
    let node1Close = treeAllClose.node("id1")
    let node2Close = treeAllClose.node("id2")
    let node3Close = treeAllClose.node("id3")
    let node4Close = treeAllClose.node("id4")
    let node5Close = treeAllClose.node("id5")
    
    assert.false(node1Close.isOpen())
    assert.false(node2Close.isOpen())
    assert.false(node3Close.isOpen())
    assert.false(node4Close.isOpen())
    assert.false(node5Close.isOpen())
    
    new Mouse(node1Close.togglable()).click()
    new Mouse(node2Close.togglable()).click()
    new Mouse(node3Close.togglable()).click()
    new Mouse(node5Close.togglable()).click()
    
    await calls.forAllEvents()
    
    assert.true(node1Close.isOpen())
    assert.true(node2Close.isOpen())
    assert.true(node3Close.isOpen())
    assert.false(node4Close.isOpen())
    assert.true(node5Close.isOpen())
    
    let treeAllOpen = new TreeView(window.document, "treeView", treeViewSaveStateData, state)
    treeAllOpen.draw()
    
    let node1Open = treeAllOpen.node("id1")
    let node2Open = treeAllOpen.node("id2")
    let node3Open = treeAllOpen.node("id3")
    let node4Open = treeAllOpen.node("id4")
    let node5Open = treeAllOpen.node("id5")

    assert.true(node1Open.isOpen())
    assert.true(node2Open.isOpen())
    assert.true(node3Open.isOpen())
    assert.false(node4Open.isOpen())
    assert.true(node5Open.isOpen())
}))

InJectX.add(Integration.test("TreeView.onSelect", "/tests/gui/resources/tree.view.html", async (assert) => {
    let treeViewSaveStateData = {
        "id": "id1",
        "name": "Solar system",
        "children": [{
            "id": "id2",
            "name": "Giant planets",
            "children": [
                {"name": "Gas giants",
                "id": "id3",
                "children": [
                    {"id": "id3.1", "name": "Jupiter"},
                    {"id": "id3.2", "name": "Saturn"}]},
                {"id": "id4",
                "name": "Ice giants",
                "children": [
                    {"id": "id4.1", "name": "Uranus"},
                    {"id": "id4.2", "name": "Neptune"}]
                }]},
        {"name": "Small planets",
        "id": "id5",
        "children": [
            {"id": "id5.1", "name": "Earth"},
            {"id": "id5.2", "name": "Mars"}]}]}
    
    let calls = {
        "id1": assert.calls(1, 1000),
        "id2": assert.calls(1, 1000),
        "id5": assert.calls(1, 1000)
    }
    let state = new UIState({})
    let tree = new TreeView(window.document, "treeView", treeViewSaveStateData, state)
    tree.onSelect(node => calls[node.id].plusOne())
    tree.draw()
    
    assert.equals(tree.selected().id, "id1")
    
    let node1 = tree.node("id1")
    new Mouse(node1.clickable()).click()
    await calls["id1"].forAllEvents()
    assert.equals(tree.selected().id, "id1")
    
    let node2 = tree.node("id2")
    new Mouse(node2.clickable()).click()
    await calls["id2"].forAllEvents()
    assert.equals(tree.selected().id, "id2")
    
    let node5 = tree.node("id5")
    new Mouse(node5.clickable()).click()
    await calls["id5"].forAllEvents()
    assert.equals(tree.selected().id, "id5")
    
    let treeWithState = new TreeView(window.document, "treeView", treeViewSaveStateData, state)
    treeWithState.draw()
    assert.equals(treeWithState.selected().id, "id5")
}))

InJectX.add(Integration.test("TreeView.onClickHandler", "/tests/gui/resources/tree.view.html", async (assert) => {
    let treeViewSaveStateData = {
        "id": "id1",
        "name": "Solar system",
        "children": [{
            "id": "id2",
            "name": "Giant planets",
            "children": [
                {"name": "Gas giants",
                "id": "id3",
                "children": [
                    {"id": "id3.1", "name": "Jupiter"},
                    {"id": "id3.2", "name": "Saturn"}]},
                {"id": "id4",
                "name": "Ice giants",
                "children": [
                    {"id": "id4.1", "name": "Uranus"},
                    {"id": "id4.2", "name": "Neptune"}]
                }]},
        {"name": "Small planets",
        "id": "id5",
        "children": [
            {"id": "id5.1", "name": "Earth"},
            {"id": "id5.2", "name": "Mars"}]}]}
    
    let calls = assert.calls(4, 1000)
    let tree = new TreeView(window.document, "treeView", treeViewSaveStateData, new UIState({}))
    let result = []
    tree.onSelect(node => {
        result.push(node.id)
        calls.plusOne()
    })
    tree.draw()
    
    let node1Close = tree.node("id1")
    let node2Close = tree.node("id2")
    let node3Close = tree.node("id3")
    let node5Close = tree.node("id5")
    
    new Mouse(node1Close.clickable()).click()
    new Mouse(node2Close.clickable()).click()
    new Mouse(node3Close.clickable()).click()
    new Mouse(node5Close.clickable()).click()
    
    await assert.all(calls)
    
    assert.equals(result, ["id1", "id2", "id3", "id5"])
}))



                



