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

import { Component, Input } from '@angular/core';
import { ConfigSettingType } from '@imx-modules/imx-api-qbm';
import { ConfigService } from '../config.service';
import { NodeSetting } from '../node-setting';

/** Component to edit a single configuration setting. */
@Component({
  selector: 'imx-config-setting',
  templateUrl: './config-setting.component.html',
  styleUrl: './config-setting.component.scss',
  standalone: false,
})
export class ConfigSettingComponent {
  constructor(public configSvc: ConfigService) {}

  @Input() conf: NodeSetting;

  ConfigSettingType = ConfigSettingType;

  public isBoolean(conf: NodeSetting): boolean {
    return conf.Type != ConfigSettingType.LimitedValues && typeof conf.Value == 'boolean';
  }

  public isArray(conf: NodeSetting): boolean {
    return Array.isArray(conf.Value);
  }

  public getValuePreview(conf: NodeSetting): string {
    var d = conf.Value + '';
    if (d.length > 30) d = d.substring(0, 30) + '...';
    return d;
  }

  public onChangeEvent(conf: NodeSetting) {
    this.configSvc.addChange(conf);
  }
}
