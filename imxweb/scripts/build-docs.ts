/*
 * ONE IDENTITY LLC. PROPRIETARY INFORMATION
 *
 * This software is confidential.  One Identity, LLC. or one of its affiliates or
 * subsidiaries, has supplied this software to you under terms of a
 * license agreement, nondisclosure agreement or both.
 *
 * You may not copy, disclose, or use this software except in accordance with
 * those terms.
 *
 *
 * Copyright 2025 One Identity LLC.
 * ALL RIGHTS RESERVED.
 *
 * ONE IDENTITY LLC. MAKES NO REPRESENTATIONS OR
 * WARRANTIES ABOUT THE SUITABILITY OF THE SOFTWARE,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
 * TO THE IMPLIED WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, OR
 * NON-INFRINGEMENT.  ONE IDENTITY LLC. SHALL NOT BE
 * LIABLE FOR ANY DAMAGES SUFFERED BY LICENSEE
 * AS A RESULT OF USING, MODIFYING OR DISTRIBUTING
 * THIS SOFTWARE OR ITS DERIVATIVES.
 *
 */

// The .js version of this file is generated from the .ts file. Please only change the .ts file and regen via tsc.

// Script to generate documentation via compodoc.
// Should be run from the root imxweb dir.
// Use: node build-docs.js <project1> <project2>
// <projects> must correspond to the physical path i.e qer-app-portal

import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';

if (process.argv.length < 3) {
  console.error('No project(s) given. Please provide at least one project name as an argument.');
  process.exit(1);
}

const projects = process.argv.slice(2);

projects.forEach((project) => generateDoc(project));

function generateDoc(project: string) {
  console.log(`Generating documentation for ${project}...`);
  let tsconfig = path.join('projects', project, 'tsconfig.lib.json');
  if (!fs.existsSync(tsconfig)) {
    // If lib doesn't exist, try app
    tsconfig = path.join('projects', project, 'tsconfig.app.json');
  }

  if (!fs.existsSync(tsconfig)) {
    // Both app and lib don't exist, bad dir
    console.error(`${project} doesn't have a tsconfig.lib.json or tsconfig.app.json. Moving on...\n`);
    return;
  }

  const outputpath = path.join('documentation', project);
  const child = child_process.spawnSync('compodoc', ['-p', tsconfig, '-d', outputpath], { encoding: 'utf8', shell: true });
  if (child.error) {
    console.log('ERROR: ', child.error);
    process.exit(1);
  }

  console.log(`Finished - documentation available at ${outputpath}\n`);
}
