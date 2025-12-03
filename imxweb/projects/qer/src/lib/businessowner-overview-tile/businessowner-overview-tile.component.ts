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

/**
 * @deprecated since v10.0.0
  * 
 * Use the TileComponent instead.
 */
@Component({
    templateUrl: './businessowner-overview-tile.component.html',
    selector: 'imx-businessowner-overview-tile',
    standalone: false
})
export class BusinessOwnerOverviewTileComponent {
  /* TODO (TFS 806002)
  ExpressionColumnList({"ScriptItemUID":"ExpressionColumnList2","ColumnList":"GetConfig(PropertyList())"});
  }*/

  @Input() public squareText: string;
  @Input() public propertyList: string;
  @Input() public editTable: {};

  @Output() public squareAction: EventEmitter<any> = new EventEmitter();

  public Action2(): void {
    this.squareAction.emit({});
  }
}
