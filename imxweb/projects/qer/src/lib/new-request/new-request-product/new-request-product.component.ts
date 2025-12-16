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

import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, effect, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PortalServicecategories, PortalShopServiceitems, ServiceItemsExtendedData } from '@imx-modules/imx-api-qer';
import {
  CollectionLoadParameters,
  CompareOperator,
  DataModel,
  DisplayColumns,
  ExtendedTypedEntityCollection,
  IClientProperty,
  IEntity,
  MultiValue,
  TypedEntity,
} from '@imx-modules/imx-qbm-dbts';
import {
  buildAdditionalElementsString,
  BusyService,
  DataSourceToolbarSettings,
  DataSourceToolbarViewConfig,
  DataViewInitParameters,
  DataViewSource,
  DataViewSourceFactoryService,
  DynamicDataApiControls,
  DynamicDataSource,
  SettingsService
} from 'qbm';
import { Subscription } from 'rxjs/internal/Subscription';
import { ViewConfigService } from '../../view-config/view-config.service';
import { NewRequestOrchestrationService } from '../new-request-orchestration.service';
import { SelectedProductSource } from '../new-request-selected-products/selected-product-item.interface';
import { NewRequestSelectionService } from '../new-request-selection.service';
import { NewRequestCategoryApiService } from './new-request-category-api.service';
import { NewRequestProductApiService } from './new-request-product-api.service';
import { ProductDetailsService } from './product-details-sidesheet/product-details.service';
import { ServiceItemParameters } from './service-item-parameters';

export interface NewRequestCategoryNode {
  isSelected?: boolean;
  entity?: PortalServicecategories;
  parent?: NewRequestCategoryNode;
  children?: NewRequestCategoryNode[];
  isLoading?: boolean;
  level?: number;
  isSearchResult?: boolean;
}

@Component({
  selector: 'imx-new-request-product',
  templateUrl: './new-request-product.component.html',
  styleUrls: ['./new-request-product.component.scss'],
  standalone: false,
  providers: [DataViewSource],
})
export class NewRequestProductComponent implements OnInit, OnDestroy {
  // #region Private
  private subscriptions: Subscription[] = [];
  private accProductGroup: string | undefined;
  private firstIteration = true;
  // #endregion

