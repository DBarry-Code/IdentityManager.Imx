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

import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { EUI_SIDESHEET_DATA, EuiCoreModule, EuiSidesheetRef } from '@elemental-ui/core';
import { NodeAppInfo } from '@imx-modules/imx-api-qbm';
import { AppConfigService } from '../../appConfig/appConfig.service';

@Component({
  imports: [CommonModule, MatCardModule, EuiCoreModule],
  templateUrl: './portal-switcher-sidesheet.component.html',
  styleUrl: './portal-switcher-sidesheet.component.scss',
})
export class PortalSwitcherSidesheetComponent {
  constructor(
    @Inject(EUI_SIDESHEET_DATA) public data: { portalList: NodeAppInfo[] },
    private sidesheetRef: EuiSidesheetRef,
    private appConfig: AppConfigService,
  ) {}

  public portalSelected(portal: NodeAppInfo): void {
    this.sidesheetRef.close(portal);
  }

  public getPortalUrl(portal: NodeAppInfo): string {
    return `${this.appConfig.BaseUrl}/html/${portal.Name}`;
  }
}
