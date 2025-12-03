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

import { DataModel, IForeignKeyInfo } from '@imx-modules/imx-qbm-dbts';
import { DataSourceToolbarViewConfig } from '../data-source-toolbar/data-source-toolbar-view-config.interface';

export interface FKViewConfig {
  getViewConfig: (dataModel: DataModel) => Promise<DataSourceToolbarViewConfig>;
  getViewUpdates: () => Promise<DataSourceToolbarViewConfig>;
  updateConfig: (config: any) => Promise<void>;
  deleteConfigById: (id: string) => Promise<void>;
}

export interface ForeignKeyPickerData {
  fkRelations: IForeignKeyInfo[];
  selectedTableName?: string;
  idList?: string[];
  isMultiValue?: boolean;
  isRequired?: boolean;
  disabledIds?: string[];
  viewConfigSettings?: FKViewConfig;
}
