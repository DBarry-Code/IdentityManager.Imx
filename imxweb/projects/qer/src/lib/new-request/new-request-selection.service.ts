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
import {
  PortalItshopPatternItem,
  PortalItshopPatternRequestable,
  PortalItshopPeergroupMemberships,
  PortalShopServiceitems,
} from '@imx-modules/imx-api-qer';
import { TypedEntity, ValType } from '@imx-modules/imx-qbm-dbts';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import {
  GetSelectedProductType,
  SelectedProductItem,
  SelectedProductSource,
} from './new-request-selected-products/selected-product-item.interface';

@Injectable({
  providedIn: 'root',
})
export class NewRequestSelectionService {
  private selectedProductsProperty: SelectedProductItem[] = [];
  public get selectedProducts(): SelectedProductItem[] {
    return this.selectedProductsProperty;
  }
  public set selectedProducts(value: SelectedProductItem[]) {
    this.selectedProductsProperty = value;
  }
  public selectedProducts$ = new BehaviorSubject<SelectedProductItem[]>([]);
  public selectedProductsCleared$ = new BehaviorSubject<boolean>(true);

  public get selectedProductEntities(): TypedEntity[] {
    return this.selectedProductsProperty.map((product) => product.item);
  }

  constructor() {}

  public clearProducts(): void {
    this.selectedProducts = [];
    this.selectedProductsCleared$.next(true);
  }

  public addProducts(
    products: TypedEntity[],
    allProducts: TypedEntity[],
    productSource: SelectedProductSource = SelectedProductSource.Undefined,
    productBundle?: PortalItshopPatternRequestable,
  ): void {
    const removeProducts = allProducts.filter(
      (productItem) =>
        !products.find(
          (product) =>
            product.GetEntity().GetColumn('selectionKey').GetValue() == productItem.GetEntity().GetColumn('selectionKey').GetValue(),
        ),
    );
    this.selectedProducts = this.selectedProducts.filter(
      (productItem) =>
        !removeProducts.find(
          (product) =>
            product.GetEntity().GetColumn('selectionKey').GetValue() == productItem.item.GetEntity().GetColumn('selectionKey').GetValue(),
        ),
    );
    products.forEach((product: PortalShopServiceitems | PortalItshopPeergroupMemberships | PortalItshopPatternItem) => {
      if (
        !this.selectedProducts.find(
          (productItem) =>
            productItem.item.GetEntity().GetColumn('selectionKey').GetValue() == product.GetEntity().GetColumn('selectionKey').GetValue(),
        )
      ) {
        this.selectedProducts.push({ item: product, type: GetSelectedProductType(product), source: productSource, bundle: productBundle });
      }
    });
  }

  public async addSelectionKeyColumn<T>(products: TypedEntity[]): Promise<T[]> {
    for (const product of products) {
      product.GetEntity().AddColumns([{ ColumnName: 'selectionKey', Type: ValType.String }]);
      await product.GetEntity().GetColumn('selectionKey').PutValue(product.GetEntity().GetKeys()[0]);
    }
    return products as T[];
  }
}
