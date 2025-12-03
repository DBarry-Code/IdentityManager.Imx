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
import { EuiAlertBannerService } from '@elemental-ui/core';
import { TranslateService } from '@ngx-translate/core';
import { LdsReplacePipe } from '../lds-replace/lds-replace.pipe';
import { MastHeadService } from '../mast-head/mast-head.service';
import { StorageService } from '../storage/storage.service';
import { isIE } from './user-agent-helper';

/**
 * @deprecated since v10.0.0
  * 
 * Use Chrome/FF instead.
 * IE hasn't been supported for many versions now
 */
@Injectable({
  providedIn: 'root',
})
export class IeWarningService {
  constructor(
    private readonly storageService: StorageService,
    private readonly alertBanner: EuiAlertBannerService,
    private readonly translate: TranslateService,
    private readonly ldsReplace: LdsReplacePipe,
    private readonly mastHeadService: MastHeadService,
  ) { }

  /**
   * @deprecated since v10.0.0
    * 
  * Use Chrome/FF instead.
  * IE hasn't been supported for many versions now
  */
  public showIe11Banner() {
    if (isIE()) {
      const alertKey = 'warningAlertDismissed_ieSupportBanner';
      const supportedBrowsersTranslation = this.translate.instant('#LDS#Supported browsers');
      const docLink = `<a href='${this.mastHeadService.externalDocumentationLink()}' target='_blank' rel='noopener noreferrer'>${supportedBrowsersTranslation}</a>`;
      if (!this.storageService.isHelperAlertDismissed(alertKey)) {
        this.alertBanner.open({
          type: 'warning',
          dismissable: true,
          message: this.ldsReplace.transform(
            this.translate
              .instant(
                '#LDS#Internet Explorer is no longer supported and the application may not work properly. Please use a browser from the following list: {0}.',
              ),
            docLink,
          ),
        });
        this.alertBanner.userDismissed.subscribe(() => this.storageService.storeHelperAlertDismissal(alertKey));
      }
    }
  }
}
