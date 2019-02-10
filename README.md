# Bound Redux Reducers
Helper library for Redux to facilitate reducer reuse.
Actions and reducers can be bound to __scopes__:
When an action bound to a specific scope is dispatched,
the action is only passed into reducers that are also bound to the
same scope; reducers bound to different scopes return their
current states. Unbound reducers are unaffected by this library:
bound actions are passed to unbound reducers.

## Install
`npm install --save bound-redux-reducers`
The library has `redux` and `redux-thunk` as its peer dependencies.
You need install these two libraries as well.

## Usage

### bindReducerToScope
Binds reducers to a scope.
Takes two arguments:
1. Reducer
2. Scope

### bindActionToScope
Binds an action or action creator to a scope.
Takes two arguments:
1. Action or action creator (action creator can return an action or a thunk)
2. Scope

```
const {createStore, applyMiddleware, combineReducers} = require('redux');
const thunk = require('redux-thunk').default;
const {bindActionToScope, bindReducerToScope} = require('bound-reducers');

function reducer(state='', action) {
  if(action.type === 'a') {
    return action.payload;
  }
  return state;
}

const rootRecuder = combineReducers({
  aScope: bindReducerToScope(reducer, 'aScope'),
  bScope: bindReducerToScope(reducer, 'bScope'),
  unScoped: reducer,
});

const store = createStore(rootRecuder, applyMiddleware(thunk));

const creator = (payload) => ({type: 'a', payload});
const aBoundAction = bindActionToScope({type: 'a', payload: 'A'}, 'aScope');
const bBoundActionCreator = bindActionToScope(creator, 'bScope');

store.dispatch(aBoundAction)
store.dispatch(bBoundActionCreator('B'))
```
After dispatching the two actions, the state is:

```
{ aScope: 'A', bScope: 'B', unScoped: 'B' }
```

### scopedCombineReducers
Binds Redux's `combineReducers` to a scope. `scopedCombineReducers`
is a wrapper around `combineReducers`: you can easily scope an object's
reducing functions (the object's values) into a scope.

```
const {createStore, applyMiddleware, combineReducers} = require('redux');
const thunk = require('redux-thunk').default;
// import scopedCombineReducers
const {scopedCombineReducers, bindActionToScope, bindReducerToScope} = require('bound-reducers');

// Reducer stays the same
function reducer(state='', action) {
  if(action.type === 'a') {
    return action.payload;
  }
  return state;
}
// aScope is now a nested object that's wrapped with scopedCombineReducers
const rootRecuder = combineReducers({
  aScope: scopedCombineReducers({
    nested: combineReducers({
      value: reducer
    })
  }, 'aScope'),
  bScope: bindReducerToScope(reducer, 'bScope'),
  unScoped: reducer,
});

const store = createStore(rootRecuder, applyMiddleware(thunk));

const creator = (payload) => ({type: 'a', payload});
const aBoundAction = bindActionToScope({type: 'a', payload: 'A'}, 'aScope');
const bBoundActionCreator = bindActionToScope(creator, 'bScope');

store.dispatch(aBoundAction)
store.dispatch(bBoundActionCreator('B'))
```
After dispatching the two actions, the state is:
```
{ aScope: { nested: { value: 'A' } },
  bScope: 'B',
  unScoped: 'B' }
```

