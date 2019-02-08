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
    return function thunkAction(anotherDispatch, getState, extra) {
        const state = getState()[prop];
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
            const boundAction: BindableAction = bindActionToScope({type: ACTION_TYPE, payload: 'first'}, scope);
            store.dispatch(boundAction);
            expect(store.getState()['scoped']).toEqual('first');
            expect(store.getState()['nonScoped']).toEqual('first');
            expect(store.getState()['differentScoped']).toEqual('');

            const boundActionToScope2 = bindActionToScope({type: ACTION_TYPE, payload: 'other'}, otherScope)
            store.dispatch(boundActionToScope2);
            expect(store.getState()['scoped']).toEqual('first');
            expect(store.getState()['nonScoped']).toEqual('other');
            expect(store.getState()['differentScoped']).toEqual('other');
        });
    });

    describe('action creators', () => {
        it('should change with bound and non-bound reducers', () => {
            const boundAction = bindActionToScope(actionCreator, scope) as AnyActionFunction;
            store.dispatch(boundAction(...['one']));
            expect(store.getState()['scoped']).toEqual('one');
            expect(store.getState()['nonScoped']).toEqual('one');
            expect(store.getState()['differentScoped']).toEqual('');

            const boundActionToScope2 = bindActionToScope(actionCreator, otherScope) as AnyActionFunction;
            store.dispatch(boundActionToScope2('two'));
            expect(store.getState()['scoped']).toEqual('one');
            expect(store.getState()['nonScoped']).toEqual('two');
            expect(store.getState()['differentScoped']).toEqual('two');
        });
    });

    describe('action creators that return thunks', () => {
        it('should work with bound and non-bound reducers', () => {
            const boundSimpleAction = bindActionToScope({type: ACTION_TYPE, payload: 'ok-'}, scope);
            store.dispatch(boundSimpleAction);

            const boundAction = bindActionToScope(thunkActionCreator, scope) as AnyActionFunction;
            store.dispatch(boundAction('one', 'scoped'));

            expect(store.getState()['scoped']).toEqual('ok-onemyExtra');
            expect(store.getState()['nonScoped']).toEqual('ok-onemyExtra');
            expect(store.getState()['differentScoped']).toEqual('');
        });
    });
});