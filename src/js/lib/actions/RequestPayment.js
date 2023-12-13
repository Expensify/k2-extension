import ReactNativeOnyx from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';

// function requestPayment(amount, message) {

// }

function saveCPlusPaymentSatus(issueID, status, amount) {
    ReactNativeOnyx.set(`${ONYXKEYS.COLLECTION.C_PLUS_PAYMENT_STATUS}${issueID}`, {status, amount});
}
function removeCPlusPaymentSatus(issueID) {
    ReactNativeOnyx.set(`${ONYXKEYS.COLLECTION.C_PLUS_PAYMENT_STATUS}${issueID}`, null);
}

export default {
    saveCPlusPaymentSatus,
    removeCPlusPaymentSatus,
};
