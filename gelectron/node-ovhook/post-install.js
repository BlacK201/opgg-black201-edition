// post-install.js

/**
 * Script to run after npm install
 *
 * Copy selected files to user's directory
 */

'use strict'

var fs = require('fs')
var path = require('path')
var filesToCopy = ['./n_ovhelper.exe', './n_overlay.dll', './n_overlay.x64.dll', './n_ovhelper.x64.exe']

// User's local directory
var binaryPath = __dirname + "/../game-overlay/bin/Release"
var userPath = __dirname
filesToCopy.forEach((value) => {
    var filePath = path.join(binaryPath, value);
    var filename = path.parse(filePath).base;
    var targetPath = path.join(userPath, 'build', 'Release', filename);
    fs.copyFileSync(filePath, targetPath);
});
// Moving files to user's local directory