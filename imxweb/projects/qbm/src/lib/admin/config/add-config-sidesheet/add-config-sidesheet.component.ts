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
import { EuiLoadingService, EuiSelectOption, EuiSidesheetRef } from '@elemental-ui/core';
import { ElementalUiConfigService } from '../../../configuration/elemental-ui-config.service';
import { imx_SessionService } from '../../../session/imx-session.service';
import { SnackBarService } from '../../../snackbar/snack-bar.service';
import { ConfigTreeNode } from '../config-tree-node';
import { ConfigService } from '../config.service';

@Component({
  templateUrl: './add-config-sidesheet.component.html',
  styleUrls: ['./add-config-sidesheet.component.scss'],
  standalone: false,
})
export class AddConfigSidesheetComponent implements OnInit {
  constructor(
    private readonly configSvc: ConfigService,
    private readonly sideSheetRef: EuiSidesheetRef,
    private readonly busySvc: EuiLoadingService,
    private readonly snackbar: SnackBarService,
    private readonly session: imx_SessionService,
    public elementalUiConfigService: ElementalUiConfigService,
  ) { }

  keyData: ConfigTreeNode[];
  selectedKey: ConfigTreeNode;
  newKey: string;
  addableKeys: EuiSelectOption[] = [];
  busy = false;
  newKeyDescription: string;

  ngOnInit(): void {
    this.keyData = this.configSvc.addableNodes;
  }

  public isGlobal: boolean = false;

  public async loadAddableKeys() {
    this.busy = true;
    try {
      this.addableKeys = [];
      this.newKeyDescription = '';
      const addableKeyData = await this.session.Client.admin_apiconfig_keys_get(this.configSvc.appId, this.selectedKey.Path);
      this.addableKeys =
        addableKeyData.Keys?.map((k) => ({
          value: k.Key ?? '',
          display: k.Description ?? k.Key ?? '',
          displayDetail: k.Description ? k.Key : '',
        })) ?? [];
      this.newKeyDescription = addableKeyData.Description ?? this.selectedKey.nodeData.Description ?? '';
    } finally {
      this.busy = false;
    }
  }

  public async submit(): Promise<void> {
    const overlay = this.busySvc.show();
    try {
      await this.configSvc.addKey(this.selectedKey.Path + '/' + this.newKey);
      await this.configSvc.load();
      const key = '#LDS#The configuration key has been successfully created.';
      this.snackbar.open({ key });
    } finally {
      this.busySvc.hide(overlay);
    }
    this.sideSheetRef.close();
  }
}
