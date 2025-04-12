class ApiResponse extends Error{
    constructor(statusCode, message ='success',success){
        super(message);
        this.statusCode = statusCode;
        this.success = success;
        this.message = message;
    }
}