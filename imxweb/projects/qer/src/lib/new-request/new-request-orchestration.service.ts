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

import { ErrorHandler, Injectable, OnDestroy, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {
  CartPatternItemDataRead,
  PortalItshopPatternItem,
  PortalItshopPatternRequestable,
  PortalItshopPeergroupMemberships,
  PortalServicecategories,
  PortalShopServiceitems,
  ServiceItemsExtendedData,
} from '@imx-modules/imx-api-qer';
import {
  CollectionLoadParameters,
  CompareOperator,
  EntityCollectionData,
  EntityValue,
  FilterData,
  FilterType,
  FkProviderItem,
  IWriteValue,
  LocalProperty,
  ValueStruct,
} from '@imx-modules/imx-qbm-dbts';

import { TranslateService } from '@ngx-translate/core';
import { AuthenticationService, DataViewSource, EntityService, ISessionState, LdsReplacePipe } from 'qbm';
import { PersonService } from '../person/person.service';
import { QerApiService } from '../qer-api-client.service';
import { CurrentProductSource } from './current-product-source';
import { ServiceItemParameters } from './new-request-product/service-item-parameters';
import { SelectedProductSource } from './new-request-selected-products/selected-product-item.interface';
import { NewRequestSelectionService } from './new-request-selection.service';
import { NewRequestTabModel } from './new-request-tab/new-request-tab-model';

@Injectable({
  providedIn: 'root',
})
export class NewRequestOrchestrationService implements OnDestroy {
  //#region Private properties
  private userUid: string;
  private defaultUser: ValueStruct<string>;
  private lastLoggedInUser: string;
  //#endregion

  //#region DataViewSources
  public dataViewAllProducts: WritableSignal<DataViewSource<PortalShopServiceitems, ServiceItemsExtendedData> | undefined> =
    signal(undefined);
  public dataViewPeerGroupProducts: WritableSignal<DataViewSource<PortalShopServiceitems, ServiceItemsExtendedData> | undefined> =
    signal(undefined);
  public dataViewPeerGroupOrgs: WritableSignal<DataViewSource<PortalItshopPeergroupMemberships, ServiceItemsExtendedData> | undefined> =
    signal(undefined);
  public dataViewReferenceUserProducts: WritableSignal<DataViewSource<PortalShopServiceitems, ServiceItemsExtendedData> | undefined> =
    signal(undefined);
  public dataViewReferenceUserOrgs: WritableSignal<DataViewSource<PortalItshopPeergroupMemberships, ServiceItemsExtendedData> | undefined> =
    signal(undefined);
  public dataViewProductBundles: WritableSignal<DataViewSource<PortalItshopPatternItem, CartPatternItemDataRead> | undefined> =
    signal(undefined);
  //#endregion

  //#region Signals
  public recipients: WritableSignal<IWriteValue<string> | undefined> = signal(undefined);
  public recipientsIds: WritableSignal<string | undefined> = signal(undefined);
  public currentProductSource: WritableSignal<CurrentProductSource | undefined> = signal(undefined);
  public selectedProductStore: WritableSignal<SelectedProductSource> = signal(SelectedProductSource.Undefined);
  public disableSearch: WritableSignal<boolean> = signal(false);
  public navigationState: WritableSignal<CollectionLoadParameters | ServiceItemParameters | undefined> = signal(undefined);
  public selectedTab: WritableSignal<NewRequestTabModel | undefined> = signal(undefined);
  public selectedChip: WritableSignal<number | undefined> = signal(undefined);
  public selectedCategory: WritableSignal<PortalServicecategories | undefined> = signal(undefined);
  public includeChildCategories: WritableSignal<boolean> = signal(true);
  public referenceUser: WritableSignal<ValueStruct<string> | undefined> = signal(undefined);
  public productBundle: WritableSignal<PortalItshopPatternRequestable | undefined> = signal(undefined);
  public selectedView: WritableSignal<SelectedProductSource> = signal(SelectedProductSource.Undefined);
  //#endregion

  //#region AbortController
  public abortController = new AbortController();
  public serviceCategoryAbortController = new AbortController();
  //#endregion

  constructor(
    authentication: AuthenticationService,
    private readonly qerClient: QerApiService,
    private readonly entityService: EntityService,
    private readonly personProvider: PersonService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly selectionService: NewRequestSelectionService,
    private errorHandler: ErrorHandler,
    private translator: TranslateService,
    private ldsReplace: LdsReplacePipe,
  ) {
    authentication.onSessionResponse.subscribe(async (session: ISessionState) => {
      this.userUid = session.UserUid || '';

      if (this.userUid == null) {
        return;
      }

      if (this.lastLoggedInUser !== this.userUid) {
        this.lastLoggedInUser = this.userUid;
        this.selectionService.clearProducts();
        await this.initRecipients();
      }
    });
  }

  public ngOnDestroy(): void {
    this.referenceUser.set(undefined);
  }

  public preselectBySource(dataSource: DataViewSource): void {
    if (this.selectionService.selectedProducts == null || dataSource == null) {
      return;
    }
    const preSelection = this.selectionService.selectedProducts.map((x) => x.item);
    dataSource?.selection?.setSelection(preSelection);
  }

  public async setDefaultUser(): Promise<void> {
    await this.recipients()?.Column.PutValueStruct(this.defaultUser);
    this.recipientsIds.set(this.recipients()?.value);
  }

  public async setRecipients(value: ValueStruct<string> | undefined): Promise<void> {
    if (value != null) {
      await this.recipients()?.Column.PutValueStruct(value);
      this.recipientsIds.set(this.recipients()?.value);
    }
  }

  /**
   * Check through the fk table if this uid could be selected
   * @param uidRecipient
   * @returns
   */
  private async canRecipientBeSet(uidRecipient: string): Promise<boolean> {
    const fkRelations = this.qerClient.typedClient.PortalCartitem.createEntity().UID_PersonOrdered.GetMetadata().GetFkRelations();
    if (fkRelations.length < 1) {
      return false;
    }

    // Assume there is only one relation and filter by the uid
    const filter: FilterData[] = [
      {
        ColumnName: fkRelations[0].ColumnName,
        Type: FilterType.Compare,
        CompareOp: CompareOperator.Equal,
        Value1: uidRecipient,
      },
    ];

    var candidates: EntityCollectionData;
    try {
      candidates = await fkRelations[0].Get({ filter });
    } catch (error) {
      return false;
    }

    // Check if there is data
    if (candidates && candidates.TotalCount > 0) return true;
    else return false;
  }

  public abortCall(): void {
    this.abortController.abort();
    this.abortController = new AbortController();
  }

  public abortServiceCategoryCall(): void {
    this.serviceCategoryAbortController.abort();
    this.serviceCategoryAbortController = new AbortController();
  }

  /***
   * Set the recipient to the identity with the specified uid.
   */
  public async setRecipient(uidPerson: string): Promise<void> {
    if (!uidPerson) {
      return;
    }
    // Check if this is a valid person
    const DisplayValue = await this.getPersonDisplay(uidPerson);
    if (!DisplayValue) {
      this.errorHandler.handleError(
        this.ldsReplace.transform(
          this.translator.instant('#LDS#The selected recipient "{0}" does not exist. Select a different recipient.'),
          uidPerson,
        ),
      );
      return;
    }
    // Check if we could set this person through the fkTable
    const canBeSet = await this.canRecipientBeSet(uidPerson);
    if (!canBeSet) {
      this.errorHandler.handleError(
        this.ldsReplace.transform(
          this.translator.instant('#LDS#You cannot request products for the selected identity "{0}". Select a different recipient.'),
          uidPerson,
        ),
      );
      return;
    }
    // Otherwise apply
    this.setRecipients({
      DataValue: uidPerson,
      DisplayValue,
    });
  }

  private async initRecipients(): Promise<void> {
    // define the recipients as a multi-valued property
    const recipientsProp = new LocalProperty();
    recipientsProp.IsMultiValued = true;
    recipientsProp.ColumnName = 'UID_PersonOrdered';
    recipientsProp.MinLen = 1;
    recipientsProp.FkRelation = this.qerClient.typedClient.PortalCartitem.GetSchema().Columns.UID_PersonOrdered.FkRelation;

    const dummyCartItemEntity = this.qerClient.typedClient.PortalCartitem.createEntity().GetEntity();
    const fkProviderItems = this.qerClient.client.getFkProviderItems('portal/cartitem').map((item) => ({
      ...item,
      load: (_, parameters = {}) => item.load(dummyCartItemEntity, parameters),
      getDataModel: async (entity) => item?.getDataModel?.(entity),
      getFilterTree: async (entity, parentKey) => item?.getFilterTree?.(entity, parentKey),
    })) as FkProviderItem[];

    const column = this.entityService.createLocalEntityColumn(recipientsProp, fkProviderItems, { Value: this.userUid });
    this.recipients.set(new EntityValue(column));
    this.recipientsIds.set(this.userUid);

    // preset recipient to the current user
    await this.recipients()?.Column.PutValueStruct({
      DataValue: this.userUid,
      DisplayValue: await this.getPersonDisplay(this.userUid),
    });

    const uidPerson = this.activatedRoute.snapshot.paramMap.get('UID_Person');
    const DisplayValue = await this.getPersonDisplay(uidPerson);

    if (uidPerson && DisplayValue) {
      await this.recipients()?.Column.PutValueStruct({
        DataValue: uidPerson,
        DisplayValue,
      });

      // TODO in this case, CanRequestForSomebodyElse is false
    }
    this.defaultUser = {
      DataValue: this.recipients()?.Column.GetValue(),
      DisplayValue: this.recipients()?.Column.GetDisplayValue(),
    };
  }

  /**
   * Get the person display via the person provider
   * @param uid
   * @returns
   */
  private async getPersonDisplay(uid: string | null): Promise<string | undefined> {
    if (!uid) {
      return;
    }

    const person = await this.personProvider.get(uid);
    if (person && person.Data.length) {
      return person.Data[0].GetEntity().GetDisplay();
    }
  }
}
