import ReactNativeOnyx from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';

// function requestPayment(amount, message) {

// }

function saveCPlusPaymentSatus(issueID, status) {
    ReactNativeOnyx.set(`${ONYXKEYS.ISSUES.C_PLUS_PAYMENT_STATUS}${issueID}`, status);
}

export default {
    saveCPlusPaymentSatus,
};
