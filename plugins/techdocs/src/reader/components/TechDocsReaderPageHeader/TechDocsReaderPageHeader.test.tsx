/*
 * Copyright 2020 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import { act, waitFor } from '@testing-library/react';

import { ThemeProvider } from '@material-ui/core';

import { lightTheme } from '@backstage/theme';
import { CompoundEntityRef } from '@backstage/catalog-model';
import { entityRouteRef } from '@backstage/plugin-catalog-react';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';

import { techdocsApiRef } from '../../../api';
import { rootRouteRef } from '../../../routes';

import {
  TechDocsEntityProvider,
  TechDocsMetadataProvider,
  TechDocsReaderPageProvider,
} from '../TechDocsReaderPage';

import { TechDocsReaderPageHeader } from './TechDocsReaderPageHeader';

const mockEntityMetadata = {
  locationMetadata: {
    type: 'github',
    target: 'https://example.com/',
  },
  apiVersion: 'v1',
  kind: 'test',
  metadata: {
    name: 'test-name',
    namespace: 'test-namespace',
  },
  spec: {
    owner: 'test',
  },
};

const mockTechDocsMetadata = {
  site_name: 'test-site-name',
  site_description: 'test-site-desc',
};

const getEntityMetadata = jest.fn();
const getTechDocsMetadata = jest.fn();

const techdocsApiMock = {
  getEntityMetadata,
  getTechDocsMetadata,
};

const Wrapper = ({
  path = '',
  entityName = {
    kind: mockEntityMetadata.kind,
    name: mockEntityMetadata.metadata.name,
    namespace: mockEntityMetadata.metadata.namespace!!,
  },
  children,
}: {
  path?: string;
  entityName?: CompoundEntityRef;
  children: React.ReactNode;
}) => (
  <ThemeProvider theme={lightTheme}>
    <TestApiProvider apis={[[techdocsApiRef, techdocsApiMock]]}>
      <TechDocsMetadataProvider entityName={entityName}>
        <TechDocsEntityProvider entityName={entityName}>
          <TechDocsReaderPageProvider path={path} entityName={entityName}>
            {children}
          </TechDocsReaderPageProvider>
        </TechDocsEntityProvider>
      </TechDocsMetadataProvider>
    </TestApiProvider>
  </ThemeProvider>
);

describe('<TechDocsReaderPageHeader />', () => {
  it('should render a techdocs page header', async () => {
    getEntityMetadata.mockResolvedValue(mockEntityMetadata);
    getTechDocsMetadata.mockResolvedValue(mockTechDocsMetadata);

    await act(async () => {
      const rendered = await renderInTestApp(
        <Wrapper>
          <TechDocsReaderPageHeader />
        </Wrapper>,
        {
          mountedRoutes: {
            '/catalog/:namespace/:kind/:name/*': entityRouteRef,
            '/docs': rootRouteRef,
          },
        },
      );

      expect(rendered.container.innerHTML).toContain('header');

      await waitFor(() => {
        expect(rendered.getAllByText('test-site-name')).toHaveLength(2);
      });

      expect(rendered.getByText('test-site-desc')).toBeDefined();
    });
  });

  it('should render a techdocs page header even if metadata is missing', async () => {
    await act(async () => {
      const rendered = await renderInTestApp(
        <Wrapper>
          <TechDocsReaderPageHeader />
        </Wrapper>,
        {
          mountedRoutes: {
            '/catalog/:namespace/:kind/:name/*': entityRouteRef,
            '/docs': rootRouteRef,
          },
        },
      );

      expect(rendered.container.innerHTML).toContain('header');
    });
  });

  it('should render a link back to the component page', async () => {
    getTechDocsMetadata.mockResolvedValue(mockTechDocsMetadata);

    await act(async () => {
      const rendered = await renderInTestApp(
        <Wrapper>
          <TechDocsReaderPageHeader />
        </Wrapper>,
        {
          mountedRoutes: {
            '/catalog/:namespace/:kind/:name/*': entityRouteRef,
            '/docs': rootRouteRef,
          },
        },
      );

      await waitFor(() => {
        expect(
          rendered.getByRole('link', { name: 'test:test-namespace/test-name' }),
        ).toHaveAttribute('href', '/catalog/test-namespace/test/test-name');
      });
    });
  });
});
