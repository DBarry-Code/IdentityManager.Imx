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
import { AfterViewInit, Component, Inject, OnInit, viewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { EUI_SIDESHEET_DATA, EuiSearchComponent, EuiSidesheetRef } from '@elemental-ui/core';
import { FilterProperty, SqlColumnTypes } from '@imx-modules/imx-qbm-dbts';
import { TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { HELP_CONTEXTUAL } from '../help-contextual/help-contextual.service';

export interface TreeSelectionModel {
  elements?: TreeSelectionModel[];
  level: number;
  id?: string;
  display: string;
  columnType?: SqlColumnTypes;
  helpContextId?: string;
  subtitle?: string;
}

@Component({
  selector: 'imx-sqlwizard-tree-selection-sidesheet',
  standalone: false,
  templateUrl: './tree-selection-sidesheet.component.html',
  styleUrl: './tree-selection-sidesheet.component.scss',
})
export class TreeSelectionSidesheetComponent implements OnInit, AfterViewInit {
  public model: TreeSelectionModel[];
  public busy = true;
  public displayedColumns: string[] = ['name'];
  public searchControl = new FormControl<string>('', { nonNullable: true });

  private transformer = (node: TreeSelectionModel, level: number) => {
    return {
      ...node,
      expandable: !!node.elements && node.elements.length > 0,
    };
  };
  public treeControl = new FlatTreeControl<TreeSelectionModel>(
    (node) => node.level,
    (node) => !!node.elements && node.elements.length > 0,
  );
  public treeFlattener = new MatTreeFlattener(
    this.transformer,
    (node) => node.level,
    (node) => node.expandable,
    (node) => node.elements as TreeSelectionModel[],
  );
  public dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
  public hasChild = (_: number, node: TreeSelectionModel) => !!node.elements && node.elements.length > 0;
  private treeData: TreeSelectionModel[];
  private euiSearch = viewChild(EuiSearchComponent);

  /**
   * Checks all the nodes are collepsed.
   */
  public get disabledCollapse(): boolean {
    return this.treeControl.dataNodes.every((node) => !this.treeControl.isExpanded(node));
  }

  constructor(
    @Inject(EUI_SIDESHEET_DATA)
    public data: {
      properties: FilterProperty[];
      selectedProperty?: FilterProperty;
    },
    private euiSidesheetRef: EuiSidesheetRef,
    private translateService: TranslateService,
  ) {}

  ngAfterViewInit(): void {
    this.euiSearch()?.inputElementRef?.nativeElement.focus();
  }

  public async ngOnInit(): Promise<void> {
    try {
      this.initTreeTable();
    } finally {
      this.busy = false;
    }
    this.initSearchControl();
  }

  /**
   * Close the sidesheet and pass the selected tree node.
   * @param selectedProperty Selected tree node
   */
  public apply(selectedProperty: TreeSelectionModel) {
    this.euiSidesheetRef.close({ PropertyId: selectedProperty.id, ColumnType: selectedProperty.columnType });
  }

  /** Returns false if there is no search result. */
  public hasSearchResults(): boolean {
    return this.dataSource.data.some((rootNode) => rootNode.elements && rootNode.elements.length > 0);
  }

  /**
   * Initialize the tree table.
   */
  private initTreeTable(): void {
    this.treeData = [
      {
        display: this.translateService.instant('#LDS#Value comparison'),
        elements: this.getProperties(SqlColumnTypes.Normal),
        level: 0,
        helpContextId: HELP_CONTEXTUAL.NestedFilterNormal,
        subtitle: this.translateService.instant('#LDS#Creates a simple condition'),
      },
      {
        display: this.translateService.instant('#LDS#References to other objects'),
        elements: this.getProperties(SqlColumnTypes.FK),
        level: 0,
        helpContextId: HELP_CONTEXTUAL.NestedFilterFK,
        subtitle: this.translateService.instant('#LDS#Creates a nested condition (n:1 relation)'),
      },
      {
        display: this.translateService.instant('#LDS#References through assignment tables'),
        elements: this.getProperties(SqlColumnTypes.MN),
        level: 0,
        helpContextId: HELP_CONTEXTUAL.NestedFilterMN,
        subtitle: this.translateService.instant('#LDS#Creates a nested condition (m:n relation)'),
      },
      {
        display: this.translateService.instant('#LDS#References from other objects'),
        elements: this.getProperties(SqlColumnTypes.CR),
        level: 0,
        helpContextId: HELP_CONTEXTUAL.NestedFilterCR,
        subtitle: this.translateService.instant('#LDS#Creates a nested condition (1:n relation)'),
      },
    ].filter((treeElement) => !!treeElement.elements.length);
    this.dataSource.data = this.treeData;
  }

  /**
   * Filter and convert the properties for the tree table.
   */
  private getProperties(columnType: SqlColumnTypes): TreeSelectionModel[] {
    return this.data.properties
      .filter((property) => property.ColumnType === columnType)
      .map((property) => ({ level: 1, id: property.PropertyId, display: property.Display || '', columnType: property.ColumnType }));
  }

  /**
   * Initialize the search from control.
   */
  private initSearchControl(): void {
    this.searchControl.valueChanges.pipe(distinctUntilChanged(), debounceTime(250)).subscribe((searchValue) => {
      if (!!searchValue) {
        this.dataSource.data =
          this.treeData
            .map((rootNode) => {
              const elements = rootNode.elements?.filter(
                (element) =>
                  element.display?.toLowerCase().trim().includes(searchValue.toLowerCase().trim()) ||
                  element.id?.toLowerCase().trim().includes(searchValue.toLowerCase().trim()),
              );
              return { ...rootNode, elements };
            })
            .filter((rootNode) => rootNode.elements?.length) || [];
        this.treeControl.expandAll();
      } else {
        this.dataSource.data = this.treeData;
        this.treeControl.collapseAll();
      }
    });
  }
}
