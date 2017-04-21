import { GET_PRODUCTS } from './products-action-creators.es6';

export default function products(state = {
  foo: '</script><script>alert(/aaa/);//',
}, action) {
  switch (action.type) {
    case GET_PRODUCTS:
      return {
        ...state
      };
    case `${GET_PRODUCTS}_ERROR`:
      return {
        ...state
      };
    default:
      return state;
  }
}
