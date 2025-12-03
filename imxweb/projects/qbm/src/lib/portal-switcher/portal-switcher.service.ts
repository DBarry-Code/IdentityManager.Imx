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


import { Inject, Injectable, signal, DOCUMENT } from '@angular/core';
import { NodeAppInfo } from '@imx-modules/imx-api-qbm';
import { AppConfigService } from '../appConfig/appConfig.service';
import { SystemInfoService } from '../system-info/system-info.service';
import { PortalIdentifiers } from './portal-indentifier';

@Injectable({
  providedIn: 'root',
})
export class PortalSwitcherService {
  /**
   * Reads from the config whether the portal switcher should be enabled
   */
  public isEnabled = signal(false);

  /**
   *
   */
  public dataLoading = signal(false);

  private abortController = new AbortController();
  private portalList: NodeAppInfo[];
  private filteredList: NodeAppInfo[];

  constructor(
    private appConfig: AppConfigService,
    @Inject(DOCUMENT) private document: Document,
    private systemInfoService: SystemInfoService,
  ) {}

  /**
   * Initialize the service with non-blocking setup calls
   */
  public async initService(): Promise<void> {
    this.systemInfoService.getImxConfig().then((config) => this.isEnabled.set(config.PortalSwitcherEnabled));
    this.getPortals();
  }

  /**
   * Get portals available to navigate to, sorted by display name
   * @returns
   */
  public async getPortals(): Promise<NodeAppInfo[]> {
    if (this.filteredList) return this.filteredList;
    this.dataLoading.set(true);
    try {
      this.abortCall();
      this.portalList = await this.appConfig.v2client.imx_applications_get();
      this.portalList.sort((a, b) => a?.DisplayName!.localeCompare(b?.DisplayName!));
      this.filterPortals();
    } finally {
      this.dataLoading.set(false);
      return this.filteredList;
    }
  }

  private abortCall(): void {
    this.abortController.abort();
    this.abortController = new AbortController();
  }

  /**
   * Find which portal we currently are, use it to filter out. Also filter by toggled off portals
   */
  private filterPortals(): void {
    // Find which portal we currently are, use it to filter out. Also filter by toggled off portals
    const thisPortal = Object.values(PortalIdentifiers).find((portal) => portal.id === this.appConfig.Config.WebAppIndex);
    this.filteredList = this.portalList.filter((portal) => portal.DisplaySwitchTo && thisPortal?.suburl !== portal?.Name);

    // If there are no enabled portals outside the current one, then we disable the button entirely
    if (this.filteredList.length === 0) this.isEnabled.set(false);
  }

  /**
   * Navigate to the other portal via an external link as its a separate application
   * @param portal
   */
  public handleNavigation(newPortal: NodeAppInfo): void {
    this.filterPortals();
    this.document.location.href = [this.appConfig.BaseUrl, 'html', newPortal.Name].join('/');
  }
}
