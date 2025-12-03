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

import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { EuiSelectOption, EuiSidesheetService } from '@elemental-ui/core';
import { FilterProperty, LogOp, SqlColumnTypes, SqlExpression } from '@imx-modules/imx-qbm-dbts';
import { TranslateService } from '@ngx-translate/core';
import { calculateSidesheetWidth } from '../base/sidesheet-helper';
import { SqlNodeView } from './SqlNodeView';
import { SqlWizardService } from './sqlwizard.service';
import { TreeSelectionSidesheetComponent } from './tree-selection-sidesheet.component';

@Component({
  templateUrl: './column-selection.component.html',
  selector: 'imx-sqlwizard-columnselection',
  styleUrls: ['./column-selection.component.scss'],
  standalone: false,
})
export class ColumnSelectionComponent implements OnInit, OnChanges {
  @Input() public node: SqlNodeView;

  @Output() public change = new EventEmitter<any>();

  public columns: FilterProperty[] = [];
  public dataReady = false;
  public negateControl = new FormControl();

  constructor(
    private readonly svc: SqlWizardService,
    private euiSidesheetService: EuiSidesheetService,
    private translateService: TranslateService,
  ) {}

  public async ngOnInit(): Promise<void> {
    await this.reloadColumns();

    this.negateControl.setValue(this.node.Data.Negate || false, { emitEvent: false });
    this.negateControl.valueChanges.subscribe((c) => {
      this.node.Data.Negate = c;
      this.change.emit();
    });
  }

  public ngOnChanges(changes: any): void {
    if (changes.node) {
      this.reloadColumns();
    }
  }
  public async selectColumn(column: { PropertyId: string; ColumnType: SqlColumnTypes }): Promise<void> {
    if (this.node.Property?.PropertyId === column.PropertyId && this.node.Property.ColumnType === column.ColumnType) {
      return;
    }
    const found = this.columns.filter((c) => c.PropertyId === column.PropertyId && c.ColumnType === column.ColumnType);
    if (found.length != 1) {
      throw new Error('Property not found: ' + column.PropertyId);
    }
    const filterProperty = found[0];

    // If there is only one operator, pre-select it.
    // this is important for boolean properties that do not show
    // an operator selection.
    let preselectedOperator: string | undefined;
    if (!!found[0].Operators?.length) {
      preselectedOperator = found[0].Operators[0].Type;
    }

    let data: SqlExpression;
    // create new empty node
    if (filterProperty.Type === this.node.Property?.Type && !filterProperty.SelectionTables && !this.node.Property.SelectionTables) {
      data = {
        ...this.node.Data,
        PropertyId: column.PropertyId,
      };
    } else {
      data = {
        PropertyId: column.PropertyId,
        Operator: preselectedOperator,
        LogOperator: LogOp.AND,
        Negate: false,
        Expressions: filterProperty.ColumnType !== SqlColumnTypes.Normal ? [] : undefined,
      };
    }

    this.node.Parent.replaceChildNode(this.node.Data, data);
    this.node.clearChildNodes();
    this.node.Data = data;
    this.node.Property = filterProperty;
    if (filterProperty.ColumnType !== SqlColumnTypes.Normal) {
      this.node.addChildNode(this.node.Property.SelectionTables?.[0].Name);
    }
    this.node.columnChanged.emit(column.PropertyId);
    this.change.emit();
  }
  public filter(option: EuiSelectOption, searchInputValue: string): boolean {
    return (
      (option.display.toUpperCase().trim().includes(searchInputValue.toUpperCase().trim()) ||
        option.displayDetail?.toUpperCase().trim().includes(searchInputValue.toUpperCase().trim())) ??
      false
    );
  }

  private async reloadColumns(): Promise<void> {
    const tableName = this.node.tableName;

    if (tableName) {
      this.columns = await this.svc.getColumns(this.node.viewSettings, tableName);
      this.dataReady = true;
    }
  }

  selectProperty() {
    this.euiSidesheetService
      .open(TreeSelectionSidesheetComponent, {
        title: this.translateService.instant('#LDS#Heading Select Filter Type and Property'),
        data: {
          properties: this.columns,
          selectedProperty: this.node.Property,
        },
        width: calculateSidesheetWidth(600, 0.4),
        autoFocus: false,
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.selectColumn(result);
      });
  }
}
