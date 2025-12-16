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

import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { EUI_SIDESHEET_DATA, EuiSidesheetRef, EuiSidesheetService } from '@elemental-ui/core';
import { FilterProperty, LogOp, SqlExpression, SqlWizardExpression, isExpressionInvalid } from '@imx-modules/imx-qbm-dbts';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { Subscription } from 'rxjs/internal/Subscription';
import { BusyService } from '../../base/busy.service';
import { ConfirmationService } from '../../confirmation/confirmation.service';
import { MessageDialogResult } from '../../message-dialog/message-dialog-result.enum';
import { MessageParameter } from '../../message-dialog/message-parameter.interface';
import { SqlWizardApiService } from '../../sqlwizard/sqlwizard-api.service';
import { SqlWizardComponent } from '../../sqlwizard/sqlwizard.component';
import { FilterTreeSelectionParameter } from './filter-tree-sidesheet/filter-tree-sidesheet.model';
import { FilterFormState, FilterTypeIdentifier, FilterWizardSidesheetData } from './filter-wizard.interfaces';
import { FilterWizardService } from './filter-wizard.service';
@Component({
  selector: 'imx-filter-wizard',
  templateUrl: './filter-wizard.component.html',
  styleUrls: ['./filter-wizard.component.scss'],
  standalone: false,
})
export class FilterWizardComponent implements OnInit, OnDestroy {
  public sqlExpression: SqlWizardExpression;
  public lastGoodExpression: SqlExpression | undefined;
  public expressionDirty = false;
  public expressionInvalid = true;
  public treeFilterUpdated = false;
  public selectedTabIndex = 0;
  public nPreselectedFilters: number;
  public nTreeFilters: number;
  public nCustomFilters: number;
  public formState: FilterFormState = { canClearFilters: false, dirty: false, filterIdentifier: FilterTypeIdentifier.Predefined };
  public readonly FilterTypeIdentifier: FilterTypeIdentifier;
  public readonly FTIPredefined = FilterTypeIdentifier.Predefined;
  public readonly FTICustom = FilterTypeIdentifier.Custom;
  public readonly FTITargetSystem = FilterTypeIdentifier.TargetSystem;
  @ViewChild('sqlWizard', { static: false }) public sqlWizardComponent: SqlWizardComponent;

  private busyService = new BusyService();

  private readonly subscriptions: Subscription[] = [];
  private confirmLeaveTitle = '';
  private confirmLeaveMessage = '';
  private hasProperties: boolean = false;
  public initialized = false;
  public isLoading = false;
  public hasTreeFilter = false;
  private treeFilterArgs: FilterTreeSelectionParameter | undefined;

  private readonly emptyExpression = {
    Expression: {
      Expressions: [
        {
          Expressions: [],
          LogOperator: LogOp.AND,
          Negate: false,
        },
      ],
      LogOperator: LogOp.AND,
      Negate: false,
    },
  };

  constructor(
    private readonly sidesheetService: EuiSidesheetService,
    private readonly sidesheetRef: EuiSidesheetRef,
    private readonly confirm: ConfirmationService,
    private readonly filterService: FilterWizardService,
    public readonly sqlWizardSvc: SqlWizardApiService,
    readonly translation: TranslateService,
    @Inject(EUI_SIDESHEET_DATA) public data?: FilterWizardSidesheetData,
  ) {
    translation.get('#LDS#Heading Cancel Filtering').subscribe((value: string) => (this.confirmLeaveTitle = value));
    translation
      .get('#LDS#The specified filter will not be applied. Are you sure you want to cancel filtering?')
      .subscribe((value: string) => (this.confirmLeaveMessage = value));

    data?.filterExpression ? (this.sqlExpression = data.filterExpression) : (this.sqlExpression = _.cloneDeep(this.emptyExpression));

    this.filterService.filterTabChanged(FilterTypeIdentifier.Predefined);

    this.lastGoodExpression = _.cloneDeep(this.sqlExpression?.Expression);
    this.sidesheetRef.closeClicked().subscribe(() => this.close());
    this.expressionInvalid = (data?.filterExpression && isExpressionInvalid(this.sqlExpression)) == true;

    this.treeFilterArgs = data?.filterTreeParameter?.preSelection;

    this.subscriptions.push(
      this.filterService.filterFormStateEvent.subscribe((formState: FilterFormState) => {
        setTimeout(() => (this.formState = formState));
      }),
    );

    this.subscriptions.push(this.busyService.busyStateChanged.subscribe((state) => (this.isLoading = state)));
  }

  public async ngOnInit(): Promise<void> {
    const busy = this.busyService.beginBusy();
    let columns: FilterProperty[] = [];
    try {
      if (this.data?.settings?.entitySchema?.TypeName) {
        columns = await this.sqlWizardSvc.getFilterProperties(this.data?.settings?.entitySchema?.TypeName ?? '');
      }
      this.hasTreeFilter =
        this.data?.filterTreeParameter?.filterTreeParameter != null &&
        !!(await this.data.filterTreeParameter.filterTreeParameter.filterMethode(''))?.Elements?.length;
      this.initialized = true;
      this.hasProperties = columns?.length > 0 || this.hasTreeFilter;
      if (this.sqlExpression.Expression?.Expressions)
        this.nCustomFilters = this.sqlExpression.Expression.Expressions.filter((e) => e?.PropertyId).length;
      this.calculateFilterTreeCount();
    } finally {
      busy.endBusy();
    }
  }

  public get hasPredefinedFilters(): boolean {
    return !!this.data?.settings?.filters?.length;
  }

  public get canUseCustomFilters(): boolean {
    return !this.data?.isDataSourceLocal && this.hasProperties && this.showSqlWizard;
  }

