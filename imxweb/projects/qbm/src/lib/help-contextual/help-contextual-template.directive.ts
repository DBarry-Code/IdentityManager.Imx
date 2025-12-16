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

import { CdkPortal } from '@angular/cdk/portal';
import { Directive, InjectionToken } from '@angular/core';

/**
 * Injection token that can be used to reference instances of `HelpContextualTemplate`. It serves as
 * alternative token to the actual `HelpContextualTemplate` class which could cause unnecessary
 * retention of the class and its directive metadata.
 */
export const HELP_CONTEXTUAL_TEMPLATE = new InjectionToken<HelpContextualTemplate>('HelpContextualTemplate');

/** Used to flag help templates for use with the portal directive */
@Directive({
  selector: '[imx-help-contextual-template], [imxHelpContextualTemplate]',
  providers: [{ provide: HELP_CONTEXTUAL_TEMPLATE, useExisting: HelpContextualTemplate }],
  standalone: false,
})
export class HelpContextualTemplate extends CdkPortal {}
