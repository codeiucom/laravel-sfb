const fs = require("fs");
const Path = require("path");
const glob = require("glob");
const CryptoJS = require("crypto-js")
const chokidar = require('chokidar');
const Task = require("laravel-mix/src/tasks/Task");
const FileCollection = require("laravel-mix/src/FileCollection");

class SingFileBlade extends Task {
    compiledFiles = [];
    tmpDir = "storage/framework/views/temp-sfb";
    watchFiles = [];

    compiledCss = {};
    compiledJs = {};

    tmpDirWatch = false;

    constructor(data) {
        super(data);

        if (this.tmpDir.indexOf("/") === 0) {
            this.tmpDir = this.tmpDir.substring(1);
        }

        this.options = this.data.options || {};
        this.cleanUp();
        this.createTmpDir();

        this.data.output = process.env.CODEIU_LARAVEL_SFB_DIR || `/assets/sfb`;

        const entry = this.data.entry;

        if (typeof entry === "string" && entry.includes("*")) {
            glob.sync(`${entry}`).map((file) => {
                this.updatePartial(file);
            });
        } else if (typeof entry === "object") {
            entry.forEach((file) => {
                this.updatePartial(file);
            });
        } else {
            this.updatePartial(entry);
        }

        if (Mix.isWatching()) {
            const watcher = chokidar
                .watch(this.tmpDir, {persistent: true})
                .on('add', (file) => {
                    if (this.tmpDirWatch) {
                        console.log("new file add: " + file);
                        console.log("restart mix watch!")
                    }
                });
        }

        this.files = new FileCollection(this.watchFiles);

        /**
         * Delete temp directory
         */
        process.on('SIGINT', () => {
            this.cleanUp();
            process.exit();
        });
        process.on('exit', () => {
            this.cleanUp();
        });
    }

    run() {
        if (!this.tmpDirWatch) {
            this.tmpDirWatch = true;
        }
    }

    onChange(filepath) {
        this.updatePartial(filepath);
    }

    createTmpDir() {
        const tmpDir = this.tmpDir;
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, {recursive: true});
        }
    }

    tmpFilename(file, ext) {
        const cwd = process.cwd();

        file = Path.resolve(file);
        if (file.indexOf(cwd) === 0) {
            const tmpRegex = new RegExp("^" + cwd)
            file = file.replace(tmpRegex, "");
        }

        const filename = this.sha1(file);
        return `${this.tmpDir}/${filename}.mix.sfb.${ext}`;
    }

    updatePartial(sourceFile) {
        this.updateScript(sourceFile);
        this.updateStyle(sourceFile);
    }

    updateStyle(bladeFile) {
        const data = fs.readFileSync(bladeFile, {encoding: "utf8"});
        const text1 = this.pickUpText(data, "sfbMixStyle");

        if (text1 === null) {
            if (this.compiledCss[bladeFile]) {
                fs.writeFileSync(this.compiledCss[bladeFile], "");
            }
            return null;
        }

        const matches = /<style(?:\s+[^>]*type=['"]text\/(scss|postcss)['"][^>]*)?>(.+)<\/style>/is.exec(text1);
        if (matches === null) {
            if (this.compiledCss[bladeFile]) {
                fs.writeFileSync(this.compiledCss[bladeFile], "");
            }
            return null;
        }

        let styleType = matches[1] || "";
        const styleText = matches[2] || "";

        if (styleType === 'postcss') {
            styleType = 'postCss';
        }

        let mixMethod = styleType;
        if (mixMethod === "scss") {
            mixMethod = "sass";
        }

        let ext;
        switch (styleType) {
            case "sass":
                ext = "scss";
                break;
            case "scss":
            case "less":
                ext = styleType;
                break;
            case "stylus":
                ext = "styl";
                break;
            case "postCss":
                ext = "css";
                break;
            default:
                ext = "css";
        }

        const tmpStyleFile = this.tmpFilename(bladeFile, ext);
        fs.writeFileSync(tmpStyleFile, styleText);

        if (this.compiledFiles.indexOf(tmpStyleFile) < 0) {
            if (typeof this.data.mix[mixMethod] !== "undefined") {
                this.data.mix[mixMethod](
                    tmpStyleFile,
                    this.data.output,
                    this.getOptions(mixMethod, 'pluginOptions'),
                    this.getOptions(mixMethod, 'postCssPlugins')
                );

                this.compiledFiles.push(tmpStyleFile);
                this.compiledCss[bladeFile] = tmpStyleFile;
            }

            this.registerWatch(bladeFile);
        }

        return styleText;
    }

    updateScript(bladeFile) {
        const data = fs.readFileSync(bladeFile, {encoding: "utf8"});
        const text1 = this.pickUpText(data, "sfbMixScript");

        if (text1 === null) {
            if (this.compiledJs[bladeFile]) {
                fs.writeFileSync(this.compiledJs[bladeFile], "");
            }
            return null;
        }

        const matches = /<script>(.+)<\/script>/is.exec(text1);

        if (!matches) {
            if (this.compiledJs[bladeFile]) {
                fs.writeFileSync(this.compiledJs[bladeFile], "");
            }
            return null;
        }

        const scriptText = matches[1] || "";

        const tmpJsFile = this.tmpFilename(bladeFile, "js");
        fs.writeFileSync(tmpJsFile, scriptText);

        if (this.compiledFiles.indexOf(tmpJsFile) < 0) {
            this.data.mix.js(tmpJsFile, this.data.output);
            this.compiledFiles.push(tmpJsFile);
            this.compiledJs[bladeFile] = tmpJsFile;
        }
        this.registerWatch(bladeFile);

        return scriptText;
    }

    pickUpText(data, tag) {
        const findText = `@${tag}`;
        let findIdx = data.lastIndexOf(findText);
        if (findIdx < 0) {
            return null;
        }
        findIdx += findText.length;

        const findText2 = "@endSfb";
        let findIdx2 = data.indexOf(findText2, findIdx);
        if (findIdx2 < 0) {
            return null;
        }
        findIdx2 += findText2.length;

        return data.substring(findIdx, findIdx2);
    }

    registerWatch(sourceFile) {
        if (this.watchFiles.indexOf(sourceFile) < 0) {
            this.watchFiles.push(sourceFile);
        }
    }

    cleanUp() {
        this.deleteFolderRecursive(this.tmpDir);
    }

    deleteFolderRecursive(path) {
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach((file, index) => {
                const curPath = Path.join(path, file);
                if (fs.lstatSync(curPath).isDirectory()) {
                    this.deleteFolderRecursive(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    }

    sha1(str) {
        const hash = CryptoJS.SHA1(str);
        return CryptoJS.enc.Hex.stringify(hash);
    }

    getOptions(type, key) {
        const options = this.options[type] || {};
        return options[key] || null;
    }
}

module.exports = SingFileBlade;