  // #region Public
  public SelectedProductSource = SelectedProductSource;
  public categorySideNavExpanded = true;
  public productNavigationState: CollectionLoadParameters | ServiceItemParameters;
  public DisplayColumns = DisplayColumns;
  public displayedProductColumns: IClientProperty[];
  public serviceCategoriesTotalCount = 0;
  public readonly busyService = new BusyService();
  public resetSidenav = false;
  public selectedServiceCategoryUID: WritableSignal<string | undefined> = signal(undefined);
  public selectedServiceItemUID: WritableSignal<string | undefined> = signal(undefined);
  public isInitiallyLoading: boolean = true;
  private viewConfig: DataSourceToolbarViewConfig;
  private dataModel: DataModel;
  public dataSource: DataViewSource<PortalShopServiceitems, ServiceItemsExtendedData>;
  public categoryTreeControl = new FlatTreeControl<NewRequestCategoryNode>(
    (leaf) => leaf.level || 0,
    (leaf) => leaf.entity?.HasChildren.Column.GetValue() || false,
  );
  public apiControls: DynamicDataApiControls<NewRequestCategoryNode> = {
    setup: async () => {
      // We only expect a single root node
      let userParams: CollectionLoadParameters = {
        UID_Person: this.orchestration.recipients()
          ? MultiValue.FromString(this.orchestration.recipients()!.value).GetValues().join(',')
          : undefined,
        ParentKey: '',
      };
      if (!!this.selectedServiceCategoryUID() && !this.resetSidenav) {
        userParams.filter = [
          {
            ColumnName: 'UID_AccProductGroup',
            CompareOp: CompareOperator.Equal,
            Value1: this.selectedServiceCategoryUID(),
          },
        ];
        userParams.ParentKey = undefined;
      }
      const servicecategories = await this.categoryApi.get(userParams);
      this.serviceCategoriesTotalCount = servicecategories?.totalCount;
      const dstSettings: DataSourceToolbarSettings = {
        dataSource: servicecategories,
        entitySchema: this.categoryApi.schema,
        navigationState: {
          StartIndex: 0,
        },
      };

      const children = servicecategories.Data.map((datum) => {
        const node: NewRequestCategoryNode = {
          entity: datum,
          isSelected: false,
          level: 1,
        };
        return node;
      });
      const totalCount = this.serviceCategoriesTotalCount;
      this.orchestration.disableSearch.set(totalCount < 1);
      const rootNode: NewRequestCategoryNode = {
        level: 0,
        isSelected: true,
        children: children,
      };
      const dstSettingsDynamicDatasource = totalCount > 0 ? dstSettings : undefined;
      this.isInitiallyLoading = false;
      return { rootNode, dstSettings: dstSettingsDynamicDatasource, totalCount };
    },
    getChildren: async (leaf, onlyCheck?: boolean) => {
      if (leaf.children && leaf.children.length > 0) {
        // No need to get children, we already have them
        return leaf.children;
      }
      if (onlyCheck) {
        // Stop here if we only want to see if a child exists, but not load
        return [];
      }
      leaf.isLoading = true;
      const userParams: CollectionLoadParameters = {
        UID_Person: this.orchestration.recipients()
          ? MultiValue.FromString(this.orchestration.recipients()!.value).GetValues().join(',')
          : undefined,
        PageSize: 1000,
      };
      if (!leaf.entity) {
        return [];
      }
      const data = await this.categoryApi.get({ ParentKey: leaf.entity.UID_AccProductGroup.Column.GetValue(), ...userParams });
      leaf.isLoading = false;
      leaf.children = data.Data.map((datum) => {
        return {
          entity: datum,
          parent: leaf,
          isSelected: false,
          level: (leaf.level || 0) + 1,
        } as NewRequestCategoryNode;
      });
      return leaf.children;
    },
    loadMore: async (root) => {
      // Get children count from root
      const userParams = {
        UID_Person: this.orchestration.recipients()
          ? MultiValue.FromString(this.orchestration.recipients()!.value).GetValues().join(',')
          : undefined,
        ParentKey: '',
      };
      const data = await this.categoryApi.get({ StartIndex: root.children?.length, ...userParams });
      const children = data.Data.map((datum) => {
        return {
          entity: datum,
          parent: root,
          isSelected: false,
          level: (root.level || 0) + 1,
        } as NewRequestCategoryNode;
      });
      root.children?.push(...children);
      return children;
    },
    abortSearch: () => {
      this.orchestration.abortServiceCategoryCall();
    },
    search: async (params: CollectionLoadParameters) => {
      const userParams = {
        UID_Person: this.orchestration.recipients()
          ? MultiValue.FromString(this.orchestration.recipients()!.value).GetValues().join(',')
          : undefined,
      };
      const parentKeyFilter = !!params.search?.length ? {} : { ParentKey: '' };
      this.orchestration.abortServiceCategoryCall();
      const response = await this.categoryApi.get({ ...parentKeyFilter, ...params, ...userParams });
      if (!response?.Data) {
        return {
          searchNodes: [],
        };
      }
      const searchNodes = response.Data.map((datum) => {
        const node: NewRequestCategoryNode = {
          entity: datum,
          isSelected: false,
          level: 1,
          isSearchResult: !!params.search?.length,
        };
        return node;
      });
      const rootNode: NewRequestCategoryNode = {
        isSelected: true,
        level: 0,
        children: searchNodes,
      };
      return { searchNodes, totalCount: response.totalCount, rootNode };
    },
    changeSelection: (data: NewRequestCategoryNode[], selectedNode: NewRequestCategoryNode) => {
      // Reset all other selections and set this one if its keys match
      const key = selectedNode?.entity ? selectedNode.entity.GetEntity().GetKeys()[0] : '';
      data.forEach((node) => {
        // Here we check if the node has an entity, if it does, compare to the key. If it doesn't, check if the key is also empty
        node.isSelected = node?.entity ? node.entity.GetEntity().GetKeys()[0] === key : key === '';
      });
      return data;
    },
  };

  public dynamicDataSource = new DynamicDataSource<NewRequestCategoryNode>(this.categoryTreeControl, this.apiControls);

  public isLoading = (node: NewRequestCategoryNode) => node.isLoading || false;
  // Here we can allow for the root to not be collapsable, but this breaks other functions like the 'collapse all' button
  public hasChild = (_: number, node: NewRequestCategoryNode) =>
    !node.isSearchResult && ((node.children && node.children.length > 0) || node.entity?.HasChildren.Column.GetValue());

