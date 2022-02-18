let alreadyFetched = false;

class BaseStore {
    constructor() {
        this.loading = false;
        this.retrying = false;
        this.data = [];
        this.errorMessage = null;
    }

    handleFetch() {
        if (alreadyFetched) {
            return;
        }

        this.loading = true;
        this.retrying = false;
        if(this.data.length <= 0)
            this.data = [];
        alreadyFetched = true;
    }

    handleUpdate(data) {
        this.loading = false;
        this.retrying = false;
        if(data.length <= 0) return;
        this.data = data;
        this.setState({data});
    }

    handleFailed(msg) {
        this.loading = false;
        this.retrying = false;
        this.errorMessage = msg;
    }

    handleRetry() {
        this.loading = false;
        this.retrying = true;
    }
}

export default BaseStore;
