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

import { animate, state, style, transition, trigger } from '@angular/animations';
import { TextFieldModule } from '@angular/cdk/text-field';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EuiCoreModule } from '@elemental-ui/core';
import { ChatApiExtendedData } from '@imx-modules/imx-api-iqc';
import { ExtendedEntityCollectionData, IClientProperty } from '@imx-modules/imx-qbm-dbts';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BusyIndicatorModule, ConfirmationService, DataViewModule, DataViewSource, HELP_CONTEXTUAL, HelpContextualService } from 'qbm';
import { ChatbotService } from '../chatbot.service';
import { ChatbotDynamicTableComponent } from '../dynamic-table/dynamic-table.component';
import { ChatbotDialogData, ChatbotExportDialogComponent } from '../export-dialog/export-dialog.component';

interface ChatEntry {
  chatId: string | undefined;
  prompt: string;
  sqlQuery: string | undefined;
  properties?: IClientProperty[],
  response: ExtendedEntityCollectionData<ChatApiExtendedData>;
}

@Component({
  standalone: true,
  imports: [
    BusyIndicatorModule,
    CommonModule,
    ChatbotDynamicTableComponent,
    DataViewModule,
    EuiCoreModule,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatInputModule,
    MatTabsModule,
    MatTooltipModule,
    ReactiveFormsModule,
    TextFieldModule,
    TranslateModule,
  ],
  providers: [ChatbotService, DataViewSource],
  templateUrl: './sidesheet.component.html',
  styleUrl: './sidesheet.component.scss',
  animations: [
    trigger('fadeInOut', [
      state('visible', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0 })),
      transition('visible => hidden', [animate('300ms ease-out')]),
      transition('hidden => visible', [animate('300ms ease-in')]),
    ]),
  ],
})
export class ChatbotSidesheetComponent implements OnInit, OnDestroy {
  public controlPromptInput = new FormControl('', {
    validators: [Validators.required, Validators.minLength(5)],
    nonNullable: true,
  });
  public chatSession: string | undefined;
  public isLoading: boolean;
  public chatEntries: ChatEntry[] = [];
  public promptError: string | undefined;

  // fade in and out placeholder text
  private placeholderTexts: string[];
  private placeholderIndex = 0;
  private rotationTime = 10; // Time in seconds to rotate the placeholder text
  private rotationInterval: any;
  public placeholderText: string;
  public placeholderFadeState: 'visible' | 'hidden' = 'visible';

  constructor(
    private chatbotService: ChatbotService,
    private confirmationService: ConfirmationService,
    private dialogService: MatDialog,
    private helpContextService: HelpContextualService,
    private translateService: TranslateService,
  ) {
    this.helpContextService.setHelpContextId(HELP_CONTEXTUAL.IQCChatbot);
  }

  /**
   * A validator function that checks will error for server returned chat errors.
   * @returns A validator function that checks if the prompt response is valid.
   */
  private validatePromptResponse() {
    return (control: AbstractControl) => {
      return this.promptError ? { invalidPrompt: this.promptError } : null;
    };
  }

  ngOnInit() {
    this.controlPromptInput.addValidators(this.validatePromptResponse());
    this.setupPlaceholder();
  }

  ngOnDestroy() {
    this.stopPlaceholderRotation();
  }

  /**
   * Sets up the placeholder texts and starts the rotation.
   */
  private setupPlaceholder() {
    this.placeholderTexts = [
      this.translateService.instant(
        '#LDS#Example: Get all identities born in 1984 with the columns "first name", "last name", "birthdate", and "department uid".',
      ),
      this.translateService.instant('#LDS#Example: Get all new identities from last month.'),
      this.translateService.instant('#LDS#Example: List the roles with the highest number of members.'),
      this.translateService.instant('#LDS#Example: List the top ten identities with the most rule violations.'),
    ];
    this.placeholderText = this.placeholderTexts[this.placeholderIndex];
    this.startPlaceholderRotation();
  }