  constructor(
    public readonly categoryApi: NewRequestCategoryApiService,
    public readonly productApi: NewRequestProductApiService,
    public readonly selectionService: NewRequestSelectionService,
    public readonly orchestration: NewRequestOrchestrationService,
    protected readonly productDetailsService: ProductDetailsService,
    private readonly route: ActivatedRoute,
    private readonly settingsService: SettingsService,
    private viewConfigService: ViewConfigService,
    public dataSourceFactory: DataViewSourceFactoryService,
  ) {
    this.orchestration.selectedView.set(SelectedProductSource.AllProducts);
    this.dataSource = dataSourceFactory.getDataSource<PortalShopServiceitems, ServiceItemsExtendedData>();
    this.dataSource.selection.uniqueColumn = 'selectionKey';
    this.orchestration.dataViewAllProducts.set(this.dataSource);
    this.displayedProductColumns = [
      this.productApi.entitySchema.Columns[DisplayColumns.DISPLAY_PROPERTYNAME],
      this.productApi.entitySchema.Columns.ServiceCategoryFullPath,
      this.productApi.entitySchema.Columns.Description,
      this.productApi.entitySchema.Columns.OrderableStatus,
    ];

    effect(async () => {
      // Make sure to fetch data if the child category signal changes
      this.orchestration.includeChildCategories();
      await this.getProductData(true);
    });

    this.subscriptions.push(
      this.selectionService.selectedProducts$.subscribe(() => {
        this.orchestration.preselectBySource(this.dataSource);
      }),
    );

    this.subscriptions.push(this.selectionService.selectedProductsCleared$.subscribe(() => this.dataSource.selection.clear()));

    effect(() => {
      if (this.orchestration.recipientsIds()) {
        // if the serviceCategory or the serviceItem url param available load only the filtered data
        if (this.firstIteration && (this.selectedServiceCategoryUID() || this.selectedServiceItemUID())) {
          this.setupSelection();
          this.firstIteration = false;
        } else if (this.firstIteration) {
          this.dynamicDataSource.setup(true);
          this.initProductTable();
        } else {
          this.dynamicDataSource.setup(true);
          this.getProductData();
        }
      }
    });
    //#endregion
  }

  public async ngOnInit(): Promise<void> {
    this.productNavigationState = { StartIndex: 0 };
    this.orchestration.selectedCategory.set(undefined);

    const productSearchString = this.route.snapshot.queryParams['ProductSearchString'];
    if (!!productSearchString?.length) {
      // the user can pass product search string by URL parameter -> load the data with this search string
      this.setProductSearchString(productSearchString);
    }

    this.selectedServiceCategoryUID.set(this.route.snapshot.queryParams['serviceCategory']);
    this.selectedServiceItemUID.set(this.route.snapshot.queryParams['serviceItem']);

    // pre-assign the recipient by URL parameter
    this.orchestration.setRecipient(this.route.snapshot.queryParams['UID_Person']);
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
    this.orchestration.dataViewAllProducts.set(undefined);
  }

  public categoryObserveExpanded(expanded: boolean): void {
    this.categorySideNavExpanded = !expanded;
  }

  public async categorySelectedNode(node: NewRequestCategoryNode, init?: boolean): Promise<void> {
    if (node.entity) {
      // This is a category
      let category = node?.entity?.GetEntity();
      this.orchestration.selectedCategory.set(node?.entity);
      this.accProductGroup = category.GetKeys()[0];
      if (init) {
        await this.initProductTable();
      } else {
        await this.getProductData(true);
      }
    } else {
      // This is the root node and it has no entity
      this.orchestration.selectedCategory.set(undefined);
      this.accProductGroup = undefined;
      if (init) {
        await this.initProductTable();
      } else {
        await this.getProductData(true);
      }
    }
  }

  public onSelectionChanged(items: TypedEntity[]): void {
    this.selectionService.addProducts(items, this.dataSource.data, SelectedProductSource.AllProducts);
  }

  public async onRowSelected(item: PortalShopServiceitems): Promise<void> {
    if (this.orchestration.recipients()) {
      this.productDetailsService.showProductDetails(item as PortalShopServiceitems, this.orchestration.recipients()!);
    }
  }

  /**
   * Reset the category tree and the product table to default.
   */
  public async onResetTree(): Promise<void> {
    this.serviceCategoriesTotalCount = -1;
    this.dynamicDataSource.setup(true);
    this.resetSidenav = false;
    this.dataSource.state.set({ PageSize: this.settingsService?.DefaultPageSize, StartIndex: 0 });
    this.categorySelectedNode({});
  }

