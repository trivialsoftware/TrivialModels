//----------------------------------------------------------------------------------------------------------------------
/// TrivialModel
///
/// @module
//----------------------------------------------------------------------------------------------------------------------

import BaseModel from './lib/baseModel';
import errors from './lib/errors';
import types from './lib/types';

//----------------------------------------------------------------------------------------------------------------------

function buildModelClass()
{
    class TrivialModel extends BaseModel{}
    return TrivialModel;
} // end buildModelClass

//----------------------------------------------------------------------------------------------------------------------

function defineModel(definition)
{
    var Model;

    if(definition.name)
    {
        // If the user passed in a name for the model, we respect that, otherwise we call it 'TrivialModel'.
        Model = (new Function(
            'BaseModel',
            'return ' + buildModelClass.toString().replace(/TrivialModel/g, definition.name) + '()'
        )(BaseModel));
    }
    else
    {
        Model = buildModelClass();
    } // end if

    Model.setSchema(definition.schema);
    Model.setDriver(definition.driver);
    model.setPrimaryKey(definition.primaryKey);

    return Model;
} // end defineModel

//----------------------------------------------------------------------------------------------------------------------

// Retain CommonJS export semantics for consumers
module.exports = {
    define: defineModel,
    BaseModel,
    errors,
    types
};

//----------------------------------------------------------------------------------------------------------------------
