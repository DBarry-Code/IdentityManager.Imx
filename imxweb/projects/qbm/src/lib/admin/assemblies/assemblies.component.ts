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

import { Component, inject, OnInit } from '@angular/core';
import { AssemblyInfoData } from '@imx-modules/imx-api-qbm';
import { EntityData, EntitySchema, IClientProperty, TypedEntityBuilder, ValType } from '@imx-modules/imx-qbm-dbts';
import { GenericTypedEntity } from '../../api-client/dynamic-method';
import { AppConfigService } from '../../appConfig/appConfig.service';
import { DataViewSource } from '../../data-view/data-view-source';
import { LocalDataViewInitParameters } from '../../data-view/data-view.interface';
import { SideNavigationComponent } from '../../side-navigation-view/side-navigation-view-interfaces';

@Component({
  selector: 'imx-assemblies',
  templateUrl: './assemblies.component.html',
  styleUrl: './assemblies.component.scss',
  standalone: false,
  providers: [DataViewSource],
})
export class AssembliesComponent implements OnInit, SideNavigationComponent {
  public data: any;
  public dataSource = inject(DataViewSource);
  public appConfigService = inject(AppConfigService);
  private displayedColumns: IClientProperty[] = [
    { ColumnName: 'Name', Type: ValType.String },
    { ColumnName: 'Version', Type: ValType.String },
  ];
  public entitySchema: EntitySchema = {
    Columns: {
      Name: this.displayedColumns[0],
      Version: this.displayedColumns[1],
    },
  };
  private builder = new TypedEntityBuilder(GenericTypedEntity);

  public async ngOnInit(): Promise<void> {
    const assemblies = await this.appConfigService.client.admin_assemblies_get();
    const entities = this.getEntities(assemblies.Assemblies ?? []);
    const dataViewInitParameters: LocalDataViewInitParameters<GenericTypedEntity> = {
      data: entities.Data,
      columnsToDisplay: this.displayedColumns,
      schema: this.entitySchema,
    };
    this.dataSource.initLocal(dataViewInitParameters);
  }

  private getEntities(items: AssemblyInfoData[]) {
    return this.builder.buildReadWriteEntities(
      {
        Entities: items.map((item) => {
          const entity: EntityData = {
            Columns: {
              Name: { ...this.displayedColumns[0], Value: item.Name },
              Version: { ...this.displayedColumns[1], Value: item.Version },
            },
            Display: item.Name,
          };
          return entity;
        }),
        TotalCount: items.length,
      },
      this.entitySchema,
    );
  }
}
