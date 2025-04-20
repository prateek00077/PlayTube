class ApiResponse extends Error{
    constructor(statusCode, data, message ='success',success){
        super(message);
        this.statusCode = statusCode;
        this.success = success;
        this.message = message;
        this.data = data;
    }
}

export default ApiResponse;