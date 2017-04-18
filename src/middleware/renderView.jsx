import React from 'react';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { match, RouterContext } from 'react-router';
import { routes } from '../shared/sharedRoutes';
import initRedux from '../shared/init-redux.es6';
import HTML from '../components/html';

function flattenStaticFunction(renderProps, staticFnName, store = {}) {
  let results = renderProps.components.map((component) => {
    if (component) {
      if (component.displayName &&
        component.displayName.toLowerCase().indexOf('connect') > -1
      ) {
        if (component.WrappedComponent[staticFnName]) {
          return component.WrappedComponent[staticFnName](renderProps.params, store);
        }
      } else if (component[staticFnName]) {
        return component[staticFnName](renderProps.params, store);
      }
    }
    return [];
  });

  results = results.reduce((flat, toFlatten) => {
    return flat.concat(toFlatten);
  }, []);

  return results;
}

export default function renderView(req, res, next) {
  const matchOpts = {
    routes: routes(),
    location: req.url
  };
  const handleMatchResult = (error, redirectLocation, renderProps) => {
    if (!error && !redirectLocation && renderProps) {
      const store = initRedux();
      const actions = flattenStaticFunction(renderProps, 'loadData');
      const promises = actions.map((initialAction) => {
        return store.dispatch(initialAction());
      });
      Promise.all(promises).then(() => {
        const serverState = store.getState();
        const stringifiedServerState = JSON.stringify(serverState);

        const seoTags = flattenStaticFunction(
          renderProps,
          'createMetatags',
          serverState
        );

        const title = flattenStaticFunction(
          renderProps,
          'getTitle',
          serverState
        );

        const app = renderToString(
          <Provider store={store}>
            <RouterContext routes={routes} {...renderProps} />
          </Provider>
        );
        const html = renderToString(
          <HTML
            html={app}
            serverState={stringifiedServerState}
            metatags={seoTags}
            title={title}
          />
        );
        return res.send(`<!DOCTYPE html>${html}`);
      }).catch(() => {
        return next();
      });
    } else {
      next();
    }
  };
  match(matchOpts, handleMatchResult);
}
