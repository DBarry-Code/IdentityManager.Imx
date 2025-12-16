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

import { Component, contentChild, Input, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { ContextualHelpItem } from '@imx-modules/imx-api-qbm';
import { HelpContextualDialogComponent } from './help-contextual-dialog/help-contextual-dialog.component';
import { HelpContextualTemplate } from './help-contextual-template.directive';
import { HELP_CONTEXTUAL, HelpContextualService, HelpContextualValues } from './help-contextual.service';
/**
 * Help contextual component
 * @example
 * <imx-help-contextual [contextId]="contextId"></imx-help-contextual>
 *
 * @example
 * <imx-help-contextual></imx-help-contextual>
 *  const routes: Routes = [
 *    {
 *      path: 'newrequest',
 *      component: NewRequestComponent,
 *      data:{
 *        contextId: HELP_CONTEXTUAL.NewRequest
 *      }
 *    },
 *  ];
 *
 * @example
 *  this.helpContextualService.setHelpContextId(HELP_CONTEXTUAL.NewRequest);
 *  this.sideSheet.open(ExampleSidesheetComponent, {
 *    title: 'Sidesheet title',
 *    headerComponent: HelpContextualComponent
 *  });
 *
 * @example
 * <imx-help-contextual [templateRef]="templateRef">
 *  <ng-template imx-help-component-template>
 *    <div class="unique custom-style">
 *      ~Content that will render below details and above links goes here~
 *    </div>
 *  </ng-template>
 * </imx-help-contextual>
 * Note: If you want to style this projected content, you must define the unique class in the parent component outside of a host selector.
 */

export interface ExtendedHelpContextualItem extends ContextualHelpItem {
  templateRef?: HelpContextualTemplate;
}
@Component({
  selector: 'imx-help-contextual',
  templateUrl: './help-contextual.component.html',
  styleUrls: ['./help-contextual.component.scss'],
  standalone: false,
})
export class HelpContextualComponent implements OnDestroy {
  @Input() contextId: HelpContextualValues;
  @Input() size: 's' | 'm' | 'l' | 'xl' = 'm';
  @Input() title: string;

  /**
   Get the content child that is projected into the help contextual component and pass it into the dialog to render after details and before links.
   */
  private helpContextualTemplate = contentChild(HelpContextualTemplate);

  constructor(
    private router: ActivatedRoute,
    private helpContextualService: HelpContextualService,
    private dialog: MatDialog,
  ) {}

  ngOnDestroy(): void {
    this.helpContextualService.setHelpContextId(null);
  }
  /**
   * The call opens the dialog with the contextual help data.
   */
  public async onShowHelp(): Promise<void> {
    const id = this.getContextId();
    if (!id) {
      return;
    }
    const contextualHelpData = await this.helpContextualService.getHelpContext(id);
    this.dialog.open(HelpContextualDialogComponent, {
      data: { ...contextualHelpData, templateRef: this.helpContextualTemplate() },
    });
  }

  /**
   * The call returns the selected context ID.
   * @returns {HelpContextualValues}
   */
  private getContextId(): HelpContextualValues | null {
    if (!!this.contextId) {
      return this.contextId;
    }
    if (!!this.helpContextualService.GetHelpContextId()) {
      return this.helpContextualService.GetHelpContextId();
    }
    let contextId: HelpContextualValues;
    contextId = this.router.snapshot.data?.contextId as HelpContextualValues;
    return contextId || HELP_CONTEXTUAL.Default;
  }
}
