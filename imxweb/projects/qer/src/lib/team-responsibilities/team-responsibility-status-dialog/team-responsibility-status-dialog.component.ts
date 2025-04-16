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
 * Copyright 2024 One Identity LLC.
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

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'imx-team-responsibility-status-dialog',
  templateUrl: './team-responsibility-status-dialog.component.html',
  styleUrl: './team-responsibility-status-dialog.component.scss',
})
export class TeamResponsibilityStatusDialogComponent {
  public shoppingCartInfoPlural =
    '#LDS#{0} responsibilities have been successfully removed. {0} responsibilities have been added to your shopping cart. To complete the process, submit your shopping cart.';
  public shoppingCartInfoSingular =
    '#LDS#One responsibility has been successfully removed. One responsibility has been added to your shopping cart. To complete the process, submit your shopping cart.';
  public reassignInfoSingular = '#LDS#One responsibility has been successfully reassigned.';
  public reassignInfoPlural = '#LDS#{0} responsibilities have been successfully reassigned.';
  constructor(
    public dialogRef: MatDialogRef<TeamResponsibilityStatusDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { reassignedResponsibilities: number; cartResponsibilities: number },
  ) {}

  public get shoppingCartInfo(): string {
    return this.data.cartResponsibilities == 1 ? this.shoppingCartInfoSingular : this.shoppingCartInfoPlural;
  }

  public get reassignInfo(): string {
    return this.data.reassignedResponsibilities == 1 ? this.reassignInfoSingular : this.reassignInfoPlural;
  }
}
