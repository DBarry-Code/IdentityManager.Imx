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

import { Component, effect, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { CartPatternItemDataRead, PortalItshopPatternItem, PortalItshopPatternRequestable } from '@imx-modules/imx-api-qer';
import {
  CollectionLoadParameters,
  DisplayColumns,
  EntitySchema,
  ExtendedTypedEntityCollection,
  IClientProperty,
  ValType,
} from '@imx-modules/imx-qbm-dbts';
import { DataViewInitParameters, DataViewSource, DataViewSourceFactoryService } from 'qbm';

import { PatternItemService } from '../../../pattern-item-list/pattern-item.service';
import { ServiceItemsService } from '../../../service-items/service-items.service';
import { NewRequestOrchestrationService } from '../../new-request-orchestration.service';
import { ProductDetailsService } from '../../new-request-product/product-details-sidesheet/product-details.service';
import { SelectedProductSource } from '../../new-request-selected-products/selected-product-item.interface';
import { NewRequestSelectionService } from '../../new-request-selection.service';

@Component({
  selector: 'imx-product-bundle-items',
  templateUrl: './product-bundle-items.component.html',
  styleUrls: ['./product-bundle-items.component.scss'],
  providers: [DataViewSource],
  standalone: false,
})
export class ProductBundleItemsComponent implements OnInit, OnDestroy {
  // #region Private
  private subscriptions: Subscription[] = [];
  private bundleItems: PortalItshopPatternItem[] = [];

  // #endregion

  // #region Public
  public DisplayColumns = DisplayColumns;
  public displayedColumns: IClientProperty[];
  public selectedProductBundle: PortalItshopPatternRequestable | undefined;
  public entitySchema: EntitySchema;
  public dataSource: DataViewSource<PortalItshopPatternItem, CartPatternItemDataRead>;
  public productBundlesItemCount: number;
  public get unselectBundleDisabled(): boolean {
    return !this.selectionService.selectedProducts.find(
      (product) =>
        !!product.item.GetEntity().GetSchema().Columns['UID_ShoppingCartPattern'] &&
        product.item.GetEntity().GetColumn('UID_ShoppingCartPattern').GetValue() ===
          this.selectedProductBundle!.UID_ShoppingCartPattern.value,
    );
  }
  public get selectBundleDisabled(): boolean {
    return (
      this.selectionService.selectedProducts.filter(
        (product) =>
          !!product.item.GetEntity().GetSchema().Columns['UID_ShoppingCartPattern'] &&
          product.item.GetEntity().GetColumn('UID_ShoppingCartPattern').GetValue() ===
            this.selectedProductBundle?.UID_ShoppingCartPattern.value,
      ).length === this.productBundlesItemCount
    );
  }
  // #endregion

  constructor(
    public readonly orchestration: NewRequestOrchestrationService,
    public readonly selectionService: NewRequestSelectionService,
    private readonly patternItemService: PatternItemService,
    protected readonly productDetailsService: ProductDetailsService,
    private readonly serviceItemsService: ServiceItemsService,
    public dataSourceFactory: DataViewSourceFactoryService,
  ) {
    this.orchestration.selectedView.set(SelectedProductSource.ProductBundles);
    this.dataSource = dataSourceFactory.getDataSource<PortalItshopPatternItem, CartPatternItemDataRead>();
    this.dataSource.selection.uniqueColumn = 'selectionKey';
    this.orchestration.dataViewProductBundles.set(this.dataSource);

    this.entitySchema = this.patternItemService.PortalItshopPatternItemSchema;
    this.displayedColumns = [
      this.entitySchema.Columns[DisplayColumns.DISPLAY_PROPERTYNAME],
      this.entitySchema.Columns.TableName,
      this.entitySchema.Columns.Description,
    ];

    effect(async () => {
      this.selectedProductBundle = this.orchestration.productBundle()!;
      if (this.selectedProductBundle) {
        this.bundleItems = [];
        await this.getData();
      }
    });

    this.subscriptions.push(
      this.selectionService.selectedProducts$.subscribe(() => {
        this.orchestration.preselectBySource(this.dataSource);
      }),
    );

    this.subscriptions.push(this.selectionService.selectedProductsCleared$.subscribe(() => this.dataSource.selection.clear()));

    //#endregion
  }

  public async ngOnInit(): Promise<void> {
    await this.getData();
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.orchestration.dataViewProductBundles.set(undefined);
  }

  public async getData(): Promise<void> {
    if (!this.selectedProductBundle) {
      return;
    }

    const dataViewInitParameters: DataViewInitParameters<PortalItshopPatternItem> = {
      execute: (
        params: CollectionLoadParameters,
        signal: AbortSignal,
      ): Promise<ExtendedTypedEntityCollection<PortalItshopPatternItem, CartPatternItemDataRead>> =>
        this.patternItemService.getPatternItemList(this.selectedProductBundle!, params, { signal }).then(async (data) => {
          for (const product of data.Data) {
            product.GetEntity().AddColumns([{ ColumnName: 'selectionKey', Type: ValType.String }]);
            await product.GetEntity().GetColumn('selectionKey').PutValue(product.GetEntity().GetColumn('UID_AccProduct').GetValue());
          }
          return data;
        }),
      schema: this.entitySchema,
      columnsToDisplay: this.displayedColumns,
      highlightEntity: (product: PortalItshopPatternItem) => {
        this.onRowSelected(product);
      },
      selectionChange: (products: PortalItshopPatternItem[]) => this.onSelectionChanged(products),
    };
    this.dataSource.selectedFilters.set([]);
    this.dataSource.state.update((state) => ({
      ...state,
      StartIndex: 0,
      search: undefined,
      filter: undefined,
    }));
    await this.dataSource.init(dataViewInitParameters);
    this.productBundlesItemCount = this.dataSource.collectionData().totalCount || 0;
    this.orchestration.preselectBySource(this.dataSource);
  }

  public async onRowSelected(item: PortalItshopPatternItem): Promise<void> {
    const serviceItem =
      'UID_AccProduct' in item ? await this.serviceItemsService.getServiceItem(item.UID_AccProduct.value, true) : undefined;
    if (serviceItem != null) {
      this.productDetailsService.showProductDetails(serviceItem, this.orchestration.recipients()!);
    }
  }

  public onSelectionChanged(items: PortalItshopPatternItem[]): void {
    this.selectionService.addProducts(items, this.dataSource.data, SelectedProductSource.ProductBundles, this.selectedProductBundle);
  }

  public async onSelectBundle(): Promise<void> {
    this.dataSource.loading.set(true);
    this.orchestration.abortCall();
    try {
      await this.getBundleItems();
      if (this.bundleItems) {
        this.bundleItems = this.bundleItems;
        this.selectionService.addProducts(
          this.bundleItems,
          this.bundleItems,
          SelectedProductSource.ProductBundles,
          this.selectedProductBundle,
        );
        this.orchestration.preselectBySource(this.dataSource);
      }
    } finally {
      this.dataSource.loading.set(false);
    }
  }

  public async onUnselectBundle(): Promise<void> {
    if (!this.bundleItems.length) {
      await this.getBundleItems();
    }
    this.selectionService.addProducts([], this.bundleItems, SelectedProductSource.ProductBundles, this.selectedProductBundle);
    this.orchestration.preselectBySource(this.dataSource);
  }

  private async getBundleItems(): Promise<void> {
    this.dataSource.loading.set(true);
    try {
      const itemList = await this.patternItemService.getPatternItemList(
        this.selectedProductBundle!,
        undefined,
        { signal: this.orchestration.abortController.signal },
        true,
      );

      for (const product of itemList.Data) {
        product.GetEntity().AddColumns([{ ColumnName: 'selectionKey', Type: ValType.String }]);
        await product.GetEntity().GetColumn('selectionKey').PutValue(product.GetEntity().GetColumn('UID_AccProduct').GetValue());
      }
      this.bundleItems = itemList.Data;
    } catch {
      this.bundleItems = [];
    } finally {
      this.dataSource.loading.set(false);
    }
  }
}
