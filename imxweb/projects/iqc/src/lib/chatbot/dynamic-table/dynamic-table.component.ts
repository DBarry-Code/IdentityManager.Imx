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


import { Component, input, OnInit } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { EuiCoreModule } from '@elemental-ui/core';
import { ChatApiExtendedData } from '@imx-modules/imx-api-iqc';
import {
  EntitySchema,
  ExtendedEntityCollectionData,
  IClientProperty,
  TypedEntityBuilder,
  ValType
} from '@imx-modules/imx-qbm-dbts';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DataViewModule, DataViewSource, GenericTypedEntity, LocalDataViewInitParameters, SettingsService } from 'qbm';

@Component({
  selector: 'imx-chatbot-dynamic-table',
  standalone: true,
  imports: [DataViewModule, EuiCoreModule, MatMenuModule, MatTableModule, MatSortModule, TranslateModule],
  providers: [DataViewSource],
  template: `
    @if (response().TotalCount > 0) {
      <imx-data-view-toolbar [dataSource]="dataSource" [showSettings]="false"></imx-data-view-toolbar>
    }
    <imx-data-view-auto-table
      [dataSource]="dataSource"
      mode="auto"
      matSort
      (matSortChange)="dataSource?.sortChange($event)"
      [matSortActive]="dataSource.sortId()"
      [matSortDirection]="dataSource.sortDirection()"
      [noDataText]="'#LDS#This query returns no results. Try again with a different query.'"
    ></imx-data-view-auto-table>
    <imx-data-view-paginator [dataSource]="dataSource"></imx-data-view-paginator>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: fit-content;
        max-height: 400px;
      }
    `,
  ],
})
export class ChatbotDynamicTableComponent implements OnInit {
  // Input for the component

  /**
   * The data response from the AI
   */
  public response = input.required<ExtendedEntityCollectionData<ChatApiExtendedData>>();

  /**
   * Optional schema properties, if not present we make the schema fromt he data
   */
  public properties = input<IClientProperty[]>();

  // Private properties for building the data source
  private builder = new TypedEntityBuilder(GenericTypedEntity);
  private columnsToDisplay: IClientProperty[];
  private schema: EntitySchema;

  constructor(
    public dataSource: DataViewSource,
    private settingsService: SettingsService,
    private translateService: TranslateService,
  ) {}

  ngOnInit() {
    this.createDataSource();
  }

  /**
   * Create a local data source for this table
   */
  private createDataSource() {
    if (this.response().TotalCount === 0 || !this.response().Entities![0].Columns) {
      this.dataSource.loading.set(false);
      return;
    }

    // Create and display everything in schema
    this.createSchema();
    this.columnsToDisplay = Object.values(this.schema.Columns).map((column) => {
      if (column.Display && column.Display.startsWith('#LDS#')) column.Display = this.translateService.instant(column.Display!);
      return column;
    });
    
    // Create the data
    const initParams: LocalDataViewInitParameters<GenericTypedEntity> = {
      data: this.createEntities().Data,
      columnsToDisplay: this.columnsToDisplay,
      schema: this.schema,
      highlightEntity: () => {},
      localSource: true
    };
    this.dataSource.initLocal(initParams);    
    this.dataSource.state.set({ PageSize: this.settingsService?.DefaultPageSize, StartIndex: 0 });
  }


  /**
   * Create a schema either from available properties input or from the data
   */
  private createSchema() {
    // If we have properties to display, then use those
    if (!!this.properties() && this.properties()!.length > 0) {
      this.schema = {
        Columns: this.properties()!.reduce((schema, column) => {
          schema[column.ColumnName!] = column
          return schema
        }, {} as { [id: string]: IClientProperty })
      }
      return;
    }
    // Otherwise create schema based on the first entity's columns
    this.schema = {
      Columns: {
        ...Object.keys(this.response().Entities![0].Columns!).reduce(
          (schema, columnName) => {
            schema[columnName] = {
              // TODO: #504705: Can only define string now, need this data from the api
              Type: ValType.String,
              ColumnName: columnName,
              // TODO: #504705: Can only reuse columnName, need this data from the api
              Display: columnName,
            };
            return schema;
          },
          {} as { [id: string]: IClientProperty },
        ),
      },
    };
  }

  /**
   * Creates entities for the local data source
   * @returns entities
   */
  private createEntities() {
    return this.builder.buildReadWriteEntities(
      {
        ...this.response(),
      },
      this.schema,
    );
  }
}
