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

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import {
  CollectionLoadParameters,
  CompareOperator,
  DataModel,
  DbObjectKey,
  DisplayColumns,
  EntitySchema,
  FilterType,
  IForeignKeyInfo,
  TypedEntity,
  TypedEntityBuilder,
} from '@imx-modules/imx-qbm-dbts';
import { BusyService } from '../base/busy.service';
import { MetadataService } from '../base/metadata.service';
import { ClassloggerService } from '../classlogger/classlogger.service';
import { DataSourceToolbarSettings } from '../data-source-toolbar/data-source-toolbar-settings';
import { DataSourceToolbarViewConfig } from '../data-source-toolbar/data-source-toolbar-view-config.interface';
import { DataViewSource } from '../data-view/data-view-source';
import { DataViewInitParameters } from '../data-view/data-view.interface';
import { SettingsService } from '../settings/settings-service';
import { CandidateEntity } from './candidate-entity';
import { ForeignKeyPickerData } from './foreign-key-picker-data.interface';

@Component({
  selector: 'imx-fk-selector',
  templateUrl: './fk-selector.component.html',
  styleUrls: ['./fk-selector.component.scss'],
  providers: [DataViewSource],
  standalone: false,
})
export class FkSelectorComponent implements OnInit {
  public settings: DataSourceToolbarSettings;
  public selectedTable: IForeignKeyInfo;
  public preselectedEntities: TypedEntity[] | null;

  public readonly DisplayColumns = DisplayColumns; // Enables use of this static class in Angular Templates.

  @Input() public data: ForeignKeyPickerData;
  @Output() public tableSelected = new EventEmitter<IForeignKeyInfo>();

  public busyService = new BusyService();

  private readonly builder = new TypedEntityBuilder(CandidateEntity);
  public entitySchema: EntitySchema;
  private dataModel: DataModel;
  private viewConfig: DataSourceToolbarViewConfig | undefined;

  constructor(
    public dataSource: DataViewSource<TypedEntity>,
    public readonly metadataProvider: MetadataService,
    private readonly settingsService: SettingsService,
    private readonly logger: ClassloggerService,
  ) {}

  public async ngOnInit() {
    const isBusy = this.busyService.beginBusy();

    if (this.data.fkRelations && this.data.fkRelations.length > 0) {
      // Preselect the first table
      this.selectedTable = this.data.fkRelations.find((fkr) => fkr.TableName === this.data.selectedTableName) || this.data.fkRelations[0];
      await this.setupDataSource();
    }

    await this.loadDataSource();

    isBusy.endBusy();
  }

  private async setupDataSource() {
    if (this.data.fkRelations && this.data.fkRelations.length > 0) {
      await this.metadataProvider.updateNonExisting(this.data.fkRelations.map((fkr) => fkr.TableName));
    }
    this.entitySchema = CandidateEntity.GetEntitySchema(this.selectedTable.ColumnName, this.selectedTable.TableName);
    this.dataModel = await this.selectedTable.GetDataModel();
    this.viewConfig = this.data.viewConfigSettings?.getViewConfig
      ? await this.data?.viewConfigSettings?.getViewConfig(this.dataModel)
      : undefined;
  }

  private async loadDataSource() {
    this.dataSource.state.set({
      PageSize: this.settingsService.DefaultPageSize,
      StartIndex: 0,
    });
    const dataViewInitParameters: DataViewInitParameters = {
      execute: async (params: CollectionLoadParameters) => {
        return this.builder.buildReadWriteEntities(await this.selectedTable.Get(params), this.entitySchema);
      },
      schema: this.entitySchema,
      columnsToDisplay: [DisplayColumns.DISPLAY_PROPERTY],
      dataModel: this.dataModel,
      viewConfig: this.viewConfig,
      filterTree: {
        multiSelect: true,
        filterMethode: async (parentKey) => this.selectedTable.GetFilterTree(parentKey),
      }
    };
    await this.getPreselectedEntities();
    await this.dataSource.init(dataViewInitParameters);
    await this.getPreselectedEntities();
    this.dataSource.itemStatus.enabled = (item: TypedEntity) => !this.isRowDisabled(item);
    if (this.preselectedEntities) this.dataSource.selection.setSelection(this.preselectedEntities);
  }

  public async updateConfig(config: any): Promise<void> {
    if (this.data.viewConfigSettings?.updateConfig) await this.data.viewConfigSettings?.updateConfig(config);
    if (this.data.viewConfigSettings?.getViewUpdates) this.viewConfig = await this.data.viewConfigSettings.getViewUpdates();
    this.dataSource.viewConfig.set(this.viewConfig);
  }

  public async deleteConfigById(id: string): Promise<void> {
    if (this.data.viewConfigSettings?.deleteConfigById) await this.data.viewConfigSettings.deleteConfigById(id);
    if (this.data.viewConfigSettings?.getViewUpdates) this.viewConfig = await this.data.viewConfigSettings.getViewUpdates();
    this.dataSource.viewConfig.set(this.viewConfig);
  }

  public isRowDisabled(item: TypedEntity): boolean {
    return this.data.disabledIds?.includes(item.GetEntity().GetKeys()[0]) ?? false;
  }

  /**
   * @ignore
   */
  public async tableChanged() {
    await this.setupDataSource();
    await this.loadDataSource();
    this.tableSelected.emit(this.selectedTable);
  }

  /**
   * @ignore
   * Gets the list of preselected entities.
   */
  private async getPreselectedEntities(): Promise<void> {
    if (this.data.fkRelations && this.data.fkRelations.length > 0 && this.data.idList && this.data.idList.length > 0) {
      const isBusy = this.busyService.beginBusy();
      try {
        const preselectedTemp: TypedEntity[] = [];
        this.preselectedEntities = null;

        this.logger.debug(this, 'Getting preselected entities');

        for (const key of this.data.idList) {
          let table: IForeignKeyInfo | undefined;
          if (this.data.fkRelations.length > 1) {
            const tableName = DbObjectKey.FromXml(key).TableName;
            table = this.data.fkRelations.find((fkr) => fkr.TableName === tableName);
          }

          table = table || this.data.fkRelations[0];
          const navigationState: CollectionLoadParameters = {
            filter: [
              {
                ColumnName: table.ColumnName,
                Type: FilterType.Compare,
                CompareOp: CompareOperator.Equal,
                Value1: key,
              },
            ],
            withProperties: this.dataSource.state().withProperties,
          };
          this.logger.debug(this, 'Getting preselected entity with navigation state', navigationState);

          const result = this.builder.buildReadWriteEntities(await table.Get(navigationState), this.entitySchema);

          if (result.Data.length) {
            preselectedTemp.push(result.Data[0]);
          }
        }

        this.preselectedEntities = preselectedTemp;
        this.logger.debug(this, `Retrieved ${this.preselectedEntities.length} preselected entities`);
      } finally {
        isBusy.endBusy();
      }
    }
  }
}
