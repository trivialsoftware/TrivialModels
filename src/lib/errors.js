//----------------------------------------------------------------------------------------------------------------------
// Custom errors
//
// @module error.js
//----------------------------------------------------------------------------------------------------------------------

import { BaseError } from 'make-error';

//----------------------------------------------------------------------------------------------------------------------

class NotImplementedError extends BaseError
{
    constructor(api)
    {
        super(`'${api}' is not implemented.`);
    } // end constructor
} // end NotImplemented Error

//----------------------------------------------------------------------------------------------------------------------

class DocumentNotFoundError extends BaseError
{
    constructor(id, modelName)
    {
        super(`Document with id '${doc}' not found in model '${modelName}'.`);
        this.id = id;
        this.model = modelName;
    } // end constructor
} // end DocumentNotFoundError

//----------------------------------------------------------------------------------------------------------------------

class MultipleDocumentsError extends BaseError
{
    constructor(id, modelName)
    {
        super(`Multiple documents returned with id '${doc}' in model '${modelName}'.`);
        this.id = id;
        this.model = modelName;
    } // end constructor
} // end DocumentNotFoundError

//----------------------------------------------------------------------------------------------------------------------

class RequiredError extends BaseError
{
    constructor(key)
    {
        super(`'${key}' is required and cannot be undefined or null.`);
        this.key = key;
    } // end constructor
} // end RequiredError

//----------------------------------------------------------------------------------------------------------------------

class CustomValidationError extends BaseError
{
    constructor(val)
    {
        super(`Value '${JSON.stringify(val)}' failed custom validation.`);
        this.value = val;
    } // end constructor
} // end CustomValidationError

//----------------------------------------------------------------------------------------------------------------------

class ValidationError extends BaseError
{
    constructor(val, type)
    {
        super(`Value '${JSON.stringify(val)}' is not a valid '${type}'.`);
        this.value = val;
        this.type = type;
    } // end constructor
} // end ValidationError

//----------------------------------------------------------------------------------------------------------------------

class WriteDatabaseError extends BaseError
{
    constructor(error, path)
    {
        super(`Error writing database('${ path }'): ${error}`);
        this.innerError = error;
        this.path = path;
    } // end constructor
} // end WriteDatabaseError

//----------------------------------------------------------------------------------------------------------------------

export default {
    NotImplemented: NotImplementedError,
    DocumentNotFound: DocumentNotFoundError,
    MultipleDocuments: MultipleDocumentsError,
    Required: RequiredError,
    Validation: ValidationError,
    CustomValidation: CustomValidationError,
    WriteDatabase: WriteDatabaseError
};

//----------------------------------------------------------------------------------------------------------------------
