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
import { Router } from '@angular/router';
import { TypedClient } from '@imx-modules/imx-api-qbm';
import {
  AppConfigService,
  AppInitializationService,
  CdrRegistryService,
  ClassloggerService,
  ImxTranslationProviderService,
  imx_SessionService,
} from 'qbm';
import { environment } from '../environments/environment';
import { AdminDynamicModuleImportService } from './dynamic-import/admin-dynamic-modules-import.service';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  constructor(
    private logger: ClassloggerService,
    private readonly config: AppConfigService,
    private readonly session: imx_SessionService,
    private readonly translationProvider: ImxTranslationProviderService,
    public readonly registry: CdrRegistryService,
    private readonly router: Router,
    private readonly appInitService: AppInitializationService,
    private dynamicModuleService: AdminDynamicModuleImportService,
  ) {}

  public async init(): Promise<void> {
    try {
      await this.initInternal();
    } catch (e) {
      this.logger.error(this, 'Error during app initialization: ' + e);
      this.router.navigate(['error']);
    }
  }

  private async initInternal(): Promise<void> {
    await this.appInitService.initializeCommonServices({
      captchaImageUrl: 'admin/captchaimage',
      clientUrl: environment.clientUrl,
    });

    this.session.TypedClient = new TypedClient(this.config.v2client, this.translationProvider);
    await this.dynamicModuleService.setupModulesForApp(environment.appName);
  }
}
