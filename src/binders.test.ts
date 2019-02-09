import {createStore, combineReducers, applyMiddleware, AnyAction} from 'redux';
import thunk from 'redux-thunk';

import {
  AnyActionFunction, BindableAction,
  bindActionToScope,
  bindReducerToScope,
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
  return function thunkAction(dispatch, getState, extra) {
    const state = getState()[prop];
    const contrivedPayload = state + payload + extra;
    dispatch({type: ACTION_TYPE, payload: contrivedPayload});
  }
}

function asynThunkActionCreator(payload) {
  return function thunkAction(dispatch, getState, extra) {
    return new Promise((resolve) => {
      dispatch(actionCreator(payload));
      resolve(payload);
    });
  }
}


function reducer(state = '', action: AnyAction) {
  if (action.type === ACTION_TYPE) {
    return action.payload;
  }
  return state;
}

interface StateShape {
  scoped: any;
  nonScoped: any;
  differentScoped: any;
}

type ExtraArg = string;

const rootReducer = combineReducers({
  scoped: bindReducerToScope(reducer, scope),
  nonScoped: reducer,
  differentScoped: bindReducerToScope(reducer, otherScope),
});

describe('bindActionToScope with', () => {
  let store: any;
  beforeEach(() => {
    store = createStore(rootReducer, undefined, applyMiddleware(thunk.withExtraArgument('myExtra')))
  });
  it('store should have correct shape', () => {
    expect(Object.keys(store.getState())).toEqual(['scoped', 'nonScoped', 'differentScoped'])
  });

  describe('plain actions', () => {
    it('should change with bound and non-bound reducers', () => {
      const boundAction = bindActionToScope({type: ACTION_TYPE, payload: 'first'}, scope) as AnyAction;
      store.dispatch(boundAction);
      expect(store.getState()['scoped']).toEqual('first');
      expect(store.getState()['nonScoped']).toEqual('first');
      expect(store.getState()['differentScoped']).toEqual('');

      const boundActionToScope2 = bindActionToScope({type: ACTION_TYPE, payload: 'other'}, otherScope) as AnyAction;
      store.dispatch(boundActionToScope2);
      expect(store.getState()['scoped']).toEqual('first');
      expect(store.getState()['nonScoped']).toEqual('other');
      expect(store.getState()['differentScoped']).toEqual('other');
    });
  });

  describe('action creators', () => {
    it('should change with bound and non-bound reducers', () => {
      const boundAction = bindActionToScope<undefined, StateShape, ExtraArg>(actionCreator, scope) as AnyActionFunction<undefined, StateShape, ExtraArg>;
      store.dispatch(boundAction('one'));
      expect(store.getState()['scoped']).toEqual('one');
      expect(store.getState()['nonScoped']).toEqual('one');
      expect(store.getState()['differentScoped']).toEqual('');


      const boundActionToScope2 = bindActionToScope<undefined, StateShape, ExtraArg>(actionCreator, otherScope) as AnyActionFunction<undefined, StateShape, ExtraArg>;
      store.dispatch(boundActionToScope2('two'));
      expect(store.getState()['scoped']).toEqual('one');
      expect(store.getState()['nonScoped']).toEqual('two');
      expect(store.getState()['differentScoped']).toEqual('two');
    });
  });

  describe('action creators that return thunks', () => {
    it('should work with bound and non-bound reducers', () => {
      const boundSimpleAction = bindActionToScope({type: ACTION_TYPE, payload: 'ok-'}, scope) as AnyAction;
      store.dispatch(boundSimpleAction);

      const boundAction = bindActionToScope<void, StateShape, ExtraArg>(thunkActionCreator, scope) as AnyActionFunction<undefined, StateShape, ExtraArg>;
      store.dispatch(boundAction('one', 'scoped'));

      expect(store.getState()['scoped']).toEqual('ok-onemyExtra');
      expect(store.getState()['nonScoped']).toEqual('ok-onemyExtra');
      expect(store.getState()['differentScoped']).toEqual('');
    });

    it('should work with async thunks', async (done) => {
      const boundAction = bindActionToScope<Promise<any>, StateShape, ExtraArg>(asynThunkActionCreator, scope) as AnyActionFunction<Promise<any>, StateShape, ExtraArg>;
      store.dispatch(boundAction('hello world')).then((data: string) => {
        expect(data).toEqual('hello world');
        expect(store.getState().scoped).toEqual('hello world');
        expect(store.getState().nonScoped).toEqual('hello world');
        expect(store.getState().differentScoped).toEqual('');
        done();
      })
    });
  });
});