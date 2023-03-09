//AutoLoader Config
exports.opts = {minVer:12}
exports.main=() => import(`./solver${process.argv[2]=='old'?'Old':''}.mjs`);