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

import { animate, animateChild, group, query, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { PortalItshopPatternRequestable } from '@imx-modules/imx-api-qer';
import {
  CollectionLoadParameters,
  DisplayColumns,
  EntitySchema,
  ExtendedTypedEntityCollection,
  IClientProperty,
  MultiValue,
  ValType,
} from '@imx-modules/imx-qbm-dbts';
import { BusyService, DataViewInitParameters, DataViewSource } from 'qbm';
import { PatternItemListFilterType } from '../../../pattern-item-list/pattern-item-list-filter-type.enum';
import { PatternItemService } from '../../../pattern-item-list/pattern-item.service';
import { NewRequestOrchestrationService } from '../../new-request-orchestration.service';
import { NewRequestSelectionService } from '../../new-request-selection.service';

@Component({
  selector: 'imx-product-bundle-list',
  templateUrl: './product-bundle-list.component.html',
  styleUrls: ['./product-bundle-list.component.scss'],
  providers: [DataViewSource],
  standalone: false,
  animations: [
    trigger('expandSearch', [
      state(
        'closed',
        style({
          width: '0px',
          visibility: 'hidden',
        }),
      ),
      state(
        'opened',
        style({
          width: '340px',
          visibility: 'visible',
        }),
      ),
      transition('* <=> *', [group([query('@fadeIcon', animateChild(), { optional: true }), animate('400ms ease')])]),
    ]),
    trigger('fadeIcon', [
      state(
        'opened',
        style({
          opacity: '0',
          width: '0px',
          visibility: 'hidden',
        }),
      ),
      state(
        'closed',
        style({
          opacity: '1',
          width: '40px',
          visibility: 'visible',
        }),
      ),
      state(
        'hidden',
        style({
          width: 0,
          visibility: 'hidden',
        }),
      ),
      transition('* <=> *', animate('400ms ease')),
    ]),
  ],
})
export class ProductBundleListComponent implements OnInit {
  private searchEnabled = false;
  public filterType: PatternItemListFilterType = PatternItemListFilterType.All;
  public readonly entitySchema: EntitySchema;
  public DisplayColumns = DisplayColumns;
  public displayedColumns: IClientProperty[];
  public isLoading = false;
  public width = '600px';
  public readonly busyService = new BusyService();

  public get searchState(): string {
    return this.searchEnabled ? 'opened' : 'closed';
  }

  constructor(
    private readonly orchestration: NewRequestOrchestrationService,
    private readonly patternItemService: PatternItemService,
    public readonly selectionService: NewRequestSelectionService,
    public dataSource: DataViewSource<PortalItshopPatternRequestable>,
  ) {
    this.orchestration.productBundle.set(undefined);
    this.entitySchema = patternItemService.PortalShopPatternRequestableSchema;
    this.displayedColumns = [
      this.entitySchema.Columns.Ident_ShoppingCartPattern,
      {
        ColumnName: 'type',
        Type: ValType.String,
      },
    ];
  }

  public ngOnInit(): void {
    this.getData();
  }

  public async getData(): Promise<void> {
    const busy = this.busyService.beginBusy();

    try {
      this.orchestration.abortCall();
      const dataViewInitParameters: DataViewInitParameters<PortalItshopPatternRequestable> = {
        execute: (
          params: CollectionLoadParameters,
          signal: AbortSignal,
        ): Promise<ExtendedTypedEntityCollection<PortalItshopPatternRequestable, unknown>> => {
          const parameters = {
            ...params,
            UID_Person: this.orchestration.recipients()
              ? MultiValue.FromString(this.orchestration.recipients()!.value).GetValues().join(',')
              : undefined,
          };
          return this.patternItemService.get(parameters, { signal });
        },
        schema: this.entitySchema,
        columnsToDisplay: this.displayedColumns,
        highlightEntity: (product: PortalItshopPatternRequestable) => {
          this.orchestration.productBundle.set(product);
        },
      };
      await this.dataSource.init(dataViewInitParameters);
    } finally {
      busy.endBusy();
    }
  }

  public enableSearch(): void {
    this.searchEnabled = true;
  }
}
