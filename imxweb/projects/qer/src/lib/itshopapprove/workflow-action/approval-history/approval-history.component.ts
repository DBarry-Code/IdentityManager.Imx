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

import { Component, Input, OnInit } from '@angular/core';
import { EuiLoadingService, EuiSidesheetService } from '@elemental-ui/core';
import { TranslateService } from '@ngx-translate/core';

import { HistoryFilterMode, ITShopConfig, PwoExtendedData } from '@imx-modules/imx-api-qer';
import {
  CollectionLoadParameters,
  EntityData,
  EntitySchema,
  ExtendedTypedEntityCollection,
  TypedEntity,
  ValType,
} from '@imx-modules/imx-qbm-dbts';
import {
  AuthenticationService,
  calculateSidesheetWidth,
  ClassloggerService,
  ClientPropertyForTableColumns,
  DataSourceToolbarFilter,
  DataViewInitParameters,
  DataViewSource,
  ISessionState,
} from 'qbm';
import { ProjectConfigurationService } from '../../../project-configuration/project-configuration.service';
import { ItshopRequest } from '../../../request-history/itshop-request';
import { RequestDetailComponent } from '../../../request-history/request-detail/request-detail.component';
import { Approval } from '../../approval';
import { ApprovalHistoryService } from './approval-history.service';

@Component({
  selector: 'imx-approval-history',
  templateUrl: './approval-history.component.html',
  styleUrls: ['./approval-history.component.scss'],
  standalone: false,
  providers: [DataViewSource],
})
export class ApprovalHistoryComponent implements OnInit {
  @Input() public approval: Approval;
  public entitySchema: EntitySchema;
  // eslint-disable-next-line no-bitwise
  public filtermode: HistoryFilterMode = HistoryFilterMode.SameAccProduct | HistoryFilterMode.SameStep;
  public hasFilterApplied = true;

  public alertText =
    '#LDS#Here you can find information to help you make an approval decision. You can find information on requests for the same recipient, on requests of the same product and on approval decisions you made. Use the filters to narrow down or extend the information. Click a request to get more information.';

  private currentUser: string;
  private displayedColumns: ClientPropertyForTableColumns[];
  private itShopConfig: ITShopConfig | undefined;

  constructor(
    private readonly approvalHistoryservice: ApprovalHistoryService,
    private readonly busy: EuiLoadingService,
    private readonly logger: ClassloggerService,
    private readonly translate: TranslateService,
    private readonly sideSheet: EuiSidesheetService,
    private readonly projectConfig: ProjectConfigurationService,
    public dataViewSource: DataViewSource<ItshopRequest, PwoExtendedData>,
    auth: AuthenticationService,
  ) {
    auth.onSessionResponse.subscribe((session: ISessionState) => (this.currentUser = session.UserUid || ''));
  }

  public async ngOnInit(): Promise<void> {
    this.entitySchema = this.approvalHistoryservice.PortalItshopRequestsSchema;
    if (this.busy.overlayRefs.length === 0) {
      this.busy.show();
    }
    try {
      this.itShopConfig = (await this.projectConfig.getConfig()).ITShopConfig;
    } finally {
      this.busy.hide();
    }
    return this.initTable();
  }

  public isApproved(pwo: ItshopRequest): { caption: string; color: string } | undefined {
    const approvalStep = pwo.pwoData.WorkflowHistory?.Entities?.find(
      (entity) =>
        entity.Columns?.DecisionLevel.Value === this.approval.DecisionLevel.value &&
        entity.Columns?.UID_PersonHead.Value === this.currentUser &&
        entity.Columns?.DecisionType.Value !== 'Order',
    );

    if (approvalStep == null) {
      this.logger.warn(this, 'no approval step found');
      return undefined;
    }

    return {
      caption: approvalStep.Columns?.DecisionType.DisplayValue || '',
      color:
        approvalStep.Columns?.DecisionType.Value === 'Grant'
          ? 'green'
          : approvalStep.Columns?.DecisionType.Value === 'Dissmiss'
            ? 'red'
            : 'gray',
    };
  }

  public get isSameStepActive(): boolean {
    // eslint-disable-next-line no-bitwise
    return (this.filtermode & HistoryFilterMode.SameStep) === HistoryFilterMode.SameStep;
  }

  public async viewDetails(pwo: TypedEntity): Promise<void> {
    await this.sideSheet
      .open(RequestDetailComponent, {
        title: await this.translate.get('#LDS#Heading View Request Details').toPromise(),
        subTitle: pwo.GetEntity().GetDisplay(),
        padding: '0px',
        width: calculateSidesheetWidth(1000),
        testId: 'imx-approval-history-request-detail',
        data: {
          isReadOnly: true,
          personWantsOrg: pwo,
          itShopConfig: this.itShopConfig,
          userUid: this.currentUser,
          disableActions: true,
        },
      })
      .afterClosed()
      .toPromise();
  }

  private async initTable(): Promise<void> {
    const filterOptions = this.buildFilter();
    this.dataViewSource.state.update((state) => ({ ...state, filtermode: '1,4' }));
    this.dataViewSource.predefinedFilters.set(filterOptions);
    this.dataViewSource.showFilters.set(true);

    this.displayedColumns = [
      this.entitySchema.Columns.UID_PersonOrdered,
      this.entitySchema.Columns.OrderDate,
      this.entitySchema.Columns.UiOrderState,
    ];
    const dataViewInitParameters: DataViewInitParameters<ItshopRequest, PwoExtendedData> = {
      execute: (params: CollectionLoadParameters, signal: AbortSignal) => {
        this.filtermode = params.filtermode?.split(',').reduce((a, b) => (a |= b)) || HistoryFilterMode.None;
        this.hasFilterApplied = this.filtermode !== HistoryFilterMode.None;
        const emptyResult: ExtendedTypedEntityCollection<ItshopRequest, PwoExtendedData> = {
          totalCount: 0,
          Data: [],
        };

        if (!this.hasFilterApplied) {
          return Promise.resolve(emptyResult);
        }

        const currentHelperPwo = this.getCurrentPwoHelperPwo();
        if (currentHelperPwo == null) {
          this.logger.warn(this, 'no workflow data for this step / approver combination');
          return Promise.resolve(emptyResult);
        }
        if (this.isSameStepActive) {
          this.dataViewSource.columnsToDisplay.set([
            ...this.displayedColumns,
            { Type: ValType.String, ColumnName: 'decision', untranslatedDisplay: '#LDS#Approval decision' },
          ]);
        } else {
          this.dataViewSource.columnsToDisplay.set(this.displayedColumns);
        }
        if (currentHelperPwo.Columns?.UID_PWOHelperPWO.Value) {
          return this.approvalHistoryservice.getRequests(
            currentHelperPwo.Columns?.UID_PWOHelperPWO.Value,
            this.filtermode,
            this.currentUser,
            { ...params, OrderBy: 'OrderDate' },
          );
        } else {
          return Promise.resolve(emptyResult);
        }
      },
      schema: this.entitySchema,
      columnsToDisplay: this.displayedColumns,
      localSource: true,
    };
    this.dataViewSource.init(dataViewInitParameters);
  }

  private getCurrentPwoHelperPwo(): EntityData | undefined {
    const currentStep = this.approval.pwoData.WorkflowSteps?.Entities?.find(
      (elem) =>
        elem.Columns?.UID_QERWorkingMethod.Value === this.approval.UID_QERWorkingMethod.value &&
        elem.Columns?.LevelNumber.Value === this.approval.DecisionLevel.value,
    );
    this.logger.trace(this, 'current step the user has to decide', currentStep);

    return this.approval.pwoData.WorkflowData?.Entities?.find(
      (elem) =>
        elem.Columns?.RulerLevel.Value === 0 &&
        elem.Columns?.UID_QERWorkingStep.Value === currentStep?.Columns?.UID_QERWorkingStep.Value &&
        elem.Columns?.UID_PersonHead.Value === this.currentUser,
    );
  }

  private buildFilter(): DataSourceToolbarFilter[] {
    const filterMode: DataSourceToolbarFilter = {
      Name: 'filtermode',
      Description: this.translate.instant('#LDS#Filter'),
      Delimiter: ',',
      Options: [
        { Value: '1', Display: this.translate.instant('#LDS#Same product') },
        { Value: '2', Display: this.translate.instant('#LDS#Same recipient') },
        { Value: '4', Display: this.translate.instant('#LDS#Your approval decisions') },
      ],
      CurrentValue: '1,4',
    };
    return [filterMode];
  }
}
