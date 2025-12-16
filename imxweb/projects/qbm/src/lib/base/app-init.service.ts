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
import { TranslateService } from '@ngx-translate/core';
import { AppConfigService } from '../appConfig/appConfig.service';
import { AuthenticationService } from '../authentication/authentication.service';
import { CaptchaService } from '../captcha/captcha.service';
import { ErrorPageService } from '../error-page/error-page.service';
import { ISessionState } from '../session/session-state';
import { SystemInfoService } from '../system-info/system-info.service';
import { ImxTranslationProviderService } from '../translation/imx-translation-provider.service';

@Injectable({
  providedIn: 'root',
})
export class AppInitializationService {
  constructor(
    private readonly systemInfoService: SystemInfoService,
    private readonly captchaService: CaptchaService,
    private readonly config: AppConfigService,
    private readonly authentication: AuthenticationService,
    private readonly translationProvider: ImxTranslationProviderService,
    private readonly translateService: TranslateService,
    private readonly errorPageService: ErrorPageService,
    private readonly router: Router,
  ) {}

  public recaptchaSiteKeyV3: string | null = null;

  async initializeCommonServices(config: { clientUrl: string; captchaImageUrl: string }) {
    // check if OAuth error information was provided in the URL.
    this.checkForOAuthError();

    await this.config.init(config.clientUrl);

    if (this.config.Config.Translation?.Langs) {
      this.translateService.addLangs(this.config.Config.Translation.Langs);
    }

    // If the session defines another culture, update the translation provider
    this.authentication.onSessionResponse.subscribe((sessionState: ISessionState) =>
      this.translationProvider.init(sessionState?.culture, sessionState?.cultureFormat),
    );

    const imxConfig = await this.systemInfoService.getImxConfig();

    if (imxConfig.RecaptchaPublicKey) {
      this.captchaService.enableReCaptcha(imxConfig.RecaptchaPublicKey);
      this.recaptchaSiteKeyV3 = imxConfig.RecaptchaPublicKey;
    }
    this.captchaService.captchaImageUrl = config.captchaImageUrl;

    const browserCulture = this.translateService.getBrowserCultureLang() as string;
    this.translateService.setDefaultLang(browserCulture);
    await this.translateService.use(browserCulture).toPromise();
  }

  private checkForOAuthError() {
    // clear previous error
    this.errorPageService.errorMessage = '';

    const s = document.location.search;
    if (!s) return;
    const params = new URLSearchParams(s);
    if (params.get('error')) {
      this.errorPageService.errorMessage = params.get('error_description') || params.get('error') || '';
      this.router.navigate(['error']);
    }
  }
}
