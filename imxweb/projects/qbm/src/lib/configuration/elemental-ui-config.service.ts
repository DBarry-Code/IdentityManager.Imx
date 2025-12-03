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
import { TranslateService } from '@ngx-translate/core';

import { EuiSelectFeedbackMessages, EuiTableColumnManagementLabelTranslations } from '@elemental-ui/core';
import { ElementalUiConfig } from './elemental-ui-config.interface';

/**
 * A service that helps configure Element UI and translation texts
 */
@Injectable({
  providedIn: 'root',
})
export class ElementalUiConfigService {
  private readonly config: ElementalUiConfig = {
    downloadOptions: {
      url: '',
      fileMimeType: 'application/pdf',
      requestOptions: {
        withCredentials: true,
      }
    },
  };

  private readonly selectFeedbackMessages: EuiSelectFeedbackMessages;
  private readonly tableManagementLabelTranslations: EuiTableColumnManagementLabelTranslations;

  /**
   * Gets the {@link ElementalUiConfig} with preset values and translated text
   */
  public get Config(): ElementalUiConfig {
    return this.config;
  }

  /**
   * Gets the {@link EuiSelectFeedbackMessages} with preset translated text
   */
  public get SelectFeedbackMessages() {
    return this.selectFeedbackMessages;
  }

  /**
   * Gets the {@link EuiTableColumnManagementLabelTranslations} with preset translated text
   */
  public get TableManagementLabelTranslations() {
    return this.tableManagementLabelTranslations;
  }

  constructor(
    private readonly translate: TranslateService,
  ) {
    // Defaults defined in @link
    this.config.downloadOptions!.loaderConfig = {
      buttonText: this.translate.instant('#LDS#Cancel download'),
      helperText: this.translate.instant('#LDS#File download in progress'),
      spinnerAriaLabel: this.translate.instant('#LDS#Loading...'),
    }

    // Defaults defined in @link
    this.selectFeedbackMessages = {
      clear: this.translate.instant('#LDS#Clear selection'),
      clearAll: this.translate.instant('#LDS#Clear selection'),
      keyboardOptionsListAria: this.translate.instant('#LDS#Use the arrow keys to select items.'),
      noResults: this.translate.instant('#LDS#There is no data matching your search.'),
      ok: this.translate.instant('#LDS#OK'),
      plusOther: this.translate.instant('#LDS#and 1 more'),
      plusOtherPlural: this.translate.instant('#LDS#and {{value}} more'),
      search: this.translate.instant('#LDS#Search'),
      selectAll: this.translate.instant('#LDS#Select all'),
      selected: this.translate.instant('#LDS#{{value}} selected'),
      unsupportedCharacter: this.translate.instant('#LDS#You are using unsupported characters.'),
    };

    // Defaults defined in @link
    this.tableManagementLabelTranslations = {
      actionButtons: {
        activeOnlyToggle: this.translate.instant('#LDS#Active only'),
        allButton: this.translate.instant('#LDS#All'),
        allButtonTooltip: this.translate.instant('#LDS#Select all columns'),
        applyButton: this.translate.instant('#LDS#Apply'),
        cancelButton: this.translate.instant('#LDS#Cancel'),
        noneButton: this.translate.instant('#LDS#None'),
        noneButtonTooltip: this.translate.instant('#LDS#Deselect all columns'),
        resetButton: this.translate.instant('#LDS#Default'),
        resetButtonTooltip: this.translate.instant('#LDS#Resets column selection and order to the default'),
        selectLabel: this.translate.instant('#LDS#Select:'),
        showAllTooltip: this.translate.instant('#LDS#Show all'),
        showSelectedTooltip: this.translate.instant('#LDS#Show selected only'),
      },
      list: {
        dragHandleTooltip: this.translate.instant('#LDS#You can change the order using drag and drop'),
        inputTooltip: this.translate.instant('#LDS#Specify the position of the column by assigning a position number'),
        inputAriaLabel: this.translate.instant('#LDS#Specify the position of the "{columnName}" column by assigning a position number.'), // {columnName} is required by the EUI component, in translating please keep this as is
        noActiveMatchingColumns: this.translate.instant(
          '#LDS#There are no columns matching your search. To get results, try disabling the "Active only" toggle.',
        ),
        noMatchingColumns: this.translate.instant('#LDS#There are no columns matching your search.'),
        requiredColumn: this.translate.instant('#LDS#You cannot remove this column.'),
        searchPlaceholder: this.translate.instant('#LDS#Search column names'),
        sort: {
          boolean: {
            asc: this.translate.instant('#LDS#Active sorting (false-true)'),
            desc: this.translate.instant('#LDS#Active sorting (true-false)'),
          },
          date: {
            asc: this.translate.instant('#LDS#Active sorting (oldest first)'),
            desc: this.translate.instant('#LDS#Active sorting (newest first)'),
          },
          number: {
            asc: this.translate.instant('#LDS#Active sorting (0-9)'),
            desc: this.translate.instant('#LDS#Active sorting (9-0)'),
          },
          text: {
            asc: this.translate.instant('#LDS#Active sorting (A-Z)'),
            desc: this.translate.instant('#LDS#Active sorting (Z-A)'),
          },
        },
      },
      sidesheet: {
        title: this.translate.instant('#LDS#Heading Select Columns'),
        unsavedChanges: {
          body: this.translate.instant(
            '#LDS#You have unsaved changes. Are you sure you want to cancel editing and discard your changes?',
          ),
          cancelButton: this.translate.instant('#LDS#Keep editing'),
          discardButton: this.translate.instant('#LDS#Discard changes'),
          title: this.translate.instant('#LDS#Heading Cancel Editing'),
        },
        openButton: this.translate.instant('#LDS#Heading Show/Hide Columns'),
        openerButtonTooltip: this.translate.instant('#LDS#Manage table columns'),
      },
    }
  }
}
