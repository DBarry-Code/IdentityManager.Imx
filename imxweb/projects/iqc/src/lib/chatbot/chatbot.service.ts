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

import { Injectable, OnDestroy } from '@angular/core';
import { ChatApiExtendedData, V2ApiClientMethodFactory } from '@imx-modules/imx-api-iqc';
import {
  ExtendedEntityCollectionData,
  MethodDefinition
} from '@imx-modules/imx-qbm-dbts';
import { DataSourceToolbarExportMethod } from 'qbm';
import { IqcApiService } from '../iqc-api-client.service';

@Injectable()
export class ChatbotService implements OnDestroy {
  private abortController: AbortController;
  constructor(private apiClient: IqcApiService) {
    this.createAbortController();
  }

  ngOnDestroy() {
    this.abortController.abort();
  }

  private createAbortController() {
    this.abortController = new AbortController();
  }

  /**
   * Send a prompt query with an optional chatId to a backend ai model to process as a sql query. If no chatId is provided, one is generated and will act as the id for this entire session
   * @param prompt 
   * @param chatId
   * @returns 
   */
  public async sendQuery(prompt: string, chatId?: string): Promise<ExtendedEntityCollectionData<ChatApiExtendedData>> {
    return await this.apiClient.client.portal_aichat_query_get(
      {
        prompt,
        chatId
      },
      {
        signal: this.abortController.signal,
      },
    );
  }

  /**
   * Creates an export method to be used with portal_aichat_query_get
   * @param chatId 
   * @param prompt 
   * @returns 
   */
  public getExportMethod(chatId: string | undefined, prompt: string): DataSourceToolbarExportMethod {
    const factory = new V2ApiClientMethodFactory();
    return {
      getMethod: () => {
        return new MethodDefinition(factory.portal_aichat_query_get({chatId, prompt}));
      },
    };
  }
}
