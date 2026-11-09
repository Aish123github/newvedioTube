// this file is used to send a response to the client in a consistent format 
// error response and api response are sent in the same format i.e class format
class ApiResponse {
    constructor(statusCode, message ="Success", data) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.Success = statusCode < 400;
    }
}
export {ApiResponse};