import React, { render, unmountComponentAtNode } from 'preact-compat';
import cx from 'classnames';
import InfiniteHits from '../../components/InfiniteHits/InfiniteHits';
import defaultTemplates from './defaultTemplates';
import connectInfiniteHits, {
  InfiniteHitsRenderer,
} from '../../connectors/infinite-hits/connectInfiniteHits';
import {
  prepareTemplateProps,
  getContainerNode,
  warning,
  createDocumentationLink,
  createDocumentationMessageGenerator,
} from '../../lib/utils';
import { component } from '../../lib/suit';
import { withInsights, withInsightsListener } from '../../lib/insights';
import {
  WidgetFactory,
  Template,
  Hit,
  InsightsClientWrapper,
  SearchResults,
} from '../../types';

const withUsage = createDocumentationMessageGenerator({
  name: 'infinite-hits',
});
const suit = component('InfiniteHits');
const InfiniteHitsWithInsightsListener = withInsightsListener(InfiniteHits);

export type InfiniteHitsCSSClasses = {
  /**
   * The root element of the widget.
   */
  root: string | string[];
  /**
   * The root container without results.
   */
  emptyRoot: string | string[];
  /**
   * The list of results.
   */
  list: string | string[];
  /**
   * The list item.
   */
  item: string | string[];
  /**
   * The “Show previous” button.
   */
  loadPrevious: string | string[];
  /**
   * The disabled “Show previous” button.
   */
  disabledLoadPrevious: string | string[];
  /**
   * The “Show more” button.
   */
  loadMore: string | string[];
  /**
   * The disabled “Show more” button.
   */
  disabledLoadMore: string | string[];
};

export type InfiniteHitsTemplates = {
  /**
   * The template to use when there are no results.
   */
  empty: Template<{ results: SearchResults }>;
  /**
   * The template to use for the “Show previous” label.
   */
  showPreviousText: Template;
  /**
   * The template to use for the “Show more” label.
   */
  showMoreText: Template;
  /**
   * The template to use for each result.
   */
  item: Template<Hit>;
};

export type InfiniteHitsRendererWidgetParams = {
  /**
   * Escapes HTML entities from hits string values.
   *
   * @default `true`
   */
  escapeHTML: boolean;
  /**
   * Enable the button to load previous results.
   *
   * @default `false`
   */
  showPrevious: boolean;
  /**
   * Receives the items, and is called before displaying them.
   * Useful for mapping over the items to transform, and remove or reorder them.
   */
  transformItems: (items: any[]) => any[];
};

interface InfiniteHitsWidgetParams extends InfiniteHitsRendererWidgetParams {
  /**
   * The CSS Selector or `HTMLElement` to insert the widget into.
   */
  container: string | HTMLElement;
  /**
   * The CSS classes to override.
   */
  cssClasses?: Partial<InfiniteHitsCSSClasses>;
  /**
   * The templates to use for the widget.
   */
  templates?: Partial<InfiniteHitsTemplates>;
}

type InfiniteHits = WidgetFactory<InfiniteHitsWidgetParams>;

const renderer = ({
  cssClasses,
  containerNode,
  renderState,
  templates,
  showPrevious: hasShowPrevious,
}): InfiniteHitsRenderer<InfiniteHitsRendererWidgetParams> => (
  {
    hits,
    results,
    showMore,
    showPrevious,
    isFirstPage,
    isLastPage,
    instantSearchInstance,
    insights,
  },
  isFirstRendering
) => {
  if (isFirstRendering) {
    renderState.templateProps = prepareTemplateProps({
      defaultTemplates,
      templatesConfig: instantSearchInstance.templatesConfig,
      templates,
    });
    return;
  }

  render(
    <InfiniteHitsWithInsightsListener
      cssClasses={cssClasses}
      hits={hits}
      results={results}
      hasShowPrevious={hasShowPrevious}
      showPrevious={showPrevious}
      showMore={showMore}
      templateProps={renderState.templateProps}
      isFirstPage={isFirstPage}
      isLastPage={isLastPage}
      insights={insights as InsightsClientWrapper}
    />,
    containerNode
  );
};

const infiniteHits: InfiniteHits = (
  {
    container,
    escapeHTML,
    transformItems,
    templates = defaultTemplates,
    cssClasses: userCssClasses = {},
    showPrevious,
  } = {} as InfiniteHitsWidgetParams
) => {
  if (!container) {
    throw new Error(withUsage('The `container` option is required.'));
  }

  warning(
    // @ts-ignore: We have this specific check because unlike `hits`, `infiniteHits` does not support
    // the `allItems` template. This can be misleading as they are very similar.
    typeof templates.allItems === 'undefined',
    `The template \`allItems\` does not exist since InstantSearch.js 3.

 You may want to migrate using \`connectInfiniteHits\`: ${createDocumentationLink(
   { name: 'infinite-hits', connector: true }
 )}.`
  );

  const containerNode = getContainerNode(container);
  const cssClasses = {
    root: cx(suit(), userCssClasses.root),
    emptyRoot: cx(suit({ modifierName: 'empty' }), userCssClasses.emptyRoot),
    item: cx(suit({ descendantName: 'item' }), userCssClasses.item),
    list: cx(suit({ descendantName: 'list' }), userCssClasses.list),
    loadPrevious: cx(
      suit({ descendantName: 'loadPrevious' }),
      userCssClasses.loadPrevious
    ),
    disabledLoadPrevious: cx(
      suit({ descendantName: 'loadPrevious', modifierName: 'disabled' }),
      userCssClasses.disabledLoadPrevious
    ),
    loadMore: cx(suit({ descendantName: 'loadMore' }), userCssClasses.loadMore),
    disabledLoadMore: cx(
      suit({ descendantName: 'loadMore', modifierName: 'disabled' }),
      userCssClasses.disabledLoadMore
    ),
  };

  const specializedRenderer = renderer({
    containerNode,
    cssClasses,
    templates,
    showPrevious,
    renderState: {},
  });

  const makeInfiniteHits = withInsights(connectInfiniteHits)(
    specializedRenderer,
    () => unmountComponentAtNode(containerNode)
  );

  return makeInfiniteHits({ escapeHTML, transformItems, showPrevious });
};

export default infiniteHits;
