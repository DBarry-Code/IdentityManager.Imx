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

import { ApiConfigModel, ConfigNodeData } from '@imx-modules/imx-api-qbm';
import { NodeSetting } from './node-setting';

/** Represents a single node in the configuration tree. Each node consists of child nodes and a list of settings. */
export class ConfigTreeNode {
  constructor(
    public readonly nodeData: ConfigNodeData,
    private readonly apiConfigModel: ApiConfigModel,
    public readonly Path: string,
    public readonly DisplayPath: string[],
  ) {
    var children = this.nodeData.Children || [];
    this.children = children.map((child) => {
      return new ConfigTreeNode(child, this.apiConfigModel, this.Path + '/' + child.Key, [...this.DisplayPath, child.Name || '']);
    });

    this.settings = (this.nodeData.Settings || []).map((setting) => {
      const searchTerms = [
        ...this.DisplayPath.map((d) => d?.toLowerCase()),
        (setting.Name || '').toLowerCase(),
        (setting.Key || '').toLowerCase(),
        (setting.Description || '').toLowerCase(),
      ];

      const settingPath = this.Path + '/' + setting.Key;
      return {
        ...setting,
        DisplayPath: [...this.DisplayPath, setting.Name || ''],
        Path: settingPath,
        searchTerms: searchTerms,
        isDeletable: this.apiConfigModel.Added?.includes(settingPath) || false,
      };
    });
  }

  isDeletable() {
    return this.apiConfigModel.Added?.includes(this.Path) || false;
  }

  readonly children: ConfigTreeNode[];

  readonly settings: NodeSetting[];
}
