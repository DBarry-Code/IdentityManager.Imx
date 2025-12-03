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

import { HttpHeaders } from "@angular/common/http";
import { Component, Inject, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { EuiCoreModule, EuiDownloadOptions, EuiSelectOption } from "@elemental-ui/core";
import { TranslateModule } from "@ngx-translate/core";
import { AppConfigService, DataSourceToolbarExportMethod, ElementalUiConfigService, ExportColumnsService, LdsReplaceModule } from 'qbm';

/**
 * Data expected to be injected into this dialog
 */
export interface ChatbotDialogData {
  exportMethod: DataSourceToolbarExportMethod,
  prompt: string,
  totalCount: number
}

@Component({
  standalone: true,
  imports: [EuiCoreModule, LdsReplaceModule, MatButtonModule, MatCardModule, MatDialogModule, TranslateModule],
  template: `
    <h2 mat-dialog-title>{{'#LDS#Heading Export Query Results' | translate}}</h2>
    <mat-dialog-content class="container">
      <span class="format-text">
        {{'#LDS#Here you can export all {0} results of the following query.' | translate | ldsReplace: data.totalCount}}
      </span>
      <mat-card class="query-card">
        <span class="format-text">
          {{ data.prompt }}
        </span>
      </mat-card>
      <eui-select
        [hideClearButton]="true"
        class="imx-eui-select-toolbar"
        smallInput="true"
        [label]="'#LDS#Export format' | translate"
        [inputControl]="selectedExport"
        [options]="columnExportService.exportOptions"
        [filterFunction]="columnExportService.exportOptionsFilter"
        (selectionChange)="onChangeType($event.length ? $event[0] : $event)"
        [attr.aria-label]="'#LDS#Export format' | translate"
        [feedbackMessages]="elementalUiConfigService.SelectFeedbackMessages"
        data-imx-identifier="export-type-select"
        >
      </eui-select>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-stroked-button (click)="onClose()">{{'#LDS#Cancel' | translate}}</button>
      <button mat-flat-button color=primary [euiDownload]="downloadOptions" (click)="onClose()" cdkFocusInitial>
        <eui-icon size="s" icon="export"></eui-icon>
        {{'#LDS#Export' | translate}}
      </button>
    </mat-dialog-actions>
  `,
  styleUrl: './export-dialog.component.scss'
})
export class ChatbotExportDialogComponent implements OnInit {
  downloadOptions: EuiDownloadOptions;
  selectedExport: FormControl<string>;

  constructor(
    public columnExportService: ExportColumnsService,
    private readonly config: AppConfigService,
    @Inject(MAT_DIALOG_DATA) public data: ChatbotDialogData,
    private dialogRef: MatDialogRef<ChatbotExportDialogComponent>,
    public readonly elementalUiConfigService: ElementalUiConfigService,
  ) { }

  ngOnInit(): void {
    // Default to using the first export option which here is CSV
    this.selectedExport = new FormControl(this.columnExportService.exportOptions[0].value, { nonNullable: true })
    this.setDownloadOptions();
  }

  /**
   * Sets download options from the default EUI config, and current selected export
   */
  private setDownloadOptions() {
    this.downloadOptions = {
      ...this.elementalUiConfigService.Config.downloadOptions,
      fileMimeType: this.selectedExport.value,
      requestOptions: {
        headers: new HttpHeaders({ Accept: this.selectedExport.value }),
        withCredentials: true,
      },
      url: this.config.BaseUrl + this.data.exportMethod.getMethod('').path,
    };
  }

  /**
   * Handles changing the EUI selection and adjusting download headers
   * @param type 
   */
  public onChangeType(type: EuiSelectOption) {
    this.downloadOptions = {
      ...this.downloadOptions,
      fileMimeType: type.value,
      requestOptions: {
        headers: new HttpHeaders({ Accept: type.value }),
        withCredentials: true,
      }
    };
  }

  public onClose() {
    this.dialogRef.close();
  }
}