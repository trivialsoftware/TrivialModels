//----------------------------------------------------------------------------------------------------------------------
/// Defines the various types and how to retrieve, store, sanitize and validate them.
///
/// @module
//----------------------------------------------------------------------------------------------------------------------

import _ from 'lodash';

import errors from './errors';

//----------------------------------------------------------------------------------------------------------------------

class BaseType
{
    constructor(options)
    {
        this.$isType = true;
        this.options = options || {};

        if(this.options.sanitize && _.isFunction(this.options.sanitize))
        {
            this.$sanitize = this.options.sanitize;
        } // end if
    } // end constructor

    get(inst, key)
    {
        console.log('inst:', inst);
        var val = inst.$values[key];
        if(val === undefined)
        {
            val = this.options.default;
        } // end if

        return val;
    } // end get

    set(inst, key, val)
    {
        inst.$values[key] = val;
        inst.$dirty = true;
    } // end set

    validate(inst, key)
    {
        var valid = true;
        var val = this.get(inst, key);

        if(this.$sanitize)
        {
            val = this.$sanitize(val, inst);
        } // end if

        // Call the type specific validation
        if(this.$validate)
        {
            valid = this.$validate(val, inst);
        } // end if

        // Call the user defined validation, if it exists
        if(valid && this.options.validate)
        {
            valid = this.options.validate.call(inst, val);
        } // end if

        return valid;
    } // end validate

    toString()
    {
        return this.constructor.name;
    } // end toString
} // end BaseType

//----------------------------------------------------------------------------------------------------------------------

class AnyType extends BaseType {}

//----------------------------------------------------------------------------------------------------------------------

class StringType extends BaseType
{
    $validate(val)
    {
        if(!this.options.required && (val === null || val === undefined) ? true : _.isString(val))
        {
            return true;
        }
        else
        {
            throw new errors.Validation(val, this);
        } // end if
    } // end validate
} // end StringType

//----------------------------------------------------------------------------------------------------------------------

class NumberType extends BaseType
{
    $validate(val)
    {
        if(!this.options.required && (val === null || val === undefined) ? true : _.isNumber(val) && isFinite(val))
        {
            return true;
        }
        else
        {
            throw new errors.Validation(val, this);
        } // end if
    } // end validate
} // end NumberType

//----------------------------------------------------------------------------------------------------------------------

class BooleanType extends BaseType
{
    $sanitize(val)
    {
        return !!val;
    } // end sanitize

    $validate(val)
    {
        if(!this.options.required && (val === null || val === undefined) ? true : _.isBoolean(val))
        {
            return true;
        }
        else
        {
            throw new errors.Validation(val, this);
        } // end if
    } // end validate
} // end BooleanType

//----------------------------------------------------------------------------------------------------------------------

class DateType extends BaseType
{
    $validate(val)
    {
        var oldVal = val;
        val = new Date(val);
        if(!this.options.required && (val === null || val === undefined) ? true : _.isDate(val))
        {
            return true;
        }
        else
        {
            throw new errors.Validation(oldVal, this);
        } // end if
    } // end validate

    get(inst, key)
    {
        return new Date(super.get(inst, key));
    } // end get

    set(inst, val)
    {
        val = new Date(val);

        // Dates are never stored as Date objects, but always unix timestamps under the hood.
        return super.set(inst, val.getTime());
    } // end set
} // end DateType

//----------------------------------------------------------------------------------------------------------------------

class ObjectType extends BaseType
{
    $validate(val)
    {
        if(!this.options.required && (val === null || val === undefined) ? true : _.isPlainObject(val))
        {
            return true;
        }
        else
        {
            throw new errors.Validation(val, this);
        } // end if
    } // end validate
} // end ObjectType

//----------------------------------------------------------------------------------------------------------------------

class ArrayType extends BaseType
{
    $validate(val)
    {
        if(!this.options.required && (val === null || val === undefined) ? true : _.isArray(val))
        {
            return true;
        }
        else
        {
            throw new errors.Validation(val, this);
        } // end if
    } // end validate
} // end ArrayType

//----------------------------------------------------------------------------------------------------------------------

export default {
    Base: BaseType,
    String: StringType,
    Number: NumberType,
    Boolean: BooleanType,
    Date: DateType,
    Object: ObjectType,
    Array: ArrayType,
    Any: AnyType
};

//---------------------------------------------------------------------------------------------------------------------
