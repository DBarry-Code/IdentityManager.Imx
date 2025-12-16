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

import { Component, effect, Input, OnDestroy, Optional } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { EuiLoadingService, EuiSidesheetService, EuiTopNavigationItem } from '@elemental-ui/core';
import { Subscription } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';
import { AboutComponent } from '../about/About.component';
import { AboutService } from '../about/About.service';
import { AppConfigService } from '../appConfig/appConfig.service';
import { AuthenticationService } from '../authentication/authentication.service';
import { calculateSidesheetWidth, isMobile } from '../base/sidesheet-helper';
import { ConfirmationService } from '../confirmation/confirmation.service';
import { ConnectionComponent } from '../connection/connection.component';
import { ExtService } from '../ext/ext.service';
import { IExtension } from '../ext/extension';
import { PortalIdentifiers } from '../portal-switcher/portal-indentifier';
import { ProcessingQueueService } from '../processing-queue/processing-queue.service';
import { ISessionState } from '../session/session-state';
import { SystemInfoService } from '../system-info/system-info.service';
import { MastHeadService } from './mast-head.service';

/**
 * Masthead of IMX web applications. It can contain dynamic menus or buttons, emitting menus/menu itmes when selected.
 *
 * @example
 * Template containing a masthead.
 *
 * <ng-container *ngIf="isLoggedIn">
 *  <imx-mast-head [menuList]="mastheadMenuList" (menuItemClicked)="onMenuItemClicked($event)"></imx-mast-head>
 *  <imx-menu [menuItems]="menuItems"></imx-menu>
 *  <imx-usermessage></imx-usermessage>
 * </ng-container>
 * <router-outlet></router-outlet>
 *
 * The supplied "mastheadMenuList" Input contains two menus and one button as follows:
 *
 *  this.mastheadMenuList =
 *     [{
 *       iconName: 'user',
 *       identifier: 'user-menu',
 *       type: 'menu',
 *       menuItems:
 *         [
 *           {
 *             identifier: 'user-menu-profile',
 *             caption: '#LDS#Menu Entry My profile'
 *           },
 *           {
 *             identifier: 'user-menu-addressbook',
 *             caption: '#LDS#Menu Entry Address book'
 *           }
 *         ]
 *     },
 *     {
 *       iconName: 'performance',
 *       identifier: 'performance-menu',
 *       type: 'menu',
 *       menuItems:
 *         [
 *           {
 *             identifier: 'performance-menu-item3',
 *             caption: '#LDS#Item 3'
 *           },
 *           {
 *             identifier: 'performance-menu-item4',
 *             caption: '#LDS#Item 4'
 *           }
 *         ]
 *     },
 *     {
 *       iconName: 'reports',
 *       identifier: 'reports-button',
 *       type: 'button',
 *       menuItems: []
 *     }];
 *
 * NOTE: If you want to use a button instead of a menu, the "type" field has to be set to "button" instead of "menu".
 *
 */
@Component({
  selector: 'imx-mast-head',
  templateUrl: './mast-head.component.html',
  styleUrls: ['./mast-head.component.scss'],
  standalone: false
})
export class MastHeadComponent implements OnDestroy {
  public isQueueFinished: boolean;
  public canUseChatbot: boolean;
  /**
   * When these {@link EuiTopNavigationItem|items} are set, the menu is displayed.
   */
  @Input() public menuItems: EuiTopNavigationItem[];

  public get isMobile(): boolean {
    return isMobile();
  }

  public get isAuthenticated(): boolean {
    return this.sessionState?.IsLoggedIn ?? false;
  }

  public get isAppOverview(): boolean {
    return this.appConfig?.Config?.WebAppIndex === PortalIdentifiers.Admin.id && this.router.url === '/';
  }
  public get isAppAdminPortal(): boolean {
    return this.appConfig?.Config?.WebAppIndex === PortalIdentifiers.Admin.id && this.router.url === '/dashboard';
  }

