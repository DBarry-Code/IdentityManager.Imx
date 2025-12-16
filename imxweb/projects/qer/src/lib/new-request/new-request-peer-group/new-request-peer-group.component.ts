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

import { Component, effect, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';

import { PortalItshopPeergroupMemberships, PortalShopServiceitems, ServiceItemsExtendedData } from '@imx-modules/imx-api-qer';
import {
  CollectionLoadParameters,
  DisplayColumns,
  ExtendedTypedEntityCollection,
  IClientProperty,
  MultiValue,
  TypedEntity,
} from '@imx-modules/imx-qbm-dbts';

import { MatDialog } from '@angular/material/dialog';
import {
  BusyService,
  DataSourceToolbarComponent,
  DataSourceToolbarSettings,
  DataViewInitParameters,
  DataViewSource,
  DataViewSourceFactoryService,
  HELP_CONTEXTUAL,
  ImxTranslationProviderService,
  SettingsService,
} from 'qbm';
import { ItshopService } from '../../itshop/itshop.service';
import { NewRequestOrchestrationService } from '../new-request-orchestration.service';
import { NewRequestCategoryApiService } from '../new-request-product/new-request-category-api.service';
import { NewRequestProductApiService } from '../new-request-product/new-request-product-api.service';
import { ProductDetailsService } from '../new-request-product/product-details-sidesheet/product-details.service';
import { ServiceItemParameters } from '../new-request-product/service-item-parameters';
import { SelectedProductSource } from '../new-request-selected-products/selected-product-item.interface';
import { NewRequestSelectionService } from '../new-request-selection.service';
import { PeerGroupDiscardSelectedComponent } from './peer-group-discard-selected.component';

@Component({
  selector: 'imx-new-request-peer-group',
  templateUrl: './new-request-peer-group.component.html',
  styleUrls: ['./new-request-peer-group.component.scss'],
  providers: [DataViewSource],
  standalone: false,
})
export class NewRequestPeerGroupComponent implements OnDestroy {
  public selectedChipIndex = 0;
  public membershipDst: DataSourceToolbarComponent;
  public membershipDstSettings: DataSourceToolbarSettings;
  public membershipNavigationState: CollectionLoadParameters | ServiceItemParameters;
  public DisplayColumns = DisplayColumns;
  public displayedProductColumns: IClientProperty[];
  public displayedMembershipColumns: IClientProperty[];
  public peerGroupSize = 0;
  public SelectedProductSource = SelectedProductSource;
  public contextId = HELP_CONTEXTUAL.NewRequestRecommendedProduct;
  public productDataSource: DataViewSource<PortalShopServiceitems, ServiceItemsExtendedData>;
  public membershipDataSource: DataViewSource<PortalItshopPeergroupMemberships, ServiceItemsExtendedData>;
  public isLoading: boolean;
  public readonly currentCulture: string;

  private recipientsIds: string | undefined;
  private subscriptions: Subscription[] = [];

  constructor(
    public readonly productApi: NewRequestProductApiService,
    public readonly membershipApi: ItshopService,
    public readonly productDetailsService: ProductDetailsService,
    public readonly selectionService: NewRequestSelectionService,
    public readonly orchestration: NewRequestOrchestrationService,
    private readonly categoryApi: NewRequestCategoryApiService,
    private readonly settingService: SettingsService,
    public readonly busyService: BusyService,
    private readonly dialog: MatDialog,
    public dataSourceFactory: DataViewSourceFactoryService,
    private readonly translationProviderService: ImxTranslationProviderService,
  ) {
    this.orchestration.selectedView.set(SelectedProductSource.PeerGroupProducts);
    this.orchestration.selectedChip.set(0);

    this.displayedProductColumns = [
      this.productApi.entitySchema.Columns[DisplayColumns.DISPLAY_PROPERTYNAME],
      this.productApi.entitySchema.Columns.CountInPeerGroup,
      this.productApi.entitySchema.Columns.ServiceCategoryFullPath,
      this.productApi.entitySchema.Columns.Description,
      this.productApi.entitySchema.Columns.OrderableStatus,
    ];

    this.displayedMembershipColumns = [
      this.membershipApi.PortalItshopPeergroupMembershipsSchema.Columns[DisplayColumns.DISPLAY_PROPERTYNAME],
      this.membershipApi.PortalItshopPeergroupMembershipsSchema.Columns.CountInPeerGroup,
      this.membershipApi.PortalItshopPeergroupMembershipsSchema.Columns.FullPath,
      this.membershipApi.PortalItshopPeergroupMembershipsSchema.Columns.Description,
    ];

    this.productDataSource = dataSourceFactory.getDataSource<PortalShopServiceitems, ServiceItemsExtendedData>();
    this.membershipDataSource = dataSourceFactory.getDataSource<PortalItshopPeergroupMemberships, ServiceItemsExtendedData>();
    this.orchestration.dataViewPeerGroupProducts.set(this.productDataSource);
    this.orchestration.dataViewPeerGroupOrgs.set(this.membershipDataSource);
    this.currentCulture = this.translationProviderService.CultureFormat;

    //#region Subscriptions

    effect(() => {
      if (this.orchestration.recipientsIds() !== this.recipientsIds) {
        this.recipientsIds = this.orchestration.recipientsIds();
        const recipientsVals = MultiValue.FromString(this.orchestration.recipients()?.Column.GetValue())?.GetValues();
        if (recipientsVals.length > 1) {
          this.dialog
            .open(PeerGroupDiscardSelectedComponent)
            .afterClosed()
            .subscribe((result) => {
              if (result) {
                const firstRecipient = {
                  DataValue: recipientsVals?.[0],
                  DisplayValue: MultiValue.FromString(this.orchestration.recipients()?.Column.GetDisplayValue() || '').GetValues()?.[0],
                };
                this.orchestration.setRecipients(firstRecipient).then(() => this.getData());
              }
            });
        } else {
          this.getData();
        }
      }
    });

    this.subscriptions.push(
      this.selectionService.selectedProductsCleared$.subscribe(() => {
        this.productDataSource.selection.clear();
        this.membershipDataSource.selection.clear();
      }),
    );

    this.subscriptions.push(
      this.busyService.busyStateChanged.subscribe((value) => {
        this.isLoading = value;
      }),
    );
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
    this.orchestration.dataViewPeerGroupProducts.set(undefined);
    this.orchestration.dataViewPeerGroupOrgs.set(undefined);
  }

  public onSelectionChanged(items: TypedEntity[] | PortalItshopPeergroupMemberships[], type: SelectedProductSource): void {
    type === SelectedProductSource.PeerGroupProducts
      ? this.selectionService.addProducts(items, this.productDataSource.data, SelectedProductSource.PeerGroupProducts)
      : this.selectionService.addProducts(items, this.membershipDataSource.data, SelectedProductSource.PeerGroupOrgs);
  }

  public async onRowSelected(item: TypedEntity): Promise<void> {
    if (!!this.orchestration.recipients()) {
      this.productDetailsService.showProductDetails(item, this.orchestration.recipients()!);
    }
  }

  public getCIPGCurrentValue(prod: any): number {
    return (100 * prod.CountInPeerGroup?.value) / this.peerGroupSize;
  }

  public async onChipClicked(index: number): Promise<void> {
    this.selectedChipIndex = index;
    this.orchestration.selectedChip.set(index);

    if (index === 0) {
      this.orchestration.selectedView.set(SelectedProductSource.PeerGroupProducts);
      await this.getProductData();
    }
    if (index === 1) {
      this.orchestration.selectedView.set(SelectedProductSource.PeerGroupOrgs);
      await this.getMembershipData();
    }
  }

  private async getData(): Promise<void> {
    if (this.selectedChipIndex === 0 && this.orchestration.selectedView() === SelectedProductSource.PeerGroupProducts) {
      await this.getProductData();
    }
    if (this.selectedChipIndex === 1 && this.orchestration.selectedView() === SelectedProductSource.PeerGroupOrgs) {
      await this.getMembershipData();
    }
  }

  private async getProductData(): Promise<void> {
    let busy;
    let load: boolean;
    try {
      this.orchestration.abortCall();

      busy = this.busyService.beginBusy();

      const userParams = {
        UID_Person: this.orchestration.recipients()
          ? MultiValue.FromString(this.orchestration.recipients()?.value || '')
              .GetValues()
              .join(',')
          : undefined,
        ParentKey: '',
        PageSize: -1,
      };
      const servicecategories = await this.categoryApi.get(userParams);
      const serviceCategoriesTotalCount = servicecategories?.totalCount;

      busy.endBusy();
      if (serviceCategoriesTotalCount < 1) {
        this.orchestration.disableSearch.set(true);
        return;
      }
      const dataViewInitParameters: DataViewInitParameters<PortalShopServiceitems, ServiceItemsExtendedData> = {
        execute: (
          params: CollectionLoadParameters,
          signal: AbortSignal,
        ): Promise<ExtendedTypedEntityCollection<PortalShopServiceitems, ServiceItemsExtendedData>> => {
          const parameters = this.getCollectionLoadParamaters(params);
          return this.productApi.get(parameters, signal).then(async (data) => {
            if (data) {
              data.Data = await this.selectionService.addSelectionKeyColumn(data.Data);
              // sort by CountInPeerGroup value
              data.Data?.sort((a, b) => {
                if (a?.CountInPeerGroup?.value < b?.CountInPeerGroup.value) return 1;
                if (a?.CountInPeerGroup?.value > b?.CountInPeerGroup.value) return -1;
                return a?.GetEntity().GetDisplay().localeCompare(b?.GetEntity().GetDisplay());
              });

              this.peerGroupSize = data.extendedData?.PeerGroupSize || 0;
              this.orchestration.disableSearch.set(false);
            }
            return data;
          });
        },
        schema: this.productApi.entitySchema,
        columnsToDisplay: this.displayedProductColumns,
        highlightEntity: (product: PortalShopServiceitems) => {
          this.onRowSelected(product);
        },
        selectionChange: (products: PortalShopServiceitems[]) =>
          this.onSelectionChanged(products as TypedEntity[], SelectedProductSource.PeerGroupProducts),
      };
      await this.productDataSource.init(dataViewInitParameters);
      this.orchestration.preselectBySource(this.productDataSource);
    } finally {
      busy.endBusy();
    }
  }

  private async getMembershipData(): Promise<void> {
    const dataViewInitParameters: DataViewInitParameters<PortalItshopPeergroupMemberships, ServiceItemsExtendedData> = {
      execute: (
        params: CollectionLoadParameters,
        signal: AbortSignal,
      ): Promise<ExtendedTypedEntityCollection<PortalItshopPeergroupMemberships, ServiceItemsExtendedData>> => {
        const parameters = this.getCollectionLoadParamaters(params);
        return this.membershipApi.getPeerGroupMemberships(parameters, { signal }).then(async (data) => {
          if (data) {
            data.Data = await this.selectionService.addSelectionKeyColumn(data.Data);
            // sort by CountInPeerGroup value
            data.Data?.sort((a, b) => {
              if (a?.CountInPeerGroup?.value < b?.CountInPeerGroup.value) return 1;
              if (a?.CountInPeerGroup?.value > b?.CountInPeerGroup.value) return -1;
              return a?.GetEntity().GetDisplay().localeCompare(b?.GetEntity().GetDisplay());
            });
            this.orchestration.disableSearch.set(data.totalCount < 1);
            this.peerGroupSize = data.extendedData?.PeerGroupSize || 0;
          }
          return data;
        });
      },
      schema: this.membershipApi.PortalItshopPeergroupMembershipsSchema,
      columnsToDisplay: this.displayedMembershipColumns,
      selectionChange: (products: PortalItshopPeergroupMemberships[]) =>
        this.onSelectionChanged(products as TypedEntity[], SelectedProductSource.PeerGroupOrgs),
    };
    await this.membershipDataSource.init(dataViewInitParameters);
    this.orchestration.preselectBySource(this.membershipDataSource);
  }

  private getCollectionLoadParamaters(
    navigationState: CollectionLoadParameters | ServiceItemParameters,
  ): CollectionLoadParameters | ServiceItemParameters {
    return {
      ...navigationState,
      UID_Person: this.orchestration.recipients()
        ? MultiValue.FromString(this.orchestration.recipients()!.value).GetValues().join(',')
        : undefined,
      UID_PersonPeerGroup: this.orchestration.recipients()
        ? MultiValue.FromString(this.orchestration.recipients()!.value).GetValues().join(',')
        : undefined,
      PageSize: this.settingService.PageSizeForAllElements,
    };
  }
}
