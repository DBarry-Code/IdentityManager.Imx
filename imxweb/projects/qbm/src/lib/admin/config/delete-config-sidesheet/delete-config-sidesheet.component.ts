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

import { Component, OnInit } from '@angular/core';
import { EuiLoadingService, EuiSidesheetRef } from '@elemental-ui/core';
import { ConfirmationService } from '../../../confirmation/confirmation.service';
import { SnackBarService } from '../../../snackbar/snack-bar.service';
import { ConfigService } from '../config.service';
import { NodeSetting } from '../node-setting';
import { PathData } from '../path-data';

@Component({
  templateUrl: './delete-config-sidesheet.component.html',
  styleUrls: ['../add-config-sidesheet/add-config-sidesheet.component.scss'],
  standalone: false,
})
export class DeleteConfigSidesheetComponent implements OnInit {
  constructor(
    private readonly configSvc: ConfigService,
    private readonly sideSheetRef: EuiSidesheetRef,
    private readonly busySvc: EuiLoadingService,
    private readonly snackbar: SnackBarService,
    private readonly confirm: ConfirmationService,
  ) {}

  keyData: PathData[];
  selectedKey: NodeSetting;

  public ngOnInit(): void {
    this.keyData = this.configSvc.deletableKeys;
  }

  public isGlobal: boolean = false;

  public async submit(): Promise<void> {
    const result = await this.confirm.confirmDelete(
      '#LDS#Delete configuration key',
      '#LDS#Are you sure you want to delete the configuration key?',
    );
    if (result === false) {
      return;
    }
    const overlay = this.busySvc.show();
    try {
      await this.configSvc.deleteKey(this.selectedKey.Path);
      await this.configSvc.load();
      const key = '#LDS#The configuration key has been successfully deleted.';
      this.snackbar.open({ key });
    } finally {
      this.busySvc.hide(overlay);
    }
    this.sideSheetRef.close(true);
  }
}
