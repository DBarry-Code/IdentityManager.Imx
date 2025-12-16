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
import { MatCardModule } from '@angular/material/card';
import { EUI_SIDESHEET_REF, EuiCoreModule } from '@elemental-ui/core';
import { CollectionLoadParameters } from '@imx-modules/imx-qbm-dbts';
import { DataViewSource } from '../../data-view/data-view-source';
import { DataViewModule } from '../../data-view/data-view.module';
import { GlobalSearchService } from '../global-search.service';

@Component({
  standalone: true,
  imports: [DataViewModule, EuiCoreModule, MatCardModule],
  templateUrl: './sidesheet.component.html',
  styleUrl: './sidesheet.component.scss',
  providers: [DataViewSource],
})
export class GlobalSearchSidesheetComponent implements OnInit {
  // Here this is not optional as we gated the opening of this sidesheet by an implementation check in the parent component
  private searchService = inject(GlobalSearchService);
  public dataSource = inject(DataViewSource);
  public sidesheetRef = inject(EUI_SIDESHEET_REF);

  ngOnInit() {
    this.setupDataSource();
  }

  private async setupDataSource() {
    await this.searchService.setup();
    // TODO: PBI #542378 - Need pagination defined for the opsweb api, don't show pagination for now and fix to 200 elements
    this.dataSource.state.set({ PageSize: 200 });
    this.dataSource.init({
      execute: async (query: CollectionLoadParameters) => {
        return await this.searchService.search(query);
      },
      columnsToDisplay: this.searchService.columnsToDisplay,
      schema: this.searchService.schema,
      dataModel: this.searchService.dataModel,
      highlightEntity: async (entity) => this.searchService.handleChoice(entity, this.sidesheetRef),
    });
    // Disable the queue service integration, we can be dealing with client-typed entities and mis-configured keys
    this.dataSource.itemStatus = {
      enabled: () => false
    }
  }
}
