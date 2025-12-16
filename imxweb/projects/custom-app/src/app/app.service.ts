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

import { ImxConfig, TypedClient } from '@imx-modules/imx-api-qbm';
import { Globals } from '@imx-modules/imx-qbm-dbts';
import {
  AppConfigService,
  AppInitializationService,
  ImxTranslationProviderService,
  SplashService,
  SystemInfoService,
  imx_SessionService,
} from 'qbm';
import { environment } from '../../../qer-app-portal/src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  private imxConfig: ImxConfig;
  constructor(
    private readonly config: AppConfigService,
    private readonly systemInfoService: SystemInfoService,
    private readonly translateService: TranslateService,
    private readonly session: imx_SessionService,
    private readonly translationProvider: ImxTranslationProviderService,
    private readonly title: Title,
    private readonly splash: SplashService,
    private readonly appInitService: AppInitializationService,
  ) {}

  public async init(): Promise<void> {
    this.showSplash();

    await this.appInitService.initializeCommonServices({
      captchaImageUrl: 'portal/captchaimage',
      clientUrl: environment.clientUrl,
    });

    this.imxConfig = await this.systemInfoService.getImxConfig();

    this.translateService.onLangChange.subscribe(() => {
      this.setTitle();
    });

    this.setTitle();

    this.session.TypedClient = new TypedClient(this.config.v2client, this.translationProvider);
  }

  private async setTitle(): Promise<void> {
    const name = this.imxConfig.ProductName || Globals.QIM_ProductNameFull;
    const title = `${name} ${this.config.Config.Title}`;
    this.title.setTitle(title);

    await this.updateSplash(title);
  }

  private showSplash(): void {
    // open splash screen with fix values
    this.splash.init({ applicationName: 'Custom App' });
  }

  private async updateSplash(title: string): Promise<void> {
    // update the splash screen and use translated texts and the title from the imxconfig
    const loadingMsg = await this.translateService.get('#LDS#Loading...').toPromise();
    this.splash.update({ applicationName: title, message: loadingMsg });
  }
}