  public sessionState: ISessionState;
  public logoUrl: string;
  public productName: string;
  public extensions: IExtension[] = [];

  private readonly subscriptions: Subscription[] = [];

  constructor(
    @Optional() public aboutInfoService: AboutService,
    public readonly appConfig: AppConfigService,
    private readonly systemInfoService: SystemInfoService,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly confirmationService: ConfirmationService,
    private queueService: ProcessingQueueService,
    private readonly busyService: EuiLoadingService,
    public readonly mastHeadService: MastHeadService,
    private readonly authentication: AuthenticationService,
    private readonly sideSheetService: EuiSidesheetService,
    private readonly translate: TranslateService,
    private readonly extService: ExtService,
  ) {
    effect(() => (this.isQueueFinished = this.queueService.isAllGroupsCompleted()));
    this.subscriptions.push(
      this.authentication.onSessionResponse.subscribe(async (sessionState: ISessionState) => {
        this.sessionState = sessionState;
        if (this.sessionState.IsLoggedIn) await this.checkChatbotExtension();
      })
    );

    // apply custom logo from configuration
    this.systemInfoService.getImxConfig().then((config) => {
      if (config.CompanyLogoUrl) {
        // make relative URL absolute if needed
        this.logoUrl = new URL(config.CompanyLogoUrl, this.appConfig.BaseUrl).href;
      }
      const name = config.ProductName;
      if (name) {
        this.productName = name;
      }
    });

    this.getDynamicExtensions();
  }

  public async checkChatbotExtension() {
    this.canUseChatbot = false;
    const ext = this.extService.Registry['chatbotMastButton'];
    if (ext && ext.length > 0 && ext[0]?.inputData?.checkVisibility) {
      this.canUseChatbot = await ext[0].inputData.checkVisibility();
    }
  }

  public getDynamicExtensions(): void {
    this.extensions = this.extService.Registry['mastHead'];
  }

  public showExtension(extension: IExtension): void {
    if (!!extension.inputData.url) {
      this.router.navigate([extension.inputData.url]);
    }
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  /**
   * For navigating home, you know.
   */
  public goHome(): void {
    if (!this.isAppOverview) this.router.navigate([this.appConfig.Config.routeConfig?.start], { queryParams: {} });
  }

  /**
   * Opens the About view.
   */
  public openAboutDialog(): void {
    this.dialog.open(AboutComponent, { panelClass: 'imx-AboutPanel' });
  }

  /**
   * Opens the Connection sidesheet.
   */
  public async openConnection(): Promise<void> {
    const data = await this.mastHeadService.getConnectionData(this.appConfig.Config.WebAppIndex);

    await this.sideSheetService
      .open(ConnectionComponent, {
        icon: 'rss',
        title: this.translate.instant('#LDS#Heading Connection Information'),
        padding: '0px',
        width: calculateSidesheetWidth(),
        data: data,
      })
      .afterClosed()
      .toPromise();
  }

  /**
   * Logs out and kills the session.
   */
  public async logout(): Promise<void> {
    if (
      this.isQueueFinished &&
      (await this.confirmationService.confirm({
        Title: '#LDS#Heading Log Out',
        Message: '#LDS#Are you sure you want to log out?',
        identifier: 'confirm-logout-',
      }))
    ) {
      if (this.busyService.overlayRefs.length === 0) {
        this.busyService.show();
      }
      try {
        this.queueService.clearProcessing();
        await this.authentication.logout();
      } finally {
        this.busyService.hide();
      }
    }

    if (
      !this.isQueueFinished &&
      (await this.confirmationService.confirm({
        Title: '#LDS#Heading Unfinished Processes',
        Message: '#LDS#There are still background processes that are not completed. Are you sure you want to log out?',
        identifier: 'confirm-logout-busy-queue',
      }))
    ) {
      this.busyService.show();
      try {
        this.queueService.clearProcessing();
        await this.authentication.logout();
      } finally {
        this.busyService.hide();
      }
    }
  }
}
