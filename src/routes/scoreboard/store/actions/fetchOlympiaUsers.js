import api, { ProductVariantResponse, ProductVariantsQueryParams } from 'api';
import { Dispatch } from 'store';
import { addSections } from 'store/section';
import addProducts from './addProducts';
import addProductVariants from './addProductVariants';

const url = '';

export default (params: ProductVariantsQueryParams) => (dispatch: Dispatch) =>
    restFetch(url)
        .then((response) => {
        if (!response) {
            return []
        }
        dispatch(addUsers(response));
    })
