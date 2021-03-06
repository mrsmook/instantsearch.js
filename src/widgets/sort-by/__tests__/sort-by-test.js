import { render } from 'preact-compat';
import algoliasearchHelper from 'algoliasearch-helper';
import sortBy from '../sort-by';
import instantSearch from '../../../lib/main';

jest.mock('preact-compat', () => {
  const module = require.requireActual('preact-compat');

  module.render = jest.fn();

  return module;
});

describe('Usage', () => {
  it('throws without container', () => {
    expect(() => {
      sortBy({ container: undefined });
    }).toThrowErrorMatchingInlineSnapshot(`
"The \`container\` option is required.

See documentation: https://www.algolia.com/doc/api-reference/widgets/sort-by/js/"
`);
  });
});

describe('sortBy()', () => {
  let container;
  let items;
  let cssClasses;
  let widget;
  let helper;
  let results;

  beforeEach(() => {
    render.mockClear();

    const instantSearchInstance = instantSearch({
      indexName: '',
      searchClient: {
        search() {},
      },
    });

    container = document.createElement('div');
    items = [
      { value: 'index-a', label: 'Index A' },
      { value: 'index-b', label: 'Index B' },
    ];
    cssClasses = {
      root: ['custom-root', 'cx'],
      select: 'custom-select',
      item: 'custom-item',
    };
    widget = sortBy({ container, items, cssClasses });

    helper = algoliasearchHelper({}, 'index-a');
    helper.setIndex = jest.fn().mockReturnThis();
    helper.search = jest.fn();

    results = {
      hits: [],
      nbHits: 0,
    };
    widget.init({ helper, instantSearchInstance });
  });

  it("doesn't configure anything", () => {
    expect(widget.getConfiguration).toEqual(undefined);
  });

  it('calls twice render(<Selector props />, container)', () => {
    widget.render({ helper, results });
    widget.render({ helper, results });

    expect(render).toHaveBeenCalledTimes(2);
    expect(render.mock.calls[0][0]).toMatchSnapshot();
    expect(render.mock.calls[0][1]).toEqual(container);
    expect(render.mock.calls[1][0]).toMatchSnapshot();
    expect(render.mock.calls[1][1]).toEqual(container);
  });

  it('renders transformed items', () => {
    widget = sortBy({
      container,
      items,
      transformItems: allItems =>
        allItems.map(item => ({ ...item, transformed: true })),
    });

    widget.init({ helper, instantSearchInstance: {} });
    widget.render({ helper, results });

    expect(render.mock.calls[0][0]).toMatchSnapshot();
  });

  it('sets the underlying index', () => {
    widget.setIndex('index-b');

    expect(helper.setIndex).toHaveBeenCalledTimes(1);
    expect(helper.search).toHaveBeenCalledTimes(1);
  });
});
