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

type PortalIdentifier = {
  suburl: string;
  id: string;
};

export const PortalIdentifiers: { [key: string]: PortalIdentifier } = {
  Portal: {
    suburl: 'qer-app-portal',
    id: 'portal',
  },
  OpsWeb: {
    suburl: 'qer-app-operationssupport',
    id: 'opsupport',
  },
  Admin: {
    suburl: 'qbm-app-landingpage',
    id: 'admin',
  },
  PwdReset: {
    suburl: 'qer-app-pwdportal',
    id: 'passwordreset',
  },
  Custom: {
    suburl: '',
    id: 'custom',
  },
  Manager: {
    suburl: 'qer-app-manager',
    id: 'dialog',
  },
} as const;
