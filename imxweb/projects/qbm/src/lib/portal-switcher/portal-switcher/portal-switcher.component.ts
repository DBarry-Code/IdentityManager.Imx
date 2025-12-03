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


import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EuiCoreModule, EuiSidesheetService } from '@elemental-ui/core';
import { NodeAppInfo } from '@imx-modules/imx-api-qbm';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { calculateSidesheetWidth } from '../../base/sidesheet-helper';
import { PortalSwitcherSidesheetComponent } from '../portal-switcher-sidesheet/portal-switcher-sidesheet.component';
import { PortalSwitcherService } from '../portal-switcher.service';

@Component({
    selector: 'imx-portal-switcher',
    imports: [MatButtonModule, MatProgressSpinnerModule, MatTooltipModule, EuiCoreModule, TranslateModule],
    templateUrl: './portal-switcher.component.html',
    styleUrl: './portal-switcher.component.scss'
})
export class PortalSwitcherComponent {
  constructor(
    public portalSwitcherService: PortalSwitcherService,
    private sidesheetService: EuiSidesheetService,
    private translateService: TranslateService,
  ) {
    // Get data on init to pre-load
    this.portalSwitcherService.initService();
  }

  /**
   * Open portal switcher sidesheet
   */
  public async openPortalSwitcherSidesheet(): Promise<void> {
    const portalList = await this.portalSwitcherService.getPortals();

    this.sidesheetService
      .open(PortalSwitcherSidesheetComponent, {
        title: this.translateService.instant('#LDS#Heading Switch Application'),
        icon: 'gridsmall',
        padding: '0',
        width: calculateSidesheetWidth(680),
        data: {
          portalList,
        },
      })
      .afterClosed()
      .subscribe((portal?: NodeAppInfo) => {
        if (!portal) return;
        this.portalSwitcherService.handleNavigation(portal);
      });
  }
}
