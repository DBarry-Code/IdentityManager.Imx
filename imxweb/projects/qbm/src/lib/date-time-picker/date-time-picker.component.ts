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

import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { EuiCoreModule } from '@elemental-ui/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import moment, { Moment } from 'moment-timezone';
import 'moment/locale/de';
import { Subscription } from 'rxjs';

@Component({
  selector: 'imx-date-time-picker',
  styleUrls: ['./date-time-picker.component.scss'],
  templateUrl: './date-time-picker.component.html',
  imports: [CommonModule, TranslateModule, EuiCoreModule, ReactiveFormsModule],
  providers: [
    // provide a date adapter
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateTimePickerComponent),
      multi: true,
    },
  ],
  standalone: true,
})
/**
 * A control to edit date values
 */
export class DateTimePickerComponent implements ControlValueAccessor, OnInit, OnDestroy {
  /**
   * @ignore only used internally
   * FormControl needed by the eui datepicker
   */
  public dateFormControl: FormControl<any>;

  /**
   * @ignore only used internally
   * FormControl needed by the eui datepicker
   */
  public timeFormControl: FormControl<any>;

  /** Text for the label */
  @Input() public label: string = '';

  /** Set to true to only show the time picker */
  @Input() public timeOnly: boolean = false;

  @Input() public disabled: boolean = false;

  @Input() public min: Moment;
  @Input() public max: Moment;

  /**
   * @ignore only used internally
   * subcsription for value changes
   */
  public subscriptions: Subscription[] = [];

  /**
   * The date value provided by the user
   */
  public value: Date | undefined;

  constructor(translateService: TranslateService, dateAdapter: DateAdapter<any>) {
    moment.locale(translateService.currentLang);
    dateAdapter.setLocale(translateService.currentLang);
  }

  //#region ControlValueAccessor methods
  onChange = (_: any) => {};
  onTouched = () => {};
  public writeValue(value: any): void {
    if (value) {
      this.dateFormControl.setValue(moment(value), { emitEvent: false });
      this.timeFormControl.setValue(moment(value), { emitEvent: false });
    } else {
      this.dateFormControl.setValue('', { emitEvent: false });
      this.timeFormControl.setValue('', { emitEvent: false });
    }
    this.value = value?._isAMomentObject ? value.toDate() : value;
    this.onChange(this.value);
    this.onTouched();
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach((elem) => elem.unsubscribe());
  }

  //#endregion

  public ngOnInit(): void {
    this.dateFormControl = new FormControl<Moment>(moment(this.value), { nonNullable: true });
    this.timeFormControl = new FormControl<Moment>(moment(this.value), { nonNullable: true });
    this.subscriptions.push(this.dateFormControl.valueChanges.subscribe((elem) => this.updateDateOnly(elem)));
    this.subscriptions.push(this.timeFormControl.valueChanges.subscribe((elem) => this.writeValue(elem)));
  }

  /**
   * Updates the bound value, without changing its hour and minutes
   * @param date the new date
   */
  private updateDateOnly(momDate: Moment | undefined): void {
    const oldDate = new Date(this.value ?? 0);
    const date = momDate ? momDate?.toDate() : undefined;

    if (date) {
      date.setHours(oldDate.getHours() ?? 0);
      date.setMinutes(oldDate.getMinutes() ?? 0);
    }

    this.writeValue(date);
    this.timeFormControl.setValue(this.value ? moment(this.value) : undefined);
  }
}