  /**
   * Counts if we have at least 2 tabs to show
   */
  public get useTabs(): boolean {
    return [this.hasPredefinedFilters, this.canUseCustomFilters, this.hasTreeFilter].reduce((a, b) => a + (b ? 1 : 0), 0) > 1;
  }

  public ngOnDestroy(): void {
    if (isExpressionInvalid(this.sqlExpression) && this.sqlExpression.Expression) {
      this.sqlExpression.Expression.Expressions = [];
    }

    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  public checkChanges(): void {
    if (this.sqlExpression.Expression?.Expressions)
      this.nCustomFilters = this.sqlExpression.Expression.Expressions.filter((e) => e?.PropertyId).length;
    this.expressionDirty = !_.isEqual(this.sqlExpression?.Expression, this.lastGoodExpression);
    this.expressionInvalid =
      !_.isEqual(this.sqlExpression?.Expression, this.emptyExpression?.Expression) && isExpressionInvalid(this.sqlExpression);
  }

  // Applies the current filters and closes the sidesheet.
  public onApplyFilters(): void {
    this.filterService.applyFilters();
    this.sidesheetService.close({ expression: this.sqlExpression, treeFilter: this.treeFilterArgs });
  }

  /**
   * Clears all filters, both predefined and custom.
   */
  public onClearFilters(): void {
    const data: MessageParameter = {
      Title: '#LDS#Heading Reset All Filters',
      Message: '#LDS#Are you sure you want to reset all default and custom filters?',

      ShowCancel: true,
      customButtons: [
        {
          title: '#LDS#Reset all filters',
          action: MessageDialogResult.YesResult,
          type: 'warn',
        },
      ],
    };
    this.confirm.confirmGeneral(data).then((result) => {
      if (result) {
        this.lastGoodExpression = undefined;
        if (this.sqlExpression.Expression) {
          this.sqlExpression.Expression.Expressions = [];
        }
        this.filterService.clearFilters();
        this.sidesheetService.close({ expression: this.sqlExpression, treeFilter: undefined });
      }
    });
  }

  // Handles the event when the selected tab changes.
  public onSelectedTabChange(event: MatTabChangeEvent): void {
    this.filterService.filterTabChanged(event.tab.content?.templateRef.elementRef.nativeElement.parentElement.id as FilterTypeIdentifier);
  }

  // Handles the event when the filter tree selection changes.
  public onFilterTreeSelectionChanged(event: FilterTreeSelectionParameter) {
    this.treeFilterUpdated = true;
    this.treeFilterArgs = event;
    this.calculateFilterTreeCount();
  }

  /**
   * Clears only the custom SQL expressions.
   */
  public onClearSqlExpression(): void {
    const data: MessageParameter = {
      Title: '#LDS#Heading Reset Custom Filter',
      Message: '#LDS#Are you sure you want to reset the custom filter?',
      ShowCancel: true,
      customButtons: [
        {
          title: '#LDS#Reset custom filter',
          action: MessageDialogResult.YesResult,
          type: 'warn',
        },
      ],
    };
    this.confirm.confirmGeneral(data).then((result) => {
      if (result) {
        this.sqlWizardComponent.removeAllExpressions();
      }
    });
  }

  /**
   * Clears only the predefined filters.
   */
  public onClearPredefinedFilters(): void {
    const data: MessageParameter = {
      Title: '#LDS#Heading Reset Default Filters',
      Message: '#LDS#Are you sure you want to reset all default filters?',

      ShowCancel: true,
      customButtons: [
        {
          title: '#LDS#Reset default filters',
          action: MessageDialogResult.YesResult,
          type: 'warn',
        },
      ],
    };
    this.confirm.confirmGeneral(data).then((result) => {
      if (result) {
        this.filterService.clearFilters(false);
        this.filterService.formStatusChanged({ ...this.formState, dirty: true });
      }
    });
  }

  /**
   * Currently we only support one filter from the tree, so return a 1 or 0
   */
  private calculateFilterTreeCount(): void {
    this.nTreeFilters = this.treeFilterArgs?.filter ? 1 : 0;
  }

  // Check if we can apply filters
  public canApplyCustomFilters(): boolean {
    return (this.expressionDirty || this.formState?.dirty || this.treeFilterUpdated) && !this.expressionInvalid;
  }

  // Check if we can remove any filters
  public canRemoveCustomFilter(): boolean {
    return this.canRemoveSqlExpressions() || this.canRemovePredefinedFilters();
  }

  // Check if we can remove any custom SQL expressions
  public canRemoveSqlExpressions(): boolean {
    return this.nCustomFilters > 0 || this.expressionDirty;
  }

  // Check if we can remove any predefined filters
  public canRemovePredefinedFilters(): boolean {
    return this.nPreselectedFilters > 0 || this.formState.dirty;
  }

  // Check if there is a target system filter applied
  public containsTargetSystemFilter(): boolean {
    let filters = this.data?.settings.filters;
    return (filters && filters.find((item) => item.Name === 'namespace') != null) ?? false;
  }

  // Check if SQL wizard is available
  public get showSqlWizard(): boolean {
    return this.sqlWizardSvc.implemented ?? false;
  }

  // Close the sidesheet with confirmation if there are unsaved changes
  public async close(): Promise<void> {
    if (!this.expressionDirty && !this.formState?.dirty) {
      this.sidesheetRef.close();
      return;
    }

    if (await this.confirm.confirmLeaveWithUnsavedChanges(this.confirmLeaveTitle, this.confirmLeaveMessage)) {
      this.sqlExpression.Expression = this.lastGoodExpression;
      this.sidesheetRef.close();
    }
  }
}
