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

import { HighContrastModeDetector } from '@angular/cdk/a11y';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  Component,
  ComponentFactoryResolver,
  computed,
  effect,
  inject,
  OnDestroy,
  Signal,
  signal,
  viewChild,
  viewChildren,
  WritableSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule, UntypedFormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { EuiCoreModule, EuiLoadingService, EuiSelectOption, EuiTheme, EuiThemeService } from '@elemental-ui/core';
import { Globals } from '@imx-modules/imx-qbm-dbts';
import { TranslateModule } from '@ngx-translate/core';
import { ReCaptchaV3Service } from 'ng-recaptcha-2';
import { AppConfigService } from '../../appConfig/appConfig.service';
import { AuthConfigProvider, PreAuthStateType } from '../../authentication/auth-config-provider.interface';
import { AuthenticationService } from '../../authentication/authentication.service';
import { CaptchaComponent } from '../../captcha/captcha.component';
import { CaptchaModule } from '../../captcha/captcha.module';
import { CaptchaService } from '../../captcha/captcha.service';
import { ClassloggerService } from '../../classlogger/classlogger.service';
import { ElementalUiConfigService } from '../../configuration/elemental-ui-config.service';
import { ExtDirective } from '../../ext/ext.directive';
import { ExtModule } from '../../ext/ext.module';
import { PortalIdentifiers } from '../../portal-switcher/portal-indentifier';
import { PortalSwitcherComponent } from '../../portal-switcher/portal-switcher/portal-switcher.component';
import { AuthPropDataProvider } from '../../session/auth-prop-data-provider.interface';
import { ISessionState } from '../../session/session-state';
import { SplashService } from '../../splash/splash.service';
import { SystemInfoService } from '../../system-info/system-info.service';
import { TwoFactorAuthenticationComponent } from '../../two-factor-authentication/two-factor-authentication.component';

