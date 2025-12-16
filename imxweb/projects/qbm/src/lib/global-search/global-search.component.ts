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

import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EuiCoreModule, EuiSidesheetService } from '@elemental-ui/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { calculateSidesheetWidth } from '../base/sidesheet-helper';
import { HelpContextualComponent } from '../help-contextual/help-contextual.component';
import { HelpContextualModule } from '../help-contextual/help-contextual.module';
import { HelpContextualService } from '../help-contextual/help-contextual.service';
import { GlobalSearchService } from './global-search.service';
import { GlobalSearchSidesheetComponent } from './sidesheet/sidesheet.component';

/**
 * Global search component that will pop a sidesheet with a data table for searching for an object.
 * 
 * If there is no api search implemented for an application, this component will safely render empty.
 * 
 * So a portal needs to implement a GlobalSearchService for this to be used.
 */
@Component({
  selector: 'imx-global-search',
  standalone: true,
  imports: [EuiCoreModule, MatButtonModule, MatTooltipModule, TranslateModule, GlobalSearchSidesheetComponent, HelpContextualModule],
  template: `
    @if(searchService) {
      <button matIconButton (click)="openSidesheet()" [matTooltip]="'#LDS#Search for objects in the database' | translate">
        <eui-icon icon="search" />
      </button>
    }
  `,
})
export class GlobalSearchComponent {
  public searchService = inject(GlobalSearchService, { optional: true });
  private sidesheetService = inject(EuiSidesheetService);
  private translateService = inject(TranslateService);
  private helpContextualService = inject(HelpContextualService);

  public openSidesheet() {
    if (this.searchService?.helpContextId) this.helpContextualService.setHelpContextId(this.searchService.helpContextId);
    this.sidesheetService.open(GlobalSearchSidesheetComponent, {
      title: this.translateService.instant('#LDS#Heading Search'),
      icon: 'search',
      width: calculateSidesheetWidth(800),
      headerComponent: this.searchService?.helpContextId ? HelpContextualComponent : undefined,
    });
  }
}
