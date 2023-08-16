
InJectX.add(Unit.test("Unit.equals", (assert) => {
    assert.equals(123, 123)
    assert.equals("abc", "abc")
    assert.equals(["abc", 123], ["abc", 123])
    
    let afterErr = false
    try {
        assert.equals(123, 321)
        afterErr = true
    } catch(err) {
        console.log(err)
    }
    assert.equals(afterErr, false)
}))

InJectX.add(Unit.test("Unit.true", (assert) => {
    assert.true(true)
    let afterErr = false
    try {
        assert.true(false)
        afterErr = true
    } catch(err) {
        console.log(err)
    }
    assert.equals(afterErr, false)
}))

InJectX.add(Unit.test("Unit.false", (assert) => {
    assert.false(false)
    let afterErr = false
    try {
        assert.false(true)
        afterErr = true
    } catch(err) {
        console.log(err)
    }
    assert.equals(afterErr, false)
    
}))

InJectX.add(Unit.test("Unit.fail", (assert) => {
    let afterErr = false
    try {
        assert.fail("")
        afterErr = true
    } catch(err) {
        console.log(err)
    }
    assert.equals(afterErr, false)
    
}))

InJectX.add(Unit.test("Unit.ok", (assert) => {
    assert.ok()
}))