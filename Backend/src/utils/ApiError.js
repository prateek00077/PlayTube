class ApiError extends Error {
    constructor(statusCode, message="Something went wrong",errors = [], stack) {
        super(message);
        this.statusCode = statusCode;
        this.stack = stack || this.stack;
        this.errors = errors
    }
}

export default ApiError;