  public getSubtitleText(column: IEntity): string {
    return buildAdditionalElementsString(column, this.dataSource.additionalListColumns()!);
  }

  private async getProductData(resetPageIndex = false): Promise<void> {
    if (resetPageIndex) {
      this.dataSource.state.update((state) => ({ ...state, StartIndex: 0 }));
    }
    await this.dataSource.updateState();
    this.orchestration.preselectBySource(this.dataSource);
  }

  private getCollectionLoadParameter(params: CollectionLoadParameters): CollectionLoadParameters | ServiceItemParameters {
    let parameters: CollectionLoadParameters | ServiceItemParameters = {
      ...params,
      UID_Person: this.orchestration.recipients()
        ? MultiValue.FromString(this.orchestration.recipients()!.value).GetValues().join(',')
        : undefined,
    };

    if (this.accProductGroup) {
      parameters.UID_AccProductGroup = this.accProductGroup;
      parameters.IncludeChildCategories = this.orchestration.includeChildCategories();
    }

    return parameters;
  }

  private async setupSelection(): Promise<void> {
    if (!!this.selectedServiceCategoryUID()) {
      this.setupSelectionByCategory();
    } else if (!!this.selectedServiceItemUID()) {
      this.setupSelectionByProduct();
    }
  }

  private async setupSelectionByCategory(): Promise<void> {
    await this.dynamicDataSource.setup(true);
    if (this.dynamicDataSource.data.length > 1) {
      this.dynamicDataSource.setSelection(this.dynamicDataSource.data[1]);
      this.categorySelectedNode(this.dynamicDataSource.data[1], true);
    } else {
      this.dynamicDataSource.dataChange.next([]);
    }
    this.resetSidenav = true;
  }

  private async setupSelectionByProduct(): Promise<void> {
    try {
      this.dataSource.state.update((state) => ({
        ...state,
        filter: [
          {
            ColumnName: 'UID_AccProduct',
            CompareOp: CompareOperator.Equal,
            Value1: this.selectedServiceItemUID(),
          },
        ],
      }));
      await this.initProductTable();
      if (!!this.dataSource.collectionData().Data.length) {
        this.selectedServiceCategoryUID.set(
          this.dataSource.collectionData().Data[0].GetEntity().GetColumn('UID_AccProductGroup').GetValue(),
        );
        await this.dynamicDataSource.setup(true);
        if (this.dynamicDataSource.data.length > 1) {
          this.dynamicDataSource.setSelection(this.dynamicDataSource.data[1]);
        }
      }
    } finally {
      this.productNavigationState.filter = [];
      this.resetSidenav = true;
    }
  }

  private async setProductSearchString(productSearchString: string): Promise<void> {
    this.dataSource.state.update((state) => ({ ...state, search: productSearchString }));
    await this.initProductTable();
  }

  private async initProductTable(): Promise<void> {
    this.dataModel = await this.productApi.getDataModel();
    this.viewConfig = await this.viewConfigService.getInitialDSTExtension(this.dataModel, 'shop/serviceitems');
    const dataViewInitParameters: DataViewInitParameters<PortalShopServiceitems, ServiceItemsExtendedData> = {
      execute: (
        params: CollectionLoadParameters,
        signal: AbortSignal,
      ): Promise<ExtendedTypedEntityCollection<PortalShopServiceitems, ServiceItemsExtendedData>> => {
        const parameters = this.getCollectionLoadParameter(params);
        return this.productApi.get(parameters, signal).then(async (data) => {
          data.Data = await this.selectionService.addSelectionKeyColumn(data.Data);
          return data;
        });
      },
      schema: this.productApi.entitySchema,
      columnsToDisplay: this.displayedProductColumns,
      highlightEntity: (product: PortalShopServiceitems) => {
        this.onRowSelected(product);
      },
      selectionChange: (products: PortalShopServiceitems[]) => this.onSelectionChanged(products as TypedEntity[]),
      dataModel: this.dataModel,
      viewConfig: this.viewConfig,
      uniqueConfig: !!this.selectedServiceItemUID(),
      groupExecute: (column: string, params: CollectionLoadParameters, signal: AbortSignal) => {
        return this.productApi.getGroupInfo(
          column,
          {
            PageSize: params.PageSize,
            StartIndex: 0,
            ...params,
          },
          signal,
        );
      },
    };
    await this.dataSource.init(dataViewInitParameters);
    this.orchestration.preselectBySource(this.dataSource);
  }
}
