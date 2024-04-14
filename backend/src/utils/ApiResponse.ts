
class ApiResponse {

     statusCode : number;
     message: string;
     responseObject: object;
     success :boolean; 
    constructor(statusCode: number,
        message: string,
        responseObject: object,
        success = true
    ){
     this.statusCode = statusCode;
     this.message = message;
     this.responseObject = responseObject;
     this.success = success
    }


}