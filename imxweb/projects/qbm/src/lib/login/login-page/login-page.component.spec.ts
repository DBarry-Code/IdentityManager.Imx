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

import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { EuiThemeService } from '@elemental-ui/core';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { ReCaptchaV3Service } from 'ng-recaptcha-2';
import { AppConfigService } from '../../appConfig/appConfig.service';
import { AuthenticationService } from '../../authentication/authentication.service';
import { CaptchaService } from '../../captcha/captcha.service';
import { ClassloggerService } from '../../classlogger/classlogger.service';
import { SplashService } from '../../splash/splash.service';
import { SystemInfoService } from '../../system-info/system-info.service';
import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  let component: LoginPageComponent;
  let fixture: MockedComponentFixture<LoginPageComponent>;

  const appConfigStub = { title: signal(''), Config: { WebAppIndex: '' }, BaseUrl: '' };

  beforeEach(() => {
    return MockBuilder(LoginPageComponent)
      .provide({
        provide: AppConfigService,
        useValue: appConfigStub,
      })
      .mock(AuthenticationService)
      .mock(CaptchaService)
      .mock(ClassloggerService)
      .mock(ReCaptchaV3Service)
      .mock(SplashService)
      .mock(SystemInfoService)
      .mock(EuiThemeService)
      .beforeCompileComponents((testBed) =>
        testBed.configureTestingModule({
          schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }),
      );
  });

  beforeEach(() => {
    fixture = MockRender(LoginPageComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
