
import { IdxDB } from '/js/utils/IdxDB.js'

function trim(str, ch) {
    let start = 0 
    let end = str.length
    while(start < end && str[start] === ch) ++start
    while(end > start && str[end - 1] === ch) --end
    return (start > 0 || end < str.length) ? str.substring(start, end) : str
}

export class FileSystemError extends Error {
    
}

export class Paths {
    static fromStr(path) {
        return new Path(...trim(path, '/').split('/'))
    }
}

export class Path {
    constructor(...paths) {
        this.__paths = paths
    }
    
    elements() {
        return this.__paths
    }
    
    add(item) {
        return new Path(...this.__paths.concat([item]))
    }
    
    toString() {
        return this.__paths.join('/')
    }
}

class LsRecursive {
    constructor(dir) {
        this.__dir = dir
    }
    
    async go(cbFile, cbDir) {
        await this.__walk(cbFile, cbDir, this.__dir)
    }
    
    async __walk(cbFile, cbDir, fsDir) {
        for await (let [n, h] of fsDir.handle()) {
            if (h.kind === 'directory') {
                let cDir = new FsDir(fsDir.path().add(n), fsDir.handle(), h)
                cbDir(cDir)
                await this.__walk(cbFile, cbDir, cDir)
            } else {
                cbFile(new FsFile(fsDir, n, h))
            }
        }
    }
}

class Ls {
    constructor(dir) {
        this.__dir = dir
    }
    
    async go(cbFile, cbDir) {
        await this.__walk(cbFile, cbDir, this.__dir)
    }
    
    async __walk(cbFile, cbDir, fsDir) {
        let cb = {
            'directory': (n, dh) => cbDir(new FsDir(fsDir.path().add(n), fsDir.handle(), dh)), 
            'file': (n, fh) => cbFile(new FsFile(fsDir, n, fh))}
        for await (let [n, h] of fsDir.handle()) cb[h.kind](n, h)
    }
}

export class FileSystem {
    
    constructor(wndw, root) {
        this.__wndw = wndw
        this.__root = root
        this.__db = new IdxDB(wndw, 'fs', 'handlers')
    }
    
    async dir(path) {
        let rootDir = await this.__db.get(this.__root);
        if(!rootDir) {
            rootDir = await this.__wndw.showDirectoryPicker()
            this.__db.set(this.__root, rootDir)
        }
        await this.__verifyPermission(rootDir)
        return new FsDir(path, rootDir, rootDir)
    }
    
    async file(path, name) {
        return new FsFile(await this.dir(path), name)
    }
    
    async __verifyPermission(rootDir) {
        const options = {mode: 'readwrite'}
        if ((await rootDir.queryPermission(options)) === 'granted') return true
        if ((await rootDir.requestPermission(options)) === 'granted') return true
    }
    
}

export class FsDir {
    constructor(path, rootDir, handler=undefined) {
        this.__path = path
        this.__rootDir = rootDir
        this.__dir = handler
    }
    
    async exists() {
        try {
            let dir = this.__rootDir
            for(let part of this.__path.elements()) {                
                dir = await dir.getDirectoryHandle(part)
            }
            this.__dir = dir
            return true
        } catch(e) {
            return false
        }
    }
    
    async create() {
        if(await this.exists()) return
        let dir = this.__rootDir
        for(let part of this.__path.elements()) {
            dir = await dir.getDirectoryHandle(part, {create: true})
        }
        this.__dir = dir
        
    }
    
    async delete() {
        await this.__dir.remove()
        
    }
    
    async list() {
        if(!await this.exists()) throw this.__err()
        return new Ls(this)
    }
    
    async listRecursive() {
        if(!await this.exists()) throw this.__err()
        return new LsRecursive(this)
    }
    
    path() {
        return this.__path
    }
    
    handle() {
        return this.__dir
    }
    
    uniq() {
        return this.path().toString()
    }
    
    __err() {
        return new FileSystemError('Directory ' + this.path().toString() + ' not found.')
    }
}

export class FsFile {
    constructor(dir, name, handler=undefined) {
        this.__dir = dir
        this.__name = name
        this.__file = handler
    }
    
    async exists() {
        if(await this.__dir.exists()) {
            try {
                await this.__fhandle()
                return true
            } catch(e) {
                return false
            }
        } else {
            return false
        }
    }
    
    async write(val) {
        if(! await this.__dir.exists()) await this.__dir.create()
        let fhandle = await this.__fhandle({create: true})
        let writable = await fhandle.createWritable()
        await writable.write(val)
        await writable.close()
    }
    
    async read() {
        if(! await this.exists()) throw this.__err()
        let fhandle = await this.__fhandle({})
        let readable = await fhandle.getFile()
        return await readable.text()
    }
    
    async delete() {
        if(await this.exists()) {
            let fhandle = await this.__fhandle({})
            await fhandle.remove()
            this.__file = undefined
        } else {
            throw this.__err()
        }
    }
    
    __err() {
        return new FileSystemError('File ' + this.path().toString() + '/' + this.__name + ' not found.')
    }
    
    path() {
        return this.__dir.path()
    }
    
    name() {
        return this.__name
    }
    
    uniq() {
        return this.path().toString() + '/' + this.name()
    }
    
    async __fhandle(opts) {
        if(this.__file != undefined) return this.__file 
        this.__file = await this.__dir.handle().getFileHandle(this.__name, opts)
        return this.__file
    }
}