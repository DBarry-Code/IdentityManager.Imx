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

import { Injectable } from "@angular/core";
import { EuiSidesheetRef } from "@elemental-ui/core";
import { CollectionLoadParameters, DataModel, EntitySchema, ExtendedTypedEntityCollection, IClientProperty } from "@imx-modules/imx-qbm-dbts";
import { HelpContextualValues } from "../help-contextual/help-contextual.service";

@Injectable()
export abstract class GlobalSearchService<T> {
  /**
   * Required for displaying the columns in the data view
   */
  protected _schema: EntitySchema;

  /**
   * Required for displaying the columns in the data view
   */
  protected _columnsToDisplay: IClientProperty[];

  /**
   * Optional for having some kind of filtering on the data view
   */
  protected _dataModel: DataModel | undefined;

  /**
   * Optional for enabling the help context button for the sidesheet
   */
  protected _helpContextId: HelpContextualValues | undefined;

  // Public read-only accessors
  public get schema() {
    return this._schema;
  }

  public get columnsToDisplay() {
    return this._columnsToDisplay;
  }

  public get dataModel() {
    return this._dataModel;
  }

  public get helpContextId() {
    return this._helpContextId;
  }

  /**
   * Use this method to describe protected objects for the data view in the sidesheet
   */
  abstract setup(): Promise<void>;

  /**
   * Handles the api for searching & filtering
   * @param query 
   */
  abstract search(query: CollectionLoadParameters): Promise<ExtendedTypedEntityCollection<T, unknown>>;

  /**
   * Do something with the selected table entry
   * @param choice 
   */
  abstract handleChoice(choice: T, sidesheetRef: EuiSidesheetRef): Promise<void>;

}