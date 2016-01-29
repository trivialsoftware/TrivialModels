//----------------------------------------------------------------------------------------------------------------------
/// TrivialModel
///
/// @module
//----------------------------------------------------------------------------------------------------------------------

import _ from 'lodash';

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

    if(definition.name && _.isString(definition.name))
    {
        // Sanitize the name a little bit; we don't allow: (, ), [, ], %, =, +, -, /, *, ;, ., or whitespace. If you can
        // still break eval after this, I tip my hat to you.
        var name = definition.name.replace(/[\(\)\[\]%=+-\/\*\s;\.]/g, '');

        // If the user passed in a name for the model, we respect that, otherwise we call it 'TrivialModel'.
        Model = (eval('(' + buildModelClass.toString().replace(/TrivialModel/g, name) + ')()'));
    }
    else
    {
        Model = buildModelClass();
    } // end if

    Model.setSchema(definition.schema);
    Model.setDriver(definition.driver);

    return Model;
} // end defineModel

//----------------------------------------------------------------------------------------------------------------------

// Retain CommonJS export semantics for consumers
module.exports = {
    define: defineModel,
    BaseModel,
    errors,
    types : {
        String: (opts) => { return new types.String(opts); },
        Number: (opts) => { return new types.Number(opts); },
        Boolean: (opts) => { return new types.Boolean(opts); },
        Date: (opts) => { return new types.Date(opts); },
        Object: (opts) => { return new types.Object(opts); },
        Array: (opts) => { return new types.Array(opts); },
        Any: (opts) => { return new types.Any(opts); }
    }
};

//----------------------------------------------------------------------------------------------------------------------
