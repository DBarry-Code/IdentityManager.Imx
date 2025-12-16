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

import { Component, computed, Signal } from '@angular/core';

import { ViewConfigData } from '@imx-modules/imx-api-qer';

import { DataViewSource } from 'qbm';
import { ViewConfigService } from '../../../view-config/view-config.service';
import { NewRequestOrchestrationService } from '../../new-request-orchestration.service';
import { NewRequestProductComponent } from '../../new-request-product/new-request-product.component';
import { SelectedProductSource } from '../../new-request-selected-products/selected-product-item.interface';

@Component({
    selector: 'imx-new-request-header-toolbar',
    templateUrl: './new-request-header-toolbar.component.html',
    styleUrls: ['./new-request-header-toolbar.component.scss'],
    standalone: false
})
export class NewRequestHeaderToolbarComponent {
  public SelectedProductSource = SelectedProductSource;
  public disableSearch: Signal<boolean> = computed(
    () => this.orchestration.disableSearch() || this.orchestration.selectedTab()?.link === 'productBundles',
  );
  public showCatInfo: Signal<boolean> = computed(() => this.orchestration.selectedTab()?.component === NewRequestProductComponent);
  public searchBoxText: Signal<string> = computed(() => {
    if (this.orchestration.selectedTab()?.link === 'allProducts') {
      if (this.orchestration.selectedCategory()) {
        return '#LDS#Search for products in this service category';
      } else {
        return '#LDS#Search for products in all service categories';
      }
    }
    if (this.orchestration.selectedTab()?.link === 'productsByPeerGroup') {
      return this.orchestration.selectedChip() === 0
        ? '#LDS#Search for products in this peer group'
        : '#LDS#Search for organizational structures in this peer group';
    }
    if (this.orchestration.selectedTab()?.link === 'productsByReferenceUser') {
      return this.orchestration.selectedChip() === 0
        ? '#LDS#Search for products of this identity'
        : '#LDS#Search for organizational structures of this identity';
    }
    if (this.orchestration.selectedTab()?.link === 'productBundles') {
      return '#LDS#Search for products in the selected product bundle';
    }
    return '#LDS#Search';
  });
  public showAllProductsToolbar: Signal<boolean> = computed(
    () =>
      this.orchestration.selectedView() === SelectedProductSource.AllProducts &&
      !this.disableSearch() &&
      !!this.orchestration.dataViewAllProducts(),
  );
  public showPeerGroupToolbar: Signal<boolean> = computed(
    () =>
      this.orchestration.selectedView() === SelectedProductSource.PeerGroupProducts &&
      !this.disableSearch() &&
      !!this.orchestration.dataViewPeerGroupProducts(),
  );
  public showPeerGroupOrgsToolbar: Signal<boolean> = computed(
    () =>
      this.orchestration.selectedView() === SelectedProductSource.PeerGroupOrgs &&
      !this.disableSearch() &&
      !!this.orchestration.dataViewPeerGroupOrgs(),
  );
  public showReferenceUserProductToolbar: Signal<boolean> = computed(
    () =>
      this.orchestration.selectedView() === SelectedProductSource.ReferenceUserProducts &&
      !this.disableSearch() &&
      !!this.orchestration.dataViewReferenceUserProducts(),
  );
  public showReferenceUserOrgsToolbar: Signal<boolean> = computed(
    () =>
      this.orchestration.selectedView() === SelectedProductSource.ReferenceUserOrgs &&
      !this.disableSearch() &&
      !!this.orchestration.dataViewReferenceUserOrgs(),
  );
  public showProductBundleToolbar: Signal<boolean> = computed(() => {
    return this.orchestration.selectedView() === SelectedProductSource.ProductBundles && !!this.orchestration.productBundle();
  });

  constructor(
    public readonly orchestration: NewRequestOrchestrationService,
    private viewConfigService: ViewConfigService,
  ) {}

  public async updateConfig(config: ViewConfigData, dataSource: DataViewSource, viewConfigPath: string): Promise<void> {
    await this.viewConfigService.putViewConfig(config);
    const viewConfig = await this.viewConfigService.getDSTExtensionChanges(viewConfigPath);
    dataSource.viewConfig.set(viewConfig);
  }

  public async deleteConfigById(id: string, dataSource: DataViewSource, viewConfigPath: string): Promise<void> {
    await this.viewConfigService.deleteViewConfig(id);
    const viewConfig = await this.viewConfigService.getDSTExtensionChanges(viewConfigPath);
    dataSource.viewConfig.set(viewConfig);
  }
}