  /**
   * Starts the rotation of placeholder texts every x seconds.
   */
  private startPlaceholderRotation() {
    if (this.rotationInterval) return;

    this.rotationInterval = setInterval(() => {
      this.placeholderFadeState = 'hidden';
      setTimeout(() => {
        this.placeholderIndex = (this.placeholderIndex + 1) % this.placeholderTexts.length;
        this.placeholderText = this.placeholderTexts[this.placeholderIndex];
        this.placeholderFadeState = 'visible';
      }, 300); // Fade out duration
    }, this.rotationTime * 1000); // Change every x seconds
  }

  /**
   * Stops the rotation of placeholder texts
   */
  private stopPlaceholderRotation() {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = undefined;
    }
  }

  /**
   * Clears the current chat history and starts a new chat.
   */
  public async onNewChat() {
    if (
      await this.confirmationService.confirmDelete(
        this.translateService.instant('#LDS#Heading Clear Existing Chat and Start New Chat'),
        this.translateService.instant('#LDS#Are you sure you want to clear the existing chat and start a new chat?'),
      )
    ) {
      this.chatSession = undefined;
      this.chatEntries = [];
      this.promptError = undefined;
      this.controlPromptInput.reset();
      this.startPlaceholderRotation();
    }
  }

  /**
   * Handles changes to the prompt input
   */
  public onChangePrompt() {
    // We remove the error when the user starts typing again
    this.promptError = undefined;
    this.controlPromptInput.updateValueAndValidity();
    // Start or stop the rotation based on if there is input
    this.controlPromptInput.value.length === 0 ? this.startPlaceholderRotation() : this.stopPlaceholderRotation();
  }

  public onEnterKey(event: Event) {
    // Prevent default form submission
    event.preventDefault();
    event.stopPropagation();
    // Trigger the send query function
    this.onSendQuery();
  }

  /**
   * Opens a simple dialog for allowing for downloading a chatEntry's data
   * @param chatEntry 
   */
  public onExportData(chatEntry: ChatEntry) {
    const exportMethod = this.chatbotService.getExportMethod(chatEntry.chatId, chatEntry.prompt);
    this.dialogService.open(ChatbotExportDialogComponent, {
      data: {
        exportMethod,
        prompt: chatEntry.prompt,
        totalCount: chatEntry.response.TotalCount
      } as ChatbotDialogData
    })
  }

  /**
   * Formats the prompt to allow for new lines but never duplicate spaces, new lines or trailing/leading spaces.
   */
  private formatPrompt() {
    // Validate the input, remove all trailing whie space
    this.controlPromptInput.setValue(
      this.controlPromptInput.value
        .trim()
        // Step 1: Normalize all line breaks to \n for consistency
        .replace(/\r\n?/g, '\n')
        // Step 2: Replace 2+ newlines with a placeholder
        .replace(/\n{2,}/g, '___NEWLINE___')
        // Step 3: Replace all other whitespace (spaces, tabs, single \n) with single space
        .replace(/\s+/g, ' ')
        // Step 4: Restore placeholder as real newline
        .replace(/___NEWLINE___/g, '\n'),
    );
    this.controlPromptInput.updateValueAndValidity();
  }

  /**
   * Handles querying the chatbot service and processing the response.
   */
  public async onSendQuery() {
    this.formatPrompt();
    if (this.controlPromptInput.invalid) {
      this.controlPromptInput.markAsTouched();
      return;
    }
    this.isLoading = true;
    let queryResponse: ExtendedEntityCollectionData<ChatApiExtendedData>;
    try {
      queryResponse = await this.chatbotService.sendQuery(this.controlPromptInput.value, this.chatSession);
    } finally {
      this.isLoading = false;
    }
    this.processQueryResponse(queryResponse);
  }

  /**
   * Handles errors and processes the valid values from the query
   * @param response The response from the chatbot service.
   */
  private processQueryResponse(response: ExtendedEntityCollectionData<ChatApiExtendedData>) {
    // Check for errors
    if (response.ExtendedData?.ErrorMessage) {
      this.promptError = response.ExtendedData.ErrorMessage;
      return;
    }
    if (!this.chatSession) this.chatSession = response.ExtendedData?.ChatId;
    this.chatEntries.push({
      chatId: response.ExtendedData?.ChatId,
      prompt: this.controlPromptInput.value,
      sqlQuery: response.ExtendedData?.Query,
      properties: response.ExtendedData?.Properties,
      response,
    });
    this.controlPromptInput.reset();
    this.startPlaceholderRotation();
  }
}
