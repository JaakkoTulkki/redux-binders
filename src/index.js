const { combineReducers } = require('redux');

const scoper = '__scope';
function bindActionToScope(action, scope) {
  if (typeof action !== "function") {
    return {...action, ...{[scoper]: {scope}}};
  } else {
    // it's a thunk
    return bindActionCreatorToScope(action, scope);
  }
}

function bindReducerToScope(reducer, scope) {
  return function boundReducer(state, action) {
    if(state === undefined) {
      return reducer(undefined, {});
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

function scopedCombineReducers(reducers, scope) {
  const objKeys = Object.keys(reducers);
  const finalObj = {}
  for (let i = 0; i < objKeys.length; i++) {
    const key = objKeys[i];
    const reducer = reducers[key];
    if (typeof reducer === 'function') {
      finalObj[key] = bindReducerToScope(reducer, scope);
    }
  }
  return combineReducers(finalObj);
}

module.exports = {
  bindActionToScope,
  bindReducerToScope,
  scopedCombineReducers,
};
