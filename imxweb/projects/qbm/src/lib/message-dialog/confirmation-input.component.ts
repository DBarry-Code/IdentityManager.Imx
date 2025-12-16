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

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { LdsReplacePipe } from '../lds-replace/lds-replace.pipe';

@Component({
  selector: 'imx-confirmation-input',
  template: `
    <div class="confirmation-input-container imx-margin-top-32">
      <eui-form-field>
        <eui-label>{{ promptMessage | translate | ldsReplace: expectedValue }}</eui-label>
        <input 
          matInput           
          autocomplete="off"
          (input)="onInputChange()"
          [placeholder]="placeholder"
          [formControl]="requiredCtrl" 
          [required]="true"
        >
        <mat-error>
          {{ '#LDS#To confirm, enter "{0}".' | translate | ldsReplace: expectedValue }}
        </mat-error>
      </eui-form-field>
    </div>
  `,
  standalone: false
})
export class ConfirmationInputComponent {
  @Input() expectedValue: string = '';
  @Input() promptMessage: string = '';
  @Input() inputLabel: string = '';
  @Input() placeholder: string = '';
  @Output() validationChanged = new EventEmitter<boolean>();

  protected requiredCtrl = new FormControl('', [Validators.required]);

  constructor(protected readonly translate: TranslateService, protected ldsReplace: LdsReplacePipe) { }

  onInputChange(): void {
    const isValid = this.requiredCtrl.value?.trim() === this.expectedValue.trim();
    this.validationChanged.emit(isValid);
  }
}