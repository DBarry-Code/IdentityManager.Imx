"use strict";
// The .js version of this file is generated from the .ts file. Please only change the .ts file and regen via tsc.
Object.defineProperty(exports, "__esModule", { value: true });
// Script to generate documentation via compodoc.
// Should be run from the root imxweb dir.
// Use: node build-docs.js <project1> <project2>
// <projects> must correspond to the physical path i.e qer-app-portal
var child_process = require("child_process");
var fs = require("fs");
var path = require("path");
var process = require("process");
if (process.argv.length < 3) {
    console.error('No project(s) given. Please provide at least one project name as an argument.');
    process.exit(1);
}
var projects = process.argv.slice(2);
projects.forEach(function (project) { return generateDoc(project); });
function generateDoc(project) {
    console.log("Generating documentation for ".concat(project, "..."));
    var tsconfig = path.join('projects', project, 'tsconfig.lib.json');
    if (!fs.existsSync(tsconfig)) {
        // If lib doesn't exist, try app
        tsconfig = path.join('projects', project, 'tsconfig.app.json');
    }
    if (!fs.existsSync(tsconfig)) {
        // Both app and lib don't exist, bad dir
        console.error("".concat(project, " doesn't have a tsconfig.lib.json or tsconfig.app.json. Moving on...\n"));
        return;
    }
    var outputpath = path.join('documentation', project);
    var child = child_process.spawnSync('compodoc', ['-p', tsconfig, '-d', outputpath], { encoding: 'utf8', shell: true });
    if (child.error) {
        console.log('ERROR: ', child.error);
        process.exit(1);
    }
    console.log("Finished - documentation available at ".concat(outputpath, "\n"));
}
