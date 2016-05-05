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

    get isPrimaryKey(){ return this.options.pk || this.options.primaryKey; }

    get(inst, key)
    {
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

        // Check for required. We do this before calling sanitize, because sanitize should never be able to override
        // the `required` flag. This is an intentional decision to limit the utility of `sanitize`.
        if(val === undefined || val === null)
        {
            // Primary keys are _never_ required for validation.
            if(this.options.required && !this.options.pk)
            {
                throw new errors.Required(key);
            }
            else
            {
                // Our values are undefined or null, but we're not a required field, so we return valid.
                return true;
            } // end if
        } // end if

        // Give the user the option to sanitize the inputs
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

            // We throw a more specific error if we fail validation
            if(!valid)
            {
                throw new errors.CustomValidation(val);
            } // end if
        } // end if

        if(!valid)
        {
            throw new errors.Validation(val, this);
        } // end if

        return valid;
    } // end validate

    toString()
    {
        return this.constructor.name;
    } // end toString
} // end BaseType

//----------------------------------------------------------------------------------------------------------------------

class StringType extends BaseType
{
    $validate(val)
    {
        if(_.isString(val))
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
        if(_.isNumber(val) && isFinite(val))
        {
            if(this.options.integer && !Number.isInteger(val))
            {
                throw new errors.Validation(val, this, `'${ val }' is not a valid integer.`);
            }
            else
            {
                return true;
            } // end if
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
    $validate(val)
    {
        if(_.isBoolean(val))
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
        if(_.isDate(val) && isFinite(val.getTime()))
        {
            return true;
        }
        else
        {
            throw new errors.Validation(val, this);
        } // end if
    } // end validate

    get(inst, key)
    {
        var ts = super.get(inst, key);

        if(ts === undefined && this.options.auto)
        {
            ts = Date.now();
        } // end if

        return new Date(ts);
    } // end get

    set(inst, key, val)
    {
        // Always attempt to cast to a Date.
        val = new Date(val);

        var timestamp = val.getTime();
        if(isFinite(timestamp))
        {
            // Dates are never stored as Date objects, but always unix timestamps under the hood.
            super.set(inst, key, timestamp);
        } // end if
    } // end set
} // end DateType

//----------------------------------------------------------------------------------------------------------------------

class ObjectType extends BaseType
{
    $validate(val)
    {
        if(_.isPlainObject(val))
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
        if(_.isArray(val))
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

class EnumType extends BaseType
{
    $validate(val)
    {
        var choices = this.options.values || [];
        if(_.contains(choices, val))
        {
            return true;
        }
        else
        {
            throw new errors.Validation(val, this, `'${ val }' must be one of: ${ this.options.values.join(', ') }`);
        } // end if
    } // end validate
} // end EnumType

//----------------------------------------------------------------------------------------------------------------------

class AnyType extends BaseType {}

//----------------------------------------------------------------------------------------------------------------------

export default {
    Base: BaseType,
    String: StringType,
    Number: NumberType,
    Boolean: BooleanType,
    Date: DateType,
    Object: ObjectType,
    Array: ArrayType,
    Enum: EnumType,
    Any: AnyType
};

//---------------------------------------------------------------------------------------------------------------------
