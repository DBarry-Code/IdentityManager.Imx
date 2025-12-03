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

import { Injectable } from '@angular/core';
import { EuiLoadingService } from '@elemental-ui/core';

import { ApiConfigModel, ConfigNodeData } from '@imx-modules/imx-api-qbm';
import { Subject } from 'rxjs';
import { imx_SessionService } from '../../session/imx-session.service';
import { SnackBarService } from '../../snackbar/snack-bar.service';
import { ConfigTreeNode } from './config-tree-node';
import { ConfigView } from './config-view';
import { NodeSetting } from './node-setting';
import { PathData } from './path-data';

export interface ConfigServiceFilter {
  customized: boolean;
  keywords: string[];
}

@Injectable()
export class ConfigService {
  public model: ApiConfigModel;

  public get pendingChangeCount(): number {
    return Object.keys(this.pendingChanges).length;
  }

  private buildRootNode(node: ConfigNodeData) {
    return new ConfigTreeNode(node, this.model, node.Key || '', []);
  }

  private *walkNodes(nodes: ConfigTreeNode[]): Generator<ConfigTreeNode, void> {
    for (let node of nodes) {
      yield node;

      for (let child of this.walkNodes(node.children)) {
        yield child;
      }
    }
  }

  public appId: string;

  /** Contains the filtered section view */
  public configView: ConfigView[] = [];

  private rootNodes: ConfigTreeNode[] = [];

  public addableNodes: ConfigTreeNode[] = [];

  public localCustomizations: NodeSetting[] = [];

  /** paths that can be deleted */
  public deletableKeys: PathData[] = [];

  public get supportsLocalCustomization() {
    return this.model.SupportsLocalCustomization;
  }

  public submitChanges: Subject<void> = new Subject();

  public filter: ConfigServiceFilter = { customized: false, keywords: [] };

  private pendingChanges: {
    [appId: string]: {
      [id: string]: NodeSetting;
    };
  } = {};

  constructor(
    private readonly session: imx_SessionService,
    private readonly busySvc: EuiLoadingService,
    private readonly snackbar: SnackBarService,
  ) {}

  /** Returns display information about the pending changes to keys. */
  public getPendingChanges(): (string | undefined)[][] {
    const result: (string | undefined)[][] = [];
    for (const appId in this.pendingChanges) {
      if (Object.prototype.hasOwnProperty.call(this.pendingChanges, appId)) {
        for (const elem of Object.values(this.pendingChanges[appId])) {
          result.push([appId, ...elem.DisplayPath]);
        }
      }
    }
    return result;
  }

  public addChange(conf: NodeSetting): void {
    this.initForAppId();
    this.pendingChanges[this.appId][conf.Path] = conf;
  }

  public async addKey(path: string): Promise<void> {
    await this.session.Client.admin_apiconfigsingle_post(this.appId, path);
  }

  public async deleteKey(path: string): Promise<void> {
    const payload = {};
    payload[path] = null;
    await this.session.Client.admin_apiconfig_post(this.appId, payload);
  }

  public async convert(): Promise<void> {
    const overlay = this.busySvc.show();
    try {
      await this.session.Client.admin_apiconfig_convert_post(this.appId);
      this.load();
    } finally {
      this.busySvc.hide(overlay);
    }
  }

  public async revert(conf: NodeSetting) {
    const overlay = this.busySvc.show();

    try {
      // delete pending change if there is one
      if (this.pendingChanges[this.appId]) {
        delete this.pendingChanges[this.appId][conf.Path];
      }
      const confObj = {};
      // setting to null value, meaning: revert
      confObj[conf.Path] = null;
      await this.session.Client.admin_apiconfig_post(this.appId, confObj, { global: !conf.HasCustomLocalValue });
      delete this.pendingChanges[this.appId];

      // reload all to get the effective value. there is no good way to get just
      // the new effective value of the changed key.
      await this.load();
      this.submitChanges.next();
    } finally {
      this.busySvc.hide(overlay);
    }
  }

  public async revertAll(isGlobal: boolean) {
    const overlay = this.busySvc.show();

    try {
      await this.session.Client.admin_apiconfig_revert_post(this.appId, { global: isGlobal });
      delete this.pendingChanges[this.appId];
      await this.load();
    } finally {
      this.busySvc.hide(overlay);
    }
  }

  public async submit(isGlobal: boolean): Promise<void> {
    const overlay = this.busySvc.show();

    try {
      const key = isGlobal
        ? '#LDS#Your changes have been successfully saved. The changes apply to all API Server instances connected to the software update process. It may take some time for the changes to take effect.'
        : '#LDS#Your changes have been successfully saved. The changes only apply to this API Server and will be lost when you restart the server.';

      for (let appId in this.pendingChanges) {
        const changeObj: { [id: string]: any } = {};
        const changes = this.pendingChanges[appId];
        for (const elem in changes) {
          if (Object.prototype.hasOwnProperty.call(changes, elem)) {
            changeObj[elem] = changes[elem].Value;
          }
        }

        await this.session.Client.admin_apiconfig_post(appId, changeObj, { global: isGlobal });
      }

      this.pendingChanges = {};
      await this.load();
      this.submitChanges.next();
      this.snackbar.open({ key });
    } finally {
      this.busySvc.hide(overlay);
    }
  }

  public setAppId(appId: string): void {
    this.appId = appId;
  }

  public setFilter(filter: ConfigServiceFilter): void {
    this.filter = filter;
  }

  public async load() {
    this.model = await this.session.Client.admin_apiconfig_get(this.appId);
    this.rootNodes = (this.model.Data || []).map((r) => this.buildRootNode(r));

    this.addableNodes = [];
    this.deletableKeys = [];
    this.localCustomizations = [];

    const treeWalk = this.walkNodes(this.rootNodes);
    while (true) {
      const result = treeWalk.next();

      if (result.done) break;

      const node = result.value;
      if (node.nodeData.CanAddSetting) {
        this.addableNodes.push(node);
      }

      if (node.isDeletable()) {
        this.deletableKeys.push(node);
      }

      for (var setting of node.settings) {
        if (setting.isDeletable) this.deletableKeys.push(setting);
        if (setting.HasCustomLocalValue) this.localCustomizations.push(setting);
      }
    }

    await this.updateView();
  }

  public updateView() {
    this.configView = [];

    // Build a section for each top-level node matching the current filter
    for (let rootNode of this.rootNodes) {
      const treeWalk = this.walkNodes([rootNode]);
      let settings: NodeSetting[] = [];

      while (true) {
        const result = treeWalk.next();

        if (result.done) break;

        const node = result.value;

        for (var setting of node.settings) {
          const settingMatches = this.matches(setting);
          if (settingMatches) settings.push(setting);
        }
      }

      if (settings.length > 0) this.configView.push({ allSettings: settings, topLevelNode: rootNode });
    }
  }

  private initForAppId(): void {
    if (!this.pendingChanges[this.appId]) {
      this.pendingChanges[this.appId] = {};
    }
  }

  private matches(d: NodeSetting): boolean {
    if (this.filter.customized && !d.HasCustomGlobalValue && !d.HasCustomLocalValue) {
      return false;
    }

    if (
      !this.filter.keywords ||
      d.searchTerms.some((searchTerm) => this.filter.keywords.every((keyword) => searchTerm?.includes(keyword)))
    ) {
      return true;
    }

    return false;
  }
}
