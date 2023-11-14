
import { FileSystem, Path, Paths, FileSystemError } from '/js/utils/FileSystem.js'
import { InJectX, Unit } from '/js/injectx/InJectX.js'

let fs = new FileSystem(window, '/root')

InJectX.setUp = (runTests) => {
    fs.dir(Paths.fromStr('/123')).then(_ => {
        runTests()
    }).catch(err => {
        console.log(err)
    })
}
    
InJectX.add(Unit.test("FileSystem.createDeleteDir", async (assert) => {
    let path = Paths.fromStr('/tmp/' + crypto.randomUUID() + '/subf1/subf2/subf3/')
    let dir = await fs.dir(path)
    assert.false(await dir.exists())
    await dir.create()
    assert.true(await dir.exists())
    await dir.delete()
    assert.false(await dir.exists())
    assert.equals(dir.path(), path)
}))

InJectX.add(Unit.test("FileSystem.createDeleteFile", async (assert) => {
    let path = Paths.fromStr('/tmp/' + crypto.randomUUID() + '/subf1/subf2/subf3/')
    let fileName = 'testFile.txt'
    let fileContent = 'some text'
    let file = await fs.file(path, fileName)
    
    assert.false(await file.exists())
    await file.write(fileContent)
    
    assert.true(await file.exists())
    assert.equals(await file.read(), fileContent)
    await file.delete()
    
    assert.false(await file.exists())
    assert.equals(file.path(), path)
    assert.equals(file.name(), fileName)
}))

InJectX.add(Unit.test("FileSystem.writeFile", async (assert) => {
    let path = Paths.fromStr('/tmp/' + crypto.randomUUID() + '/subf1/subf2/subf3/')
    let fileName = 'testFile.txt'
    let fileContent1 = 'some text 1'
    let fileContent2 = 'some text 2'
    
    let file = await fs.file(path, fileName)
    assert.false(await file.exists())
    
    await file.write(fileContent1)
    assert.equals(await file.read(), fileContent1)
    
    await file.write(fileContent2)
    assert.equals(await file.read(), fileContent2)
    
    await file.delete()
}))

InJectX.add(Unit.test("FileSystem.readFile", async (assert) => {
    let path = Paths.fromStr('/tmp/' + crypto.randomUUID() + '/subf1/subf2/subf3/')
    let fileName = 'testFile.txt'
    let fileContent = 'some text'
    
    let file = await fs.file(path, fileName)
    assert.false(await file.exists())
    
    try {
        await file.read()
        assert.fail('File doesn\'t exists but excepton isn\'t thrown')
    } catch(err) {
        assert.true(err instanceof FileSystemError)
    }
    
    await file.write(fileContent)
    assert.equals(await file.read(), fileContent)
    
    await file.delete()
}))

InJectX.add(Unit.test("FileSystem.deleteFile", async (assert) => {
    let path = Paths.fromStr('/tmp/' + crypto.randomUUID() + '/subf1/subf2/subf3/')
    let fileName = 'testFile.txt'
    let fileContent = 'some text'
    
    let file = await fs.file(path, fileName)
    assert.false(await file.exists())
    
    try {
        await file.delete()
        assert.fail('File doesn\'t exists but excepton isn\'t thrown')
    } catch(err) {
        assert.true(err instanceof FileSystemError)
    }
    
    await file.write(fileContent)
    assert.equals(await file.read(), fileContent)
    
    await file.delete()
}))

InJectX.add(Unit.test("FileSystem.listSingleDirectory", async (assert) => {
    
    let path = new Path('tmp', crypto.randomUUID())
    let subPath1 = path.add('sub1')
    let subPath2 = subPath1.add('sub2')
    let subPath3 = subPath2.add('sub3')
    
    let file1 = await fs.file(subPath1, 'file1')
    await file1.write('')
    let file1_1 = await fs.file(subPath1, 'file1_1')
    await file1_1.write('')
    let file1_2 = await fs.file(subPath1, 'file1_2')
    await file1_2.write('')
    let file2 = await fs.file(subPath2, 'file2')
    await file2.write('')
    let file2_1 = await fs.file(subPath2, 'file2_1')
    await file2_1.write('')
    let file3 = await fs.file(subPath3, 'file3')
    await file3.write('')
    
    let dir1 = await fs.dir(subPath1)
    let dir2 = await fs.dir(subPath2)
    let dir3 = await fs.dir(subPath3)
    
    let ls1 = await dir1.list()
    let ls2 = await dir2.list()
    let ls3 = await dir3.list()
    
    let files1 = []
    let dirs1 = []
    await ls1.go(file => files1.push(file.uniq()), dir => dirs1.push(dir.uniq()))
    
    let files2 = []
    let dirs2 = []
    await ls2.go(file => files2.push(file.uniq()), dir => dirs2.push(dir.uniq()))
    
    
    let files3 = []
    let dirs3 = []
    await ls3.go(file => files3.push(file.uniq()), dir => dirs3.push(dir.uniq()))
    files1.sort()
    files2.sort()
    files3.sort()
    assert.equals(files1, [file1.uniq(), file1_1.uniq(), file1_2.uniq()])
    assert.equals(dirs1, [dir2.uniq()])
    assert.equals(files2, [file2.uniq(), file2_1.uniq()])
    assert.equals(dirs2, [dir3.uniq()])
    assert.equals(files3, [file3.uniq()])
    assert.equals(dirs3, [])
}))

InJectX.add(Unit.test("FileSystem.listDirectoryRecursive", async (assert) => {
    let path = new Path('tmp', crypto.randomUUID())
    let subPath1 = path.add('sub1')
    let subPath2 = subPath1.add('sub2')
    let subPath3 = subPath2.add('sub3')
    
    let file1 = await fs.file(subPath1, 'file1')
    await file1.write('')
    let file1_1 = await fs.file(subPath1, 'file1_1')
    await file1_1.write('')
    let file1_2 = await fs.file(subPath1, 'file1_2')
    await file1_2.write('')
    let file2 = await fs.file(subPath2, 'file2')
    await file2.write('')
    let file2_1 = await fs.file(subPath2, 'file2_1')
    await file2_1.write('')
    let file3 = await fs.file(subPath3, 'file3')
    await file3.write('')
    
    let dir = await fs.dir(path)
    let dir1 = await fs.dir(subPath1)
    let dir2 = await fs.dir(subPath2)
    let dir3 = await fs.dir(subPath3)
    let ls = await dir.listRecursive()
    
    let files = []
    let dirs = []
    await ls.go(file => files.push(file.uniq()), dir => dirs.push(dir.uniq()))
    files.sort()
    dirs.sort()
    assert.equals(files, [file1, file1_1, file1_2, file2, file2_1, file3].map(el => el.uniq()))
    assert.equals(dirs, [dir1, dir2, dir3].map(el => el.uniq()))
}))