@Component({
  selector: 'imx-login-page',
  imports: [
    CaptchaModule,
    CommonModule,
    EuiCoreModule,
    ExtModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    NgOptimizedImage,
    PortalSwitcherComponent,
    TranslateModule,
    TwoFactorAuthenticationComponent,
  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent implements OnDestroy {
  public customLogoUrl: string;
  public title: string;
  public copyright = {
    productName: Globals.QIM_ProductNameFull as string,
    year: Globals.QBM_Copyright,
  };

  private initialLoad: boolean = true;
  public sessionState: Signal<ISessionState | undefined>;
  public loginData: { [id: string]: string } = {};
  public authMethodFormControl = new UntypedFormControl();

  public configurationProviders: EuiSelectOption[];
  public selectedConfigProvider: WritableSignal<AuthConfigProvider | undefined> = signal(undefined);
  public newUserConfigProvider: AuthConfigProvider;
  public preAuthStateType = PreAuthStateType;
  private directive = viewChild(ExtDirective, { read: ExtDirective });

  /**
   * Used to handle focus as components pop-in/out
   */
  private authPropertyInput = viewChildren(MatInput);
  private captchaComponent = viewChild(CaptchaComponent);

  /**
   * Checks, whether the form should be hidden.
   */
  public isFormHidden = computed(() => this.selectedConfigProvider()?.isOAuth2 || !!this.selectedConfigProvider()?.preAuthProps?.length);

  /**
   * Returns the selected configuration providere preAuthState.
   */
  public selectedProviderPreAuthState = computed(() => this.selectedConfigProvider()?.preAuthState);

  /**
   * Checks whether the login button should be hidden.
   */
  public showLoginButton = computed(
    () => this.selectedProviderPreAuthState() == this.preAuthStateType.Auth || !this.selectedProviderPreAuthState(),
  );

  /**
   * Check if required forms are filled before trying to login
   */
  public isLoginDisabled = computed(() => !this.selectedConfigProvider());

  /**
   * Checks whether the back button should be hidden.
   */
  public showBackButton = computed(() =>
    [this.preAuthStateType.Auth, this.preAuthStateType.Captcha].includes(this.selectedProviderPreAuthState()!),
  );

  /**
   * Checks whether the show account button should be hidden
   */
  public showCreateAccountButton = computed(
    () =>
      this.newUserConfigProvider &&
      (this.selectedProviderPreAuthState() === this.preAuthStateType.PreAuth ||
        (!this.selectedProviderPreAuthState() && !!this.selectedConfigProvider()?.authProps?.length)),
  );

  /**
   * Checks whether we show the password forgot button
   */
  public showPasswordReset = computed(
    () =>
      this.passwordResetHref &&
      this.showLoginButton() &&
      this.selectedConfigProvider()?.authProps?.some((prop) => prop.inputType === 'password'),
  );

  /**
   * Href to redirect to the password portal
   */
  public passwordResetHref: string;
  public loading: WritableSignal<boolean> = signal(false);

  private readonly newUserConfigProviderName = 'NewUser';
  private readonly authProviderStorageKey = 'selectedAuthProvider';

  // Injected services
  private appConfigService = inject(AppConfigService);
  private authentication = inject(AuthenticationService);
  private busyService = inject(EuiLoadingService);
  private captchaService = inject(CaptchaService);
  private componentFactoryResolver = inject(ComponentFactoryResolver);
  private detector = inject(HighContrastModeDetector);
  private logger = inject(ClassloggerService);
  private recaptchaV3Service = inject(ReCaptchaV3Service);
  private router = inject(Router);
  private systemInfoService = inject(SystemInfoService);
  private splash = inject(SplashService);
  private themeService = inject(EuiThemeService);
  public elementalUiConfigService = inject(ElementalUiConfigService);


  constructor() {
    // Initital signals / computed signals
    this.title = this.appConfigService.title();
    this.sessionState = toSignal(this.authentication.onSessionResponse);
    // Only set this if we are not in the password portal already
    if (this.appConfigService.Config.WebAppIndex !== PortalIdentifiers.PwdReset.id)
      this.passwordResetHref = [this.appConfigService.BaseUrl, 'html', PortalIdentifiers.PwdReset.suburl].join('/');
    effect(async () => this.setupProviders());

    // Initial setup
    effect(async () => {
      await this.setupFromConfig();
      if (!this.selectedConfigProvider()) {
        await this.setupProviders();
      }
      this.initCustomAuthFlowView(this.selectedConfigProvider());
      this.splash.close();
    });

    // Handle session state changes
    effect(async () => await this.handleSessionStateChange());
    // Handle focus on the auth properties
    effect(() => {
      // filter for any fields that are not in the login data or are empty
      const emptyInputs = this.authPropertyInput()?.filter(
        (input) => !(input.name in this.loginData) || this.loginData[input.name].length === 0
      );
      // Append capcha input if its there
      if (this.captchaComponent()) emptyInputs.push(this.captchaComponent()!.captchaInputField());
      // Find the first control that is not disabled and empty and focus it
      if (emptyInputs.length > 0) emptyInputs.slice(0)[0].focus();
    });
  }

  public ngOnDestroy(): void {
    document.body.classList.remove('recaptcha');
  }

  /**
   * Setup the initial screen with metadata and theme
   */
  private async setupFromConfig(): Promise<void> {
    document.body.classList.add('recaptcha');
    const config = await this.systemInfoService.getImxConfig();
    if (config?.DefaultHtmlTheme) {
      if (config.DefaultHtmlTheme === 'eui-auto-theme' && this.detector.getHighContrastMode() > 0) {
        this.themeService.setTheme(EuiTheme.CONTRAST);
      } else if (
        this.appConfigService.Config.WebAppIndex === PortalIdentifiers.Admin.id ||
        this.appConfigService.Config.WebAppIndex === PortalIdentifiers.Manager.id
      ) {
        this.themeService.setTheme(EuiTheme.LIGHT);
      } else {
        this.themeService.setTheme(<EuiTheme>config?.DefaultHtmlTheme);
      }
    }

    if (config?.CompanyLogoUrl) {
      // make relative URL absolute if needed
      this.customLogoUrl = new URL(config.CompanyLogoUrl, this.appConfigService.BaseUrl).href;
    }

    if (config?.ProductName) this.copyright.productName = config.ProductName;
  }

  /**
   * Create a provider optionset from the session state for the auth dropdown
   * @returns
   */
  private async setupProviders(): Promise<void> {
    if (Object.keys(this.sessionState() ?? {}).length === 0) {
      // if sessionState is empty we have to update it
      await this.authentication.update();
    }
    if (!this.initialLoad) return;
    const providers = this.sessionState()?.configurationProviders ?? [];

    this.authentication.authConfigProviders?.forEach((registeredProvider) => {
      if (!providers.find((provider) => provider.name === registeredProvider.name)) {
        providers.push(registeredProvider);
      }
    });

    const newUserIndex = providers.findIndex((x) => x.name === this.newUserConfigProviderName);
    if (newUserIndex > -1) {
      // Remove the newuser provider from the list, it isn't a dropdown option but rather a button
      [this.newUserConfigProvider] = providers.splice(newUserIndex, 1);
    }

    this.configurationProviders = providers.map((provider) => {
      if (provider.preAuthState === this.preAuthStateType.Captcha || provider.preAuthState === this.preAuthStateType.Auth) {
        provider.preAuthState = this.preAuthStateType.PreAuth;
      }
      return { display: provider.display, value: provider };
    });
  }

  /**
   * Handle the session state change
   * @returns
   */
  private async handleSessionStateChange(): Promise<void> {
    this.logger.debug(this, 'LoginComponent - subscription - onSessionResponse');
    this.logger.trace(this, 'sessionState', this.sessionState());
    if (this.sessionState()?.IsLoggedIn) {
      // Navigate to the start page
      this.logger.debug(this, 'subscription - call navigate');
      await this.router.navigate([this.appConfigService.Config.routeConfig?.start], { queryParams: {} });
    } else {
      // We have no configuration providers, or we already have passed through this logic
      if (!this.sessionState()?.configurationProviders || !this.initialLoad) return;

      // Modify the preauth state to the correct type
      this.logger.debug(this, 'subscription - updating session config');
      this.sessionState()!.configurationProviders!.map((configProvider) => {
        configProvider.preAuthState = !!configProvider.preAuthState ? this.preAuthStateType.PreAuth : undefined;
      });

      // Set the chosen config provider based on local storage or just the first item in the list
      const configProvider =
        this.sessionState()!.configurationProviders!.find(
          (authProvider) => authProvider.name === localStorage.getItem(this.authProviderStorageKey),
        ) || this.sessionState()!.configurationProviders![0];
      if (configProvider) {
        this.selectedConfigProvider.set(configProvider);
        this.authMethodFormControl.setValue(this.selectedConfigProvider());
        this.loginData = { Module: configProvider.name };
      }
      this.initialLoad = false;
    }
  }

  /**
   * Initializes the custom authentication by creating the entry component.
   */
  private initCustomAuthFlowView(configProvider?: AuthConfigProvider, shouldClear = true): void {
    if (!this.directive() || !this.directive()?.viewContainerRef) {
      return;
    }
    if (shouldClear) this.directive()!.viewContainerRef.clear();

    if (configProvider?.customAuthFlow)
      this.directive()!.viewContainerRef.createComponent(
        this.componentFactoryResolver.resolveComponentFactory(configProvider.customAuthFlow.getEntryComponent()),
      );
  }

  /**
   * Calls authentication service logout function.
   */
  public async logoutOAuth(): Promise<void> {
    this.logger.debug(this, 'logoutOAuth');
    return this.authentication.logout(this.sessionState());
  }

  /**
   * Calls the required login method.
   */
  public async login(): Promise<void> {
    this.logger.debug(this, 'LoginComponent - login');

    if (this.selectedConfigProvider()) {
      if (this.selectedConfigProvider()!.isOAuth2) {
        this.logger.debug(this, 'LoginComponent - login - oauth2');
        await this.authentication.oauthRedirect(this.selectedConfigProvider()!.name);
        return;
      } else if (this.selectedConfigProvider()!.customAuthFlow) {
        throw new Error('Method not valid for a custom auth flow.');
      }
    }

    if (this.busyService.overlayRefs.length === 0) {
      this.busyService.show();
    }
    this.loading.set(true);
    try {
      const session = await this.authentication.login(this.loginData);
      if (!session?.IsLoggedIn) await this.checkPreAuth();
    } finally {
      this.logger.debug(this, 'LoginComponent - login - attempt completed');
      this.busyService.hide();
      this.loading.set(false);
    }
  }

  /**
   * Updates the localStorage and calls initCustAuthFlowView with the selected configuration provider.
   */
  public onSelectAuthConfig(authConfig?: EuiSelectOption | EuiSelectOption[]): void {
    if (authConfig) {
      if (Array.isArray(authConfig)) this.selectedConfigProvider.set(authConfig[0].value);
      else this.selectedConfigProvider.set(authConfig.value);
    }
    this.logger.debug(this, 'LoginComponent - onSelectAuthConfig', this.selectedConfigProvider()!.name);
    localStorage.setItem(this.authProviderStorageKey, this.selectedConfigProvider()!.name);
    this.loginData = { Module: this.selectedConfigProvider()!.name };
    this.initCustomAuthFlowView(this.selectedConfigProvider());
  }

  public async createNewAccount(): Promise<void> {
    // Prevent the content from being cleared incase the sidesheet is closed unsuccessfully
    this.initCustomAuthFlowView(this.newUserConfigProvider, false);
  }

  /**
   * Checks if the login proceess needs captcha verification.
   */
  public async checkPreAuth(): Promise<void> {
    this.busyService.show();
    this.loading.set(true);
    try {
      const response = await this.authentication.preAuth(this.loginData);
      if (response) {
        await this.setupCaptcha();
      } else {
        this.selectedConfigProvider.update((currentVal) => ({
          ...currentVal!,
          preAuthState: this.preAuthStateType.Auth,
          preAuthProps: this.setAuthPropDisabledValue(currentVal!.preAuthProps!, true),
        }));
      }
    } finally {
      this.busyService.hide();
      this.loading.set(false);
    }
  }

  /**
   * Setup the selected configuration provider to preAuth state.
   */
  public async backToPreAuth(): Promise<void> {
    this.selectedConfigProvider.update((currentVal) => ({
      ...currentVal!,
      preAuthState: this.preAuthStateType.PreAuth,
      preAuthProps: this.setAuthPropDisabledValue(currentVal!.preAuthProps!, false),
    }));

    this.selectedConfigProvider()!
      .authProps?.filter((authProp) => !authProp.disabled)
      .map((authProp) => {
        if (this.loginData && authProp.name) delete this.loginData[authProp.name];
      });
  }

  /**
   * Verify the captcha with the recaptcha image component.
   */
  public async onVerifyCaptcha(): Promise<void> {
    this.busyService.show();
    try {
      const success = await this.authentication.preAuthVerify(this.captchaService.Response);
      if (success) {
        this.selectedConfigProvider.update((currentVal) => ({
          ...currentVal!,
          preAuthState: this.preAuthStateType.Auth,
          preAuthProps: this.setAuthPropDisabledValue(currentVal!.preAuthProps!, true),
        }));
      }
      // Always reint as the captcha is a one-time-use
      this.captchaService.ReinitCaptcha();
    } finally {
      this.busyService.hide();
    }
  }

  /**
   * Setup captcha verification.
   */
  private async setupCaptcha(): Promise<void> {
    if (this.captchaService.isReCaptchaV3) {
      let overlayRef = this.busyService.show();
      this.recaptchaV3Service.execute('login').subscribe(async (result) => {
        try {
          await this.authentication.preAuthVerify(result);
          this.selectedConfigProvider.update((currentVal) => ({
            ...currentVal!,
            preAuthState: this.preAuthStateType.Auth,
            preAuthProps: this.setAuthPropDisabledValue(currentVal!.preAuthProps!, true),
          }));
        } finally {
          this.busyService.hide(overlayRef);
        }
      });
    } else {
      this.selectedConfigProvider.update((currentVal) => ({
        ...currentVal!,
        preAuthState: this.preAuthStateType.Captcha,
        preAuthProps: this.setAuthPropDisabledValue(currentVal!.preAuthProps!, true),
      }));
    }
  }

  /**
   * Toggle the disabled state of the auth properties
   * @param props auth props
   * @param disabled
   * @returns
   */
  private setAuthPropDisabledValue(props: AuthPropDataProvider[], disabled: boolean): AuthPropDataProvider[] {
    return props?.map((prop) => ({ ...prop, disabled }));
  }
}
