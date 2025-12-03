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
import { MatTooltipModule } from '@angular/material/tooltip';
import { EuiCoreModule, EuiSidesheetService } from '@elemental-ui/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HelpContextualComponent, HelpContextualModule } from 'qbm';
import { ChatbotSidesheetComponent } from './sidesheet/sidesheet.component';

@Component({
  selector: 'imx-chatbot',
  standalone: true,
  imports: [EuiCoreModule, MatButtonModule, MatTooltipModule, HelpContextualModule, TranslateModule],
  template: `
    <button mat-icon-button (click)="openSidesheet()" [matTooltip]="'#LDS#Query data with chatbot' | translate">
      <eui-icon icon="cloud-assistant"></eui-icon>
    </button>
  `
})
export class ChatbotButtonComponent {
  constructor(
    private sidesheetService: EuiSidesheetService,
    private translateService: TranslateService,
  ) {
  }
  public openSidesheet() {
    this.sidesheetService.open(ChatbotSidesheetComponent, {
      title: this.translateService.instant('#LDS#Heading Query Data with Chatbot'),
      icon: 'cloud-assistant',
      width: '960px',
      padding: '0',
      headerComponent: HelpContextualComponent,
    });
  }
}
