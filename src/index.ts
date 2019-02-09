import {AnyAction, combineReducers, ReducersMapObject} from 'redux';
import {ThunkAction} from "redux-thunk";

export type Reducer<StateShape, Action=AnyAction> = (state: StateShape, action: Action) => StateShape;
export type AnyActionFunction<ReturnValue, State, ExtraArg, Act extends AnyAction=AnyAction> = (...args: any[]) => AnyAction | ThunkAction<ReturnValue, State, ExtraArg, Act>;
export type BindableAction<ReturnValue, State, ExtraArg, Act extends AnyAction> = AnyActionFunction<ReturnValue, State, ExtraArg, Act> | AnyAction;

const scoper = '__scope';
function bindActionCreatorToScope(creator, scope) {
  return function wrappedActionCrator(...args) {
    const action = creator(...args);
    // if it returns an object, then bind that
    if (typeof action === "object") {
      return bindActionToScope(action, scope);
    }
    if (typeof action === "function") {
      return function thunk(dispatch, getState, rest) {
        function boundDispatch(actionFromThunk) {
            dispatch(bindActionToScope(actionFromThunk, scope))
        }
        return action(boundDispatch, getState, rest)
      }
    }
  }
}
export function bindActionToScope<ReturnValue, State, ExtraArg, Act extends AnyAction = AnyAction>(action: AnyAction | AnyActionFunction<ReturnValue, State, ExtraArg, Act>, scope: string): AnyAction | AnyActionFunction<ReturnValue, State, ExtraArg, Act>{
  if (typeof action !== "function" ) {
    return {...action, ...{[scoper]: {scope}}} as AnyAction;
  } else {
    return bindActionCreatorToScope(action, scope) as AnyActionFunction<ReturnValue, State, ExtraArg, Act>;
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
