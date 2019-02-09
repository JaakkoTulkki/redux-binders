import {createStore, combineReducers, applyMiddleware, AnyAction} from 'redux';
import thunk from 'redux-thunk';

import {
  AnyActionFunction,
  bindActionToScope,
  scopedCombineReducers,
} from './index';

const scope = 'myscope';
const otherScope = 'otherScope';
const ACTION_TYPE = 'CHANGE';

function actionCreator(payload) {
  return {
    type: ACTION_TYPE,
    payload,
  }
}

function thunkActionCreator(payload, prop) {
  return function thunkAction(anotherDispatch, getState, extra) {
    const state = getState()[prop].nested.value;
    const contrivedPayload = state + payload + extra;
    anotherDispatch({type: ACTION_TYPE, payload: contrivedPayload});
  }
}

function reducer(state = '', action: AnyAction) {
  if (action.type === ACTION_TYPE) {
    return action.payload;
  }
  return state;
}

type ExtraArg = string;

interface StateShape {
  scoped: any;
  nonScoped: any;
  differentScoped: any;
}

const rootReducer = combineReducers({
  scoped: scopedCombineReducers({
    nested: combineReducers({
      value: reducer,
    })
  }, scope),
  nonScoped: combineReducers({
    nested: combineReducers({
      value: reducer,
    }),
  }),
  differentScoped: scopedCombineReducers({
    nested: combineReducers({
      value: reducer,
    })
  }, otherScope),
});

describe('scopedCombineReducers', () => {
  let store: any;
  beforeEach(() => {
    store = createStore(rootReducer, undefined, applyMiddleware(thunk.withExtraArgument('myExtra')))
  });

  it('store should have correct shape', () => {
    expect(Object.keys(store.getState())).toEqual(['scoped', 'nonScoped', 'differentScoped'])
  });

  it('should work with scoped plain actions', () => {
    const boundAction = bindActionToScope({type: ACTION_TYPE, payload: 'first'}, scope);
    store.dispatch(boundAction);
    expect(store.getState()['scoped'].nested.value).toEqual('first');
    expect(store.getState()['nonScoped'].nested.value).toEqual('first');
    expect(store.getState()['differentScoped'].nested.value).toEqual('');

    const boundActionToScope2 = bindActionToScope({type: ACTION_TYPE, payload: 'other'}, otherScope);
    store.dispatch(boundActionToScope2);
    expect(store.getState()['scoped'].nested.value).toEqual('first');
    expect(store.getState()['nonScoped'].nested.value).toEqual('other');
    expect(store.getState()['differentScoped'].nested.value).toEqual('other');
  });

  it('should work with action creators returning objects', () => {
    const boundAction = bindActionToScope(actionCreator, scope) as AnyActionFunction<undefined, StateShape, ExtraArg>;
    store.dispatch(boundAction('one'));
    expect(store.getState()['scoped'].nested.value).toEqual('one');
    expect(store.getState()['nonScoped'].nested.value).toEqual('one');
    expect(store.getState()['differentScoped'].nested.value).toEqual('');

    const boundActionToScope2 = bindActionToScope(actionCreator, otherScope) as AnyActionFunction<undefined, StateShape, ExtraArg>;
    store.dispatch(boundActionToScope2('two'));
    expect(store.getState()['scoped'].nested.value).toEqual('one');
    expect(store.getState()['nonScoped'].nested.value).toEqual('two');
    expect(store.getState()['differentScoped'].nested.value).toEqual('two');
  });

  it('should work with action creators returning thunks', () => {
    const boundSimpleAction = bindActionToScope({type: ACTION_TYPE, payload: 'ok-'}, scope);
    store.dispatch(boundSimpleAction);

    const boundAction = bindActionToScope(thunkActionCreator, scope) as AnyActionFunction<undefined, StateShape, ExtraArg>;
    store.dispatch(boundAction('one', 'scoped'));

    expect(store.getState()['scoped'].nested.value).toEqual('ok-onemyExtra');
    expect(store.getState()['nonScoped'].nested.value).toEqual('ok-onemyExtra');
    expect(store.getState()['differentScoped'].nested.value).toEqual('');
  });
});