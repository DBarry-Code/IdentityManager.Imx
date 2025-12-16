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

import { AfterViewInit, ChangeDetectorRef, Component, effect, OnDestroy, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { EuiSidesheetService } from '@elemental-ui/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs/internal/Subscription';

import { PortalItshopPeergroupMemberships, PortalShopServiceitems, ServiceItemsExtendedData } from '@imx-modules/imx-api-qer';
import {
  CollectionLoadParameters,
  DisplayColumns,
  ExtendedTypedEntityCollection,
  IClientProperty,
  MultiValue,
  TypedEntity,
  ValueStruct,
} from '@imx-modules/imx-qbm-dbts';

import { MatChipListbox } from '@angular/material/chips';
import {
  Busy,
  BusyService,
  calculateSidesheetWidth,
  DataViewInitParameters,
  DataViewSource,
  DataViewSourceFactoryService,
  FkAdvancedPickerComponent,
  HELP_CONTEXTUAL,
} from 'qbm';
import { ItshopService } from '../../itshop/itshop.service';
import { QerApiService } from '../../qer-api-client.service';
import { NewRequestOrchestrationService } from '../new-request-orchestration.service';
import { NewRequestProductApiService } from '../new-request-product/new-request-product-api.service';
import { ProductDetailsService } from '../new-request-product/product-details-sidesheet/product-details.service';
import { ServiceItemParameters } from '../new-request-product/service-item-parameters';
import { SelectedProductSource } from '../new-request-selected-products/selected-product-item.interface';
import { NewRequestSelectionService } from '../new-request-selection.service';

@Component({
  selector: 'imx-new-request-reference-user',
  templateUrl: './new-request-reference-user.component.html',
  styleUrls: ['./new-request-reference-user.component.scss'],
  providers: [DataViewSource],
  standalone: false,
})
export class NewRequestReferenceUserComponent implements AfterViewInit, OnDestroy {
  //#region Private
  private subscriptions: Subscription[] = [];
  private busy: Busy;
  //#endregion

  //#region Public
  @ViewChild(MatChipListbox) public chipList: MatChipListbox;

  public selectedChipIndex = 0;
  public DisplayColumns = DisplayColumns;
  public displayedProductColumns: IClientProperty[];
  public displayedMembershipColumns: IClientProperty[];
  public readonly busyService = new BusyService();
  public SelectedProductSource = SelectedProductSource;
  public selectedSource: SelectedProductSource;
  public contextId = HELP_CONTEXTUAL.NewRequestReferenceUser;
  public productDataSource: DataViewSource<PortalShopServiceitems, ServiceItemsExtendedData>;
  public membershipDataSource: DataViewSource<PortalItshopPeergroupMemberships, ServiceItemsExtendedData>;
  //#endregion

  constructor(
    public readonly productApi: NewRequestProductApiService,
    public readonly membershipApi: ItshopService,
    public readonly selectionService: NewRequestSelectionService,
    private readonly cd: ChangeDetectorRef,
    private readonly sideSheetService: EuiSidesheetService,
    private readonly translate: TranslateService,
    private readonly qerApi: QerApiService,
    private readonly router: Router,
    public readonly productDetailsService: ProductDetailsService,
    public readonly orchestration: NewRequestOrchestrationService,
    public dataSourceFactory: DataViewSourceFactoryService,
  ) {
    this.orchestration.selectedView.set(SelectedProductSource.ReferenceUserProducts);
    this.orchestration.selectedChip.set(0);
    this.orchestration.disableSearch.set(false);

    this.displayedProductColumns = [
      this.productApi.entitySchema.Columns[DisplayColumns.DISPLAY_PROPERTYNAME],
      this.productApi.entitySchema.Columns.ServiceCategoryFullPath,
      this.productApi.entitySchema.Columns.TableName,
      this.productApi.entitySchema.Columns.Description,
      this.productApi.entitySchema.Columns.OrderableStatus,
    ];

    this.displayedMembershipColumns = [
      this.membershipApi.PortalItshopPeergroupMembershipsSchema.Columns[DisplayColumns.DISPLAY_PROPERTYNAME],
      this.membershipApi.PortalItshopPeergroupMembershipsSchema.Columns.FullPath,
      this.membershipApi.PortalItshopPeergroupMembershipsSchema.Columns.Description,
    ];

    this.productDataSource = dataSourceFactory.getDataSource<PortalShopServiceitems, ServiceItemsExtendedData>();
    this.membershipDataSource = dataSourceFactory.getDataSource<PortalItshopPeergroupMemberships, ServiceItemsExtendedData>();
    this.orchestration.dataViewReferenceUserProducts.set(this.productDataSource);
    this.orchestration.dataViewReferenceUserOrgs.set(this.membershipDataSource);

    effect(() => {
      if (this.orchestration.recipients() && this.orchestration.recipientsIds()) {
        if (this.selectedChipIndex === 0 && this.selectedSource === SelectedProductSource.ReferenceUserProducts) {
          this.getProductData();
        }
        if (this.selectedChipIndex === 1 && this.selectedSource === SelectedProductSource.ReferenceUserOrgs) {
          this.getMembershipData();
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
      this.router.events.subscribe(async (event: any) => {
        if (
          event instanceof NavigationEnd &&
          this.orchestration.referenceUser() != null &&
          event.url === '/newrequest/selectReferenceUser'
        ) {
          await this.selectReferenceUser();
        }
      }),
    );
  }

  public async ngAfterViewInit(): Promise<void> {
    if (!this.orchestration.referenceUser()) {
      await this.selectReferenceUser();
    } else {
      this.chipList._chips.first.select();
      this.cd.detectChanges();
      await this.getProductData();
    }
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
    this.orchestration.dataViewPeerGroupProducts.set(undefined);
    this.orchestration.dataViewPeerGroupOrgs.set(undefined);
  }

  public selectReferenceUser() {
    const disabledIds =
      this.orchestration.recipients()?.Column?.GetValue()?.split('').length === 1
        ? this.orchestration.recipients()?.Column?.GetValue()?.split('')
        : undefined;

    this.sideSheetService
      .open(FkAdvancedPickerComponent, {
        title: this.translate.instant('#LDS#Heading Select Reference User'),
        padding: '0',
        icon: 'user',
        width: calculateSidesheetWidth(),
        testId: 'referenceUser-sidesheet',
        data: {
          displayValue: '',
          isRequired: true,
          fkRelations: this.qerApi.typedClient.PortalCartitem.createEntity().UID_PersonOrdered.GetMetadata().GetFkRelations(),
          isMultiValue: false,
          disabledIds: disabledIds,
        },
      })
      .afterClosed()
      .subscribe(async (selection) => {
        selection && selection.candidates?.length > 0
          ? await this.setReferenceUser(selection.candidates[0])
          : this.router.navigate(['/newrequest']);
      });
  }

  public async setReferenceUser(user: ValueStruct<string>): Promise<void> {
    if (this.orchestration.referenceUser()?.DataValue === user?.DataValue) {
      return;
    }
    this.orchestration.referenceUser.set(user);
    this.chipList._chips.first.select();
    await this.getProductData();
  }

  public async onRowSelected(item: TypedEntity): Promise<void> {
    this.productDetailsService.showProductDetails(item as PortalShopServiceitems, this.orchestration.recipients()!);
  }

  public onProductSelectionChanged(items: TypedEntity[], type: SelectedProductSource): void {
    type === SelectedProductSource.ReferenceUserProducts
      ? this.selectionService.addProducts(items, this.productDataSource.data, SelectedProductSource.ReferenceUserProducts)
      : this.selectionService.addProducts(items, this.membershipDataSource.data, SelectedProductSource.ReferenceUserOrgs);
  }

  public async onChipClicked(index: number): Promise<void> {
    this.selectedChipIndex = index;
    this.orchestration.selectedChip.set(index);

    this.chipList._chips.forEach((chip, i) => {
      i === index ? (chip.selected = true) : (chip.selected = false);
    });

    if (index === 0) {
      this.orchestration.selectedView.set(SelectedProductSource.ReferenceUserProducts);
      await this.getProductData();
    }

    if (index === 1) {
      this.orchestration.selectedView.set(SelectedProductSource.ReferenceUserOrgs);
      await this.getMembershipData();
    }
  }

  private async getProductData(): Promise<void> {
    const busy = this.busyService.beginBusy();
    try {
      this.orchestration.abortCall();
      const dataViewInitParameters: DataViewInitParameters<PortalShopServiceitems, ServiceItemsExtendedData> = {
        execute: (
          params: CollectionLoadParameters,
          signal: AbortSignal,
        ): Promise<ExtendedTypedEntityCollection<PortalShopServiceitems, ServiceItemsExtendedData>> => {
          const parameters = this.getCollectionLoadParamaters(params);
          return this.productApi.get(parameters, signal).then(async (data) => {
            if (data) {
              data.Data = await this.selectionService.addSelectionKeyColumn(data.Data);
              this.orchestration.disableSearch.set(data.totalCount < 1);
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
          this.onProductSelectionChanged(products as TypedEntity[], SelectedProductSource.ReferenceUserProducts),
      };
      await this.productDataSource.init(dataViewInitParameters);
      this.orchestration.preselectBySource(this.productDataSource);
    } finally {
      busy.endBusy();
    }
  }

  private async getMembershipData(): Promise<void> {
    const busy = this.busyService.beginBusy();

    try {
      this.orchestration.abortCall();
      const dataViewInitParameters: DataViewInitParameters<PortalItshopPeergroupMemberships, ServiceItemsExtendedData> = {
        execute: (
          params: CollectionLoadParameters,
          signal: AbortSignal,
        ): Promise<ExtendedTypedEntityCollection<PortalItshopPeergroupMemberships, ServiceItemsExtendedData>> => {
          const parameters = this.getCollectionLoadParamaters(params);
          return this.membershipApi.getPeerGroupMemberships(parameters, { signal }).then(async (data) => {
            if (data) {
              data.Data = await this.selectionService.addSelectionKeyColumn(data.Data);
              this.orchestration.disableSearch.set(data.totalCount < 1);
            }
            return data;
          });
        },
        schema: this.membershipApi.PortalItshopPeergroupMembershipsSchema,
        columnsToDisplay: this.displayedMembershipColumns,
        selectionChange: (products: PortalItshopPeergroupMemberships[]) =>
          this.onProductSelectionChanged(products as TypedEntity[], SelectedProductSource.ReferenceUserOrgs),
      };
      await this.membershipDataSource.init(dataViewInitParameters);
      this.orchestration.preselectBySource(this.membershipDataSource);
    } finally {
      busy.endBusy();
    }
  }

  private getCollectionLoadParamaters(
    navigationState: CollectionLoadParameters | ServiceItemParameters,
  ): CollectionLoadParameters | ServiceItemParameters {
    return {
      ...navigationState,
      UID_Person: this.orchestration.recipients()
        ? MultiValue.FromString(this.orchestration.recipients()!.value).GetValues().join(',')
        : undefined,
      UID_PersonReference: this.orchestration.referenceUser()?.DataValue,
    };
  }
}
