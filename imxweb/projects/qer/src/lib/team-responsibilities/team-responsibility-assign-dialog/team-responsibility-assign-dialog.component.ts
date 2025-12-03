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

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PortalAdminPerson, PortalPersonReports, PortalRespTeamResponsibilities } from '@imx-modules/imx-api-qer';

@Component({
  selector: 'imx-team-responsibility-assign-dialog',
  templateUrl: './team-responsibility-assign-dialog.component.html',
  styleUrl: './team-responsibility-assign-dialog.component.scss',
  standalone: false,
})
export class TeamResponsibilityAssignDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<TeamResponsibilityAssignDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { responsibility: PortalRespTeamResponsibilities; identities: (PortalPersonReports | PortalAdminPerson)[] },
  ) {}

  public get getNumberOfIdentities(): number {
    return this.data.identities.length;
  }

  public get getResponsibleIdentity(): string {
    return this.data.identities[0].GetEntity().GetDisplay();
  }

  public get getResponsibilityName(): string {
    return this.data.responsibility.DisplayName.Column.GetDisplayValue();
  }
}
