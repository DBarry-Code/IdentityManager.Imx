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

import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';
import { EuiCoreModule } from '@elemental-ui/core';
import { TranslateModule } from '@ngx-translate/core';
import { ErrorPageService } from './error-page.service';

/** This component is intended to show errors that occur during application initialization, for example in case of
 * a failing connection to the API Server.
 */
@Component({
  standalone: true,
  styles: `
    :host {
      padding: 8px;
    }

    .buttons {
      margin-top: 8px;
    }
  `,
  templateUrl: './error-page.component.html',
  imports: [EuiCoreModule, MatButtonModule, TranslateModule, RouterModule],
})
export class ErrorPageComponent {
  constructor(
    private readonly router: Router,
    private readonly errorPageService: ErrorPageService,
  ) {}

  public ldsKey = '#LDS#The application could not be initialized.';

  public get errorMessage() {
    return this.errorPageService.errorMessage;
  }

  retryLoad() {
    // Because the application has not been correctly initialized, fully reload the page.
    this.router.navigate(['']).then(() => {
      window.location.reload();
    });
  }
}
