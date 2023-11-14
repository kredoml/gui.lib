
import { IdxDB } from '/js/utils/IdxDB.js'
import { InJectX, Unit } from '/js/injectx/InJectX.js'


InJectX.add(Unit.test("IdxDB.setGet", async (assert) => {
    let idxDB = new IdxDB(window, "db", "store")
    let key = "key " + crypto.randomUUID()
    let val = "someVal " + crypto.randomUUID()

    assert.true(await idxDB.get(key) === undefined)
    
    idxDB.set(key, val)
    assert.equals(await idxDB.get(key), val)
}))