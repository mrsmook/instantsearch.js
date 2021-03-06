/* eslint @typescript-eslint/camelcase: ["error", { allow: ["free_shipping"] }], complexity: off */

import { history as historyRouter } from 'instantsearch.js/es/lib/routers';
import {
  getFallbackHitsPerPageRoutingValue,
  getFallbackSortByRoutingValue,
  getFallbackRatingsRoutingValue,
} from './widgets';

interface RouteState {
  query?: string;
  page?: string;
  brands?: string[];
  category?: string;
  rating?: string;
  price?: string;
  free_shipping?: string;
  sortBy?: string;
  hitsPerPage?: string;
}

interface UiState {
  query?: string;
  page?: string;
  hierarchicalMenu?: {
    'hierarchicalCategories.lvl0'?: string[];
  };
  ratingMenu?: {
    rating?: number;
  };
  range?: {
    price?: string;
  };
  toggle?: {
    free_shipping?: boolean;
  };
  refinementList?: {
    brand?: string[];
  };
  sortBy?: string;
  hitsPerPage?: number;
}

const routeStateDefaultValues = {
  query: '',
  page: '1',
  brands: undefined,
  category: '',
  rating: '',
  price: '',
  free_shipping: 'false',
  sortBy: 'instant_search',
  hitsPerPage: '20',
};

const encodedCategories = {
  Cameras: 'Cameras & Camcorders',
  Cars: 'Car Electronics & GPS',
  Phones: 'Cell Phones',
  TV: 'TV & Home Theater',
};

const decodedCategories = Object.keys(encodedCategories).reduce((acc, key) => {
  const newKey = encodedCategories[key];
  const newValue = key;

  return {
    ...acc,
    [newKey]: newValue,
  };
}, {});

// Returns a slug from the category name.
// Spaces are replaced by "+" to make
// the URL easier to read and other
// characters are encoded.
function getCategorySlug(name: string): string {
  const encodedName = decodedCategories[name] || name;

  return encodedName
    .split(' ')
    .map(encodeURIComponent)
    .join('+');
}

// Returns a name from the category slug.
// The "+" are replaced by spaces and other
// characters are decoded.
function getCategoryName(slug: string): string {
  const decodedSlug = encodedCategories[slug] || slug;

  return decodedSlug
    .split('+')
    .map(decodeURIComponent)
    .join(' ');
}

const originalWindowTitle = document.title;

const router = historyRouter({
  windowTitle({ category, query }) {
    const queryTitle = query ? `Results for "${query}"` : '';

    return [queryTitle, category, originalWindowTitle]
      .filter(Boolean)
      .join(' | ');
  },

  createURL({ qsModule, routeState, location }): string {
    const { protocol, hostname, port = '', pathname, hash } = location;
    const portWithPrefix = port === '' ? '' : `:${port}`;
    const urlParts = location.href.match(/^(.*?)\/search/);
    const baseUrl =
      (urlParts && urlParts[0]) ||
      `${protocol}//${hostname}${portWithPrefix}${pathname}search`;

    const categoryPath = routeState.category
      ? `${getCategorySlug(routeState.category)}/`
      : '';
    const queryParameters: Partial<RouteState> = {};

    if (
      routeState.query &&
      routeState.query !== routeStateDefaultValues.query
    ) {
      queryParameters.query = encodeURIComponent(routeState.query);
    }
    if (routeState.page && routeState.page !== routeStateDefaultValues.page) {
      queryParameters.page = routeState.page;
    }
    if (
      routeState.brands &&
      routeState.brands !== routeStateDefaultValues.brands
    ) {
      queryParameters.brands = routeState.brands.map(encodeURIComponent);
    }
    if (
      routeState.rating &&
      routeState.rating !== routeStateDefaultValues.rating
    ) {
      queryParameters.rating = routeState.rating;
    }
    if (
      routeState.price &&
      routeState.price !== routeStateDefaultValues.price
    ) {
      queryParameters.price = routeState.price;
    }
    if (
      routeState.free_shipping &&
      routeState.free_shipping !== routeStateDefaultValues.free_shipping
    ) {
      queryParameters.free_shipping = routeState.free_shipping;
    }
    if (
      routeState.sortBy &&
      routeState.sortBy !== routeStateDefaultValues.sortBy
    ) {
      queryParameters.sortBy = routeState.sortBy;
    }
    if (
      routeState.hitsPerPage &&
      routeState.hitsPerPage !== routeStateDefaultValues.hitsPerPage
    ) {
      queryParameters.hitsPerPage = routeState.hitsPerPage;
    }

    const queryString = qsModule.stringify(queryParameters, {
      addQueryPrefix: true,
      arrayFormat: 'repeat',
    });

    return `${baseUrl}/${categoryPath}${queryString}${hash}`;
  },

  parseURL({ qsModule, location }): RouteState {
    const pathnameMatches = location.pathname.match(/search\/(.*?)\/?$/);
    const category = getCategoryName(
      (pathnameMatches && pathnameMatches[1]) || ''
    );
    const queryParameters = qsModule.parse(location.search.slice(1));
    const {
      query = '',
      page = 1,
      brands = [],
      price,
      free_shipping,
    } = queryParameters;
    // `qs` does not return an array when there's a single value.
    const allBrands = Array.isArray(brands) ? brands : [brands].filter(Boolean);
    const hitsPerPage = getFallbackHitsPerPageRoutingValue(
      queryParameters.hitsPerPage
    );
    const sortBy = getFallbackSortByRoutingValue(queryParameters.sortBy);
    const rating = getFallbackRatingsRoutingValue(queryParameters.rating);

    return {
      query: decodeURIComponent(query),
      page,
      brands: allBrands.map(decodeURIComponent),
      category,
      rating,
      price,
      free_shipping,
      sortBy,
      hitsPerPage,
    };
  },
});

const stateMapping = {
  stateToRoute(uiState: UiState): RouteState {
    return {
      query: uiState.query,
      page: uiState.page,
      brands: uiState.refinementList && uiState.refinementList.brand,
      category:
        uiState.hierarchicalMenu &&
        uiState.hierarchicalMenu['hierarchicalCategories.lvl0'] &&
        uiState.hierarchicalMenu['hierarchicalCategories.lvl0'].join('/'),
      rating: uiState.ratingMenu && String(uiState.ratingMenu.rating),
      price: uiState.range && uiState.range.price,
      free_shipping:
        (uiState.toggle && String(uiState.toggle.free_shipping)) || undefined,
      sortBy: uiState.sortBy,
      hitsPerPage:
        (uiState.hitsPerPage && String(uiState.hitsPerPage)) || undefined,
    };
  },

  routeToState(routeState: RouteState): UiState {
    return {
      query: routeState.query,
      page: routeState.page,
      hierarchicalMenu: {
        'hierarchicalCategories.lvl0':
          (routeState.category && routeState.category.split('/')) || undefined,
      },
      refinementList: {
        brand: routeState.brands,
      },
      ratingMenu: {
        rating: Number(routeState.rating),
      },
      range: {
        price: routeState.price,
      },
      toggle: {
        free_shipping: Boolean(routeState.free_shipping),
      },
      sortBy: routeState.sortBy,
      hitsPerPage: Number(routeState.hitsPerPage),
    };
  },
};

const searchRouting = {
  router,
  stateMapping,
};

export default searchRouting;
