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

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LogOp as _logOp } from '@imx-modules/imx-qbm-dbts';
import { ConfirmationService } from '../confirmation/confirmation.service';
import { MessageDialogResult } from '../message-dialog/message-dialog-result.enum';
import { MessageParameter } from '../message-dialog/message-parameter.interface';
import { SqlNodeView, SqlViewSettings } from './SqlNodeView';

@Component({
  selector: 'imx-sqlwizard-singleexpression',
  styleUrls: ['single-expression.component.scss', './sqlwizard.scss'],
  templateUrl: './single-expression.component.html',
  standalone: false,
})
export class SingleExpressionComponent {
  @Input() public expr: SqlNodeView;
  @Input() public first: boolean;
  @Input() public last: boolean;
  @Input() public viewSettings: SqlViewSettings;

  @Output() public change = new EventEmitter<any>();

  constructor(private readonly confirmService: ConfirmationService) {}

  public LogOp = _logOp;
  public readonly andConditionLabel = '#LDS#Condition_And';
  public readonly orConditionLabel = '#LDS#Condition_Or';

  public get showAddCondition(): boolean {
    return !!this.expr.Property?.ColumnType && this.expr.Property.ColumnType !== 1;
  }

  public emitChanges(): void {
    this.change.emit();
  }

  /** Returns true if the expression is empty. */
  public IsEmpty(): boolean {
    return !this.expr.Data.PropertyId;
  }

  /** Toggles the logical operator of the parent expression. */
  public toggleLogOperator() {
    this.expr.Parent.Data.LogOperator = this.expr.Parent.Data.LogOperator === _logOp.OR ? _logOp.AND : _logOp.OR;
    this.change.emit();
  }

  /** Adds a new expression as child of the current expression. */
  public async addExpression(): Promise<void> {
    await this.expr.addChildNode(this.expr.Property?.SelectionTables?.[0].Name);
    this.emitChanges();
  }

  /** Removes the expression after confirmation if it contains sub-expressions. */
  public removeExpression(): void {
    if (this.expr.Data.Expressions?.length!!) {
      const data: MessageParameter = {
        Title: '#LDS#Heading Remove Condition Group',
        Message:
          '#LDS#This condition group contains multiple conditions and/or sub-conditions. If you remove it, all conditions and sub-conditions it contains will also be removed. Are you sure you want to remove this condition group?',
        ShowCancel: true,
        customButtons: [
          {
            title: '#LDS#Remove condition group',
            action: MessageDialogResult.YesResult,
            type: 'warn',
          },
        ],
      };
      this.confirmService.confirmGeneral(data).then((result) => {
        if (result) {
          this.removeCondition();
        }
      });
    } else {
      this.removeCondition();
    }
  }

  /** Handles the change event of the logical operator toggle button. */
  public onOperatorChanged(): void {
    this.expr.Data.LogOperator === this.LogOp.OR
      ? (this.expr.Data.LogOperator = this.LogOp.AND)
      : (this.expr.Data.LogOperator = this.LogOp.OR);
    this.change.emit();
  }

  /** Returns the text for the logical operator toggle button. */
  public logOpText(): string {
    return this.expr.Data.LogOperator === this.LogOp.AND ? this.andConditionLabel : this.orConditionLabel;
  }

  /** Returns the tooltip for the logical operator toggle button. */
  public logOpTooltip(): string {
    return this.expr.Data.LogOperator === this.LogOp.AND ? '#LDS#Change logical operator to OR' : '#LDS#Change logical operator to AND';
  }

  /** Removes the condition and ensures that at least one condition exists in the parent. */
  private removeCondition(): void {
    this.expr.remove();
    if (!this.expr.Parent.childViews.length) {
      this.expr.Parent.addChildNode();
    }
    this.emitChanges();
  }
}
