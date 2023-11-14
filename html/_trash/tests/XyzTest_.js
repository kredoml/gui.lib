
InJect.test("firstTest", "/tests/index.html", (win) => {
    win.document.getElementById("var").innerText = "val1"
    Assert.equals(1, 1)
})

InJect.test("secondTest", "/tests/index.html", (win) => {
    win.document.getElementById("var").innerText = "val2"
    Assert.fail("Some fail")
})

InJect.test("thirdTest", "/tests/index.html", (win) => {
    win.document.getElementById("var").innerText = "val3"
    Assert.true(true)
})