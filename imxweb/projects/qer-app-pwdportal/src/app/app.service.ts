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

import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

import { Router } from '@angular/router';
import { TypedClient } from '@imx-modules/imx-api-qbm';
import { Globals } from '@imx-modules/imx-qbm-dbts';
import {
  AppConfigService,
  AppInitializationService,
  CdrRegistryService,
  ClassloggerService,
  ImxTranslationProviderService,
  SplashService,
  SystemInfoService,
  imx_SessionService,
} from 'qbm';
import { PasswordService, QerApiService } from 'qer';
import { environment } from '../environments/environment';
import { PwdDynamicModuleImportService } from './dynamic-import/pwd-dynamic-modules-import.service';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  constructor(
    public readonly registry: CdrRegistryService,
    private readonly logger: ClassloggerService,
    private readonly config: AppConfigService,
    private readonly systemInfoService: SystemInfoService,
    private readonly translateService: TranslateService,
    private readonly session: imx_SessionService,
    private readonly translationProvider: ImxTranslationProviderService,
    private readonly title: Title,
    private readonly qerApi: QerApiService,
    private readonly passwordService: PasswordService,
    private readonly splash: SplashService,
    private readonly appInitService: AppInitializationService,
    private dynamicModuleService: PwdDynamicModuleImportService,
    private readonly router: Router,
  ) {}

  public async init(): Promise<void> {
    this.showSplash();
    try {
      await this.initInternal();
    } catch (e) {
      this.splash.close();
      this.logger.error(this, 'Error during app initialization: ' + e);
      this.router.navigate(['error']);
    }
  }

  private async initInternal(): Promise<void> {
    await this.appInitService.initializeCommonServices({
      captchaImageUrl: 'passwordreset/captchaimage',
      clientUrl: environment.clientUrl,
    });

    this.translateService.onLangChange.subscribe(() => {
      this.setTitle();
    });

    this.setTitle();

    this.session.TypedClient = new TypedClient(this.config.v2client, this.translationProvider);

    await this.dynamicModuleService.setupModulesForApp(environment.appName);

    const featureConfig = await this.qerApi.v2Client.passwordreset_authconfig_get();

    await this.passwordService.registerCustomAuthFlows(featureConfig);
  }

  private async setTitle(): Promise<void> {
    const imxConfig = await this.systemInfoService.getImxConfig();
    const name = imxConfig.ProductName || Globals.QIM_ProductNameFull;
    this.config.setTitle(await this.translateService.get('#LDS#Heading Password Reset Portal').toPromise());
    const title = `${name} ${this.config.Config.Title}`;
    this.title.setTitle(title);

    await this.updateSplash(title);
  }

  private showSplash(): void {
    // open splash screen with fix values
    this.splash.init({ applicationName: 'Password Reset Portal' });
  }

  private async updateSplash(title: string): Promise<void> {
    // update the splash screen and use translated texts and the title from the imxconfig
    const loadingMsg = await this.translateService.get('#LDS#Loading...').toPromise();
    this.splash.update({ applicationName: title, message: loadingMsg });
  }
}
