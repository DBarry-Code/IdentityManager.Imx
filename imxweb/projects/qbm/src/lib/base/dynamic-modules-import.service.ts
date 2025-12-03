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

import { createNgModule, inject, Injectable, Injector } from "@angular/core";
import { PlugInInfo } from "@imx-modules/imx-api-qbm";
import { ClassloggerService } from "../classlogger/classlogger.service";
import { imx_SessionService } from "../session/imx-session.service";

/**
 * Abstract service to handle the importing of libraries that are controlled by the server.
 * 
 * First party developers should add to the abstract method implementation "loadFirstPartyModules" within the respective application i.e see PortalDynamicModuleImportService.loadFirstPartyModules
 * 
 * External developers should only add to the abdstract method implementation "loadThirdPartyModules" within the respective application.
 */
@Injectable()
export abstract class DynamicModuleImportService {
  private loadedModules: PlugInInfo[] = [];
  private logger = inject(ClassloggerService);
  private session = inject(imx_SessionService);
  private injector = inject(Injector);

/**
 * Handles requesting what modules are available from the server for this app, then envokes the First & Third party initialization functions
 * @param appName 
 * @returns 
 */
public async setupModulesForApp(appName: string) {
  const apps = await this.session.Client.imx_applications_get();

  const appInfo = apps.find((app) => app.Name === appName);

  if (!appInfo) {
    this.logger.debug(this, `❌ No config found for ${appName}`);
    return;
  } 

  this.logger.debug(this, `▶️ Found config section for ${appInfo.DisplayName}`);
  if (!appInfo?.PlugIns || appInfo.PlugIns.length === 0) {
    this.logger.debug(this, `❌ No plugins found`);
    return;
  }

  this.logger.debug(this, `▶️ Found ${appInfo.PlugIns.length} plugin(s)`);
  await this.loadFirstPartyModules(appInfo.PlugIns);
  await this.loadThirdPartyModules(appInfo.PlugIns);
  this.checkModules(appInfo.PlugIns);

}
  /**
   * Used to handle loading any One Identity modules. Do not modify this if you are an external developer, these changes will be overwritten in future updates.
   * @param modules 
   */
  abstract loadFirstPartyModules(modules: PlugInInfo[]): Promise<void>

  /**
   * External developers should use this function to handle importing their modules.
   * @param modules
   *
   * @example 
   * import {cccConfigModule} from 'ccc';
   * ...
   * let module = modules.find(m => m.Name === 'ccc');
   * let callback = async () => {
   *    await import('ccc');
   *    return [cccConfigModule];
   * }
   * this.loadModule(module, callback); 
   */
  abstract loadThirdPartyModules(modules: PlugInInfo[]): Promise<void>

  /**
   * Uses the context injector to inject modules into the application
   * @param module 
   * @param callback 
   */
  protected async loadModule(module: PlugInInfo, callback: () => Promise<any[]>) {
    this.logger.debug(this, `Loading module: ${module.Container} - ${module.Name}`);
    try {
      const ngModules = await callback();
      ngModules.forEach((ngModule) => createNgModule(ngModule, this.injector));
      if (ngModules.length > 0) this.loadedModules.push(module);
    }
    catch (e) {
      this.logger.error(this, `💥 Loading of ${module.Name} (${module.Container}) failed with the following error: ${e.message}`);
    }
  }

  /**
   * Make sure all requested modules were actually loaded.
   * @param modules 
   */
  private checkModules(modules: PlugInInfo[]) {
    modules.forEach(module => {
      if (!this.loadedModules.find(m => m.Container === module.Container)) this.logger.warn(this, `Server requested ${module.Container} be loaded, but it was not. Make sure it is handled correctly in the respective portal's First & Third party imports.`);
    })
  }
}