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

import { computed, Injectable, Signal, signal } from '@angular/core';
import { ChapterLink, SessionInfoData } from '@imx-modules/imx-api-qbm';
import { Subject } from 'rxjs';
import { AppConfigService } from '../appConfig/appConfig.service';
import { ClassloggerService } from '../classlogger/classlogger.service';
import { ExtendedHelpContextualItem } from '../help-contextual/help-contextual.component';
import { HELP_CONTEXTUAL, HelpContextualService, HelpContextualValues } from '../help-contextual/help-contextual.service';
import { PortalIdentifiers } from '../portal-switcher/portal-indentifier';
import { MastHeadMenuItem } from './mast-head-menu-item.interface';
import { MastHeadMenu } from './mast-head-menu.interface';

@Injectable()
export class MastHeadService {
  public itemClickedSubject: Subject<MastHeadMenu | MastHeadMenuItem> = new Subject();
  private contextItem = signal<ExtendedHelpContextualItem | undefined>(undefined);
  /**
   * Assume that there is only one link to a documentation page for any portal's context and that it is absolute
   */
  public externalDocumentationLink: Signal<ChapterLink | undefined> = computed(() => {
    const item = this.contextItem();
    return item?.Links?.[0];
  });

  constructor(
    private readonly appConfig: AppConfigService,
    private helpContextService: HelpContextualService,
    private logger: ClassloggerService,
  ) {
    let context: HelpContextualValues;
    switch (this.appConfig.Config.WebAppIndex) {
      case PortalIdentifiers.Portal.id:
        context = HELP_CONTEXTUAL.MastHeadPortal;
        break;
      case PortalIdentifiers.OpsWeb.id:
        context = HELP_CONTEXTUAL.MastHeadOpsWeb;
        break;
      case PortalIdentifiers.Admin.id:
        context = HELP_CONTEXTUAL.MastHeadAdmin;
        break;
      default:
        logger.debug(this, 'No documentation exists for this portal, referring to the dashboard documentation');
        context = HELP_CONTEXTUAL.MastHeadGeneric;
    }
    this.helpContextService
      .getHelpContext(context)
      .then((item) => this.contextItem.set(item))
      .catch((err) => this.logger.error(this, err));
  }

  public itemClicked(menuItem: MastHeadMenu | MastHeadMenuItem): void {
    this.itemClickedSubject.next(menuItem);
  }

  public async getConnectionData(appId: string): Promise<SessionInfoData> {
    return await this.appConfig.client.imx_sessions_info_get(appId);
  }

  public getDocumentLink(link: ChapterLink | undefined): string {
    if (!link) {
      return '';
    }
    if (link.IsExternal) {
      return link.Url ?? '';
    }
    return link.Url ? this.helpContextService.getHelpLink(link.Url) : '';
  }
}
