import {Action, AnyAction, combineReducers, ReducersMapObject} from 'redux';
import {ThunkAction} from "redux-thunk";
import Any = jasmine.Any;

export type Reducer<StateShape, Action=AnyAction> = (state: StateShape, action: Action) => StateShape;
// export type BindableAction<R, S, E, A extends AnyAction> = AnyAction | ((...args:any[]) => AnyAction) |((...a: any[]) => ThunkAction<R, S, E, A>);
export type AnyActionFunction = (...args: any[]) => AnyAction | ((dispatch: any, getState: any, extra: any) => any);
export type BindableAction = AnyActionFunction | AnyAction;

const scoper = '__scope';
export function bindActionToScope(action: BindableAction, scope: string):  BindableAction{
  if (typeof action !== "function") {
    return {...action, ...{[scoper]: {scope}}};
  } else {
    // it's a thunk
    return bindActionCreatorToScope(action, scope);
  }
}

export function bindReducerToScope<StateShape, Action=AnyAction>(reducer: Reducer<StateShape, Action>, scope: string) {
  return function boundReducer(state, action) {
    if(state === undefined) {
      return reducer(undefined, {} as Action);
    }
    if(action[scoper] && action[scoper].scope === scope) {
      return reducer(state, action);
    }
    return state;
  }
}

function bindDispatchToScope(dispatch, scope) {
  return function decoratedDispatch(action) {
    return dispatch(bindActionToScope(action, scope));
  }
}

function bindActionCreatorToScope(creator, scope) {
  return function wrappedActionCrator(...args) {
    const action = creator(...args);
    // if it returns an object, then bind that
    if (typeof action === "object") {
      return bindActionToScope(action, scope);
    }
    // if it's a thunk
    if (typeof action === "function") {
      return function thunk(dispatch, getState, rest) {
        const boundDispatch = bindDispatchToScope(dispatch, scope);
        return action(boundDispatch, getState, rest)
      }
    }
  }
}

export function scopedCombineReducers<StateShape>(reducers: ReducersMapObject<StateShape, any>, scope: string): Reducer<StateShape, AnyAction> {
    const objKeys = Object.keys(reducers);
    const finalObj: ReducersMapObject = {};
    for (let i = 0; i < objKeys.length; i++) {
        const key = objKeys[i];
        const reducer = reducers[key];
        if (typeof reducer === 'function') {
            finalObj[key] = bindReducerToScope(reducer, scope);
        }
    }
    return combineReducers<StateShape>(finalObj);
}
