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

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EUI_SIDESHEET_DATA, EuiLoadingService, EuiSidesheetService } from '@elemental-ui/core';
import {
  PortalAdminPerson,
  PortalPersonReports,
  PortalRespTeamResponsibilities,
  ResponsibilityData,
  ResponsibilityIdentityData,
} from '@imx-modules/imx-api-qer';
import {
  CollectionLoadParameters,
  DataModel,
  DisplayColumns,
  EntitySchema,
  IClientProperty,
  LogOp,
  TypedEntityCollectionData,
} from '@imx-modules/imx-qbm-dbts';
import _ from 'lodash';
import { AuthenticationService, DataViewInitParameters, DataViewSource, ISessionState } from 'qbm';
import { IdentitiesService } from '../../identities/identities.service';
import { TeamResponsibilitiesService } from '../team-responsibilities.service';
import { TeamResponsibilityAssignDialogComponent } from '../team-responsibility-assign-dialog/team-responsibility-assign-dialog.component';

@Component({
  selector: 'imx-team-responsibility-assign-sidesheet',
  templateUrl: './team-responsibility-assign-sidesheet.component.html',
  styleUrl: './team-responsibility-assign-sidesheet.component.scss',
  providers: [DataViewSource],
  standalone: false,
})
export class TeamResponsibilityAssignSidesheetComponent implements OnInit {
  public entitySchema: EntitySchema;
  public readonly DisplayedColumns = DisplayColumns;
  public selection: PortalPersonReports[] = [];
  public initialSelection: PortalPersonReports[] = [];
  public singleSelection = false;
  public managerSelected = false;
  public managerEntity: PortalAdminPerson;
  private displayedColumns: IClientProperty[];
  private dataModel: DataModel;
  private sessionState: ISessionState;

  public get assignButtonEnabled(): boolean {
    return (
      ((!!this.selection.length || !!this.initialSelection.length) &&
        !_.isEqual(
          this.selection.map((item) => item.GetEntity().GetKeys()[0]).sort(),
          this.initialSelection.map((item) => item.GetEntity().GetKeys()[0]).sort(),
        )) ||
      this.managerSelected
    );
  }

  constructor(
    @Inject(EUI_SIDESHEET_DATA)
    public data: {
      responsibility: PortalRespTeamResponsibilities[];
      reassign: boolean;
      extendedData: (ResponsibilityData | undefined)[];
      manage?: boolean;
    },
    public dataSource: DataViewSource<PortalPersonReports>,
    private readonly sidesheetService: EuiSidesheetService,
    private readonly identitiesService: IdentitiesService,
    private readonly teamResponsibilitiesService: TeamResponsibilitiesService,
    private readonly busyServiceElemental: EuiLoadingService,
    private readonly authenticationSerivce: AuthenticationService,
    private readonly dialogService: MatDialog,
  ) {
    this.entitySchema = this.identitiesService.personReportsSchema;
    this.authenticationSerivce.onSessionResponse.subscribe((sessionSate: ISessionState) => {
      this.sessionState = sessionSate;
      this.getManagerEntity();
    });
  }

  async ngOnInit(): Promise<void> {
    this.singleSelection = !!this.data.responsibility[0].UID_SourceColumn.value;
    this.dataModel = await this.identitiesService.getDataModelAdmin();

    this.dataModel = { ...this.dataModel, Filters: this.dataModel.Filters?.filter((filter) => filter.Name !== 'isinactive') };
    this.displayedColumns = [
      this.entitySchema.Columns[this.DisplayedColumns.DISPLAY_PROPERTYNAME],
      this.entitySchema.Columns.UID_Department,
    ];
    if (this.data.reassign) {
      this.dataSource.itemStatus = {
        enabled: (item: PortalPersonReports) =>
          !this.otherIdentities().some((otherIdentities) => otherIdentities?.UidPerson === item.GetEntity().GetKeys()[0]) &&
          !this.data.responsibility.some((responsibility) => responsibility.UID_Person.value === item.GetEntity().GetKeys()[0]),
      };
    }
    const dataViewInitParameters: DataViewInitParameters<PortalPersonReports> = {
      execute: (params: CollectionLoadParameters, signal: AbortSignal): Promise<TypedEntityCollectionData<PortalPersonReports>> =>
        this.identitiesService.getReportsOfManager({ ...params, isinactive: '0' }, signal),
      schema: this.entitySchema,
      columnsToDisplay: this.displayedColumns,
      dataModel: this.dataModel,
      selectionChange: (selection: PortalPersonReports[]) => {
        this.selection = selection;
        if (this.singleSelection) {
          this.managerSelected = false;
        }
      },
    };
    this.dataSource.init(dataViewInitParameters);
    if (this.data.manage) {
      this.dataSource.selection.select(await this.loadSelectedEntities());
    }
  }

  public closeSidesheet(): void {
    this.sidesheetService.close();
  }

  public async assignMore(): Promise<void> {
    const selection: (PortalAdminPerson | PortalPersonReports)[] = this.selection;
    if (this.managerSelected) {
      selection.push(this.managerEntity);
    }
    if (!this.data.reassign && this.data.manage && !!this.getIdentitiesToRemove().length) {
      this.confirmDeletion();
    } else {
      const overlayRef = this.busyServiceElemental.show();
      try {
        if (this.data.reassign) {
          await this.teamResponsibilitiesService.reassignResponsibilities(this.data.responsibility, selection, this.data.extendedData);
        }
        if (this.data.manage) {
          await this.teamResponsibilitiesService.manageResponsibility(
            this.data.responsibility[0],
            this.getIdentitiesToAssign(),
            this.getIdentitiesToRemove(),
            this.data.extendedData[0],
          );
        }
      } finally {
        this.busyServiceElemental.hide(overlayRef);
        this.sidesheetService.close(true);
      }
    }
  }

  public otherIdentities(): ResponsibilityIdentityData[] {
    let otherIdentities: ResponsibilityIdentityData[] = [];
    this.data.extendedData.map((extendedData) => otherIdentities.push(...(extendedData?.OtherIdentities || [])));
    return otherIdentities;
  }

  public onManagerSelection(): void {
    if (this.singleSelection) {
      this.dataSource.selection.clear();
    }
  }

  private async getManagerEntity(): Promise<void> {
    this.managerEntity = await this.identitiesService.getAdminPerson(this.sessionState.UserUid!);
  }

  private async loadSelectedEntities(): Promise<PortalPersonReports[]> {
    const abortController = new AbortController();
    const selection = await this.identitiesService.getReportsOfManager(
      {
        filter: [
          {
            Type: 2,
            Expression: {
              Expressions: [
                {
                  PropertyId: 'UID_Person',
                  Operator: 'IN',
                  LogOperator: LogOp.AND,
                  Value: [this.data.responsibility[0].UID_Person.value, ...this.otherIdentities().map((identity) => identity.UidPerson)],
                  Negate: false,
                },
              ],
              LogOperator: LogOp.AND,
              Negate: false,
            },
          },
        ],
        isinactive: '0',
      },
      abortController.signal,
    );
    this.initialSelection = selection.Data || [];
    return this.initialSelection;
  }

  private getIdentitiesToAssign(): (PortalPersonReports | PortalAdminPerson)[] {
    return this.selection.filter(
      (selectedPerson) =>
        !this.initialSelection.find((initialPerson) => selectedPerson.GetEntity().GetKeys()[0] === initialPerson.GetEntity().GetKeys()[0]),
    );
  }

  private getIdentitiesToRemove(): (PortalPersonReports | PortalAdminPerson)[] {
    return this.initialSelection.filter(
      (initialPerson) =>
        !this.selection.find((selectedPerson) => selectedPerson.GetEntity().GetKeys()[0] === initialPerson.GetEntity().GetKeys()[0]),
    );
  }

  private confirmDeletion(): void {
    this.dialogService
      .open(TeamResponsibilityAssignDialogComponent, {
        data: { responsibility: this.data.responsibility[0], identities: this.getIdentitiesToRemove() },
      })
      .afterClosed()
      .subscribe(async (result) => {
        if (result) {
          const overlayRef = this.busyServiceElemental.show();
          try {
            await this.teamResponsibilitiesService.manageResponsibility(
              this.data.responsibility[0],
              this.getIdentitiesToAssign(),
              this.getIdentitiesToRemove(),
              this.data.extendedData[0],
            );
          } finally {
            this.busyServiceElemental.hide(overlayRef);
            this.sidesheetService.close(true);
          }
        }
      });
  }
}
