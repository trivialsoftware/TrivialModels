//----------------------------------------------------------------------------------------------------------------------
/// TrivialModel
///
/// @module
//----------------------------------------------------------------------------------------------------------------------

import _ from 'lodash';
import Promise from 'bluebird';

import errors from './errors';

//----------------------------------------------------------------------------------------------------------------------

class TrivialModel {
    constructor(initialData)
    {
        // Check to make sure we have a schema
        if(!this.$schema)
        {
            throw new Error("A schema must be set on the model.");
        } // end if

        // Check to make sure we have a driver
        if(!this.$driver)
        {
            throw new Error("A driver must be set on the model.");
        } // end if

        this.$dirty = false;
        this.$exists = false;
        this.$values = {};

        _.assign(this, initialData);
    } // end constructor

    //------------------------------------------------------------------------------------------------------------------
    // Properties
    //------------------------------------------------------------------------------------------------------------------

    get $pk(){ return this.$values[this.constructor.pk]; }
    set $pk(val){ this.$values[this.constructor.pk] = val; this.$dirty = true; this.$exists = false; }

    //------------------------------------------------------------------------------------------------------------------
    // Instance API
    //------------------------------------------------------------------------------------------------------------------

    $duplicate()
    {
        var driver = this.constructor.driver;
        return Promise.throw(errors.NotImplemented('$duplicate'));
    } // end duplicate

    $reload()
    {
        var driver = this.constructor.driver;
        return driver.get(this.$pk)
            .then((results) =>
            {
                if(_.isArray(results))
                {
                    throw new errors.MultipleDocuments(this.$pk, this.name);
                }
                else if(!results)
                {
                    throw new errors.DocumentNotFound(this.$pk, this.name);
                }
                else
                {
                    this.$exists = true;
                    this.$values = {};
                    _.assign(this, results);

                    this.$dirty = false;
                } // end if
            });
    } // end reload

    $validate()
    {
        var schema = this.constructor.schema;
        return Promise.each(schema, (value, key) =>
            {
                // We only run validation if it's a type from our type system.
                if(value.$isType)
                {
                    return value.validate(this, key);
                } // end if
            })
            .then(() => true);
    } // end validate

    $save()
    {
        var driver = this.constructor.driver;
        return Promise.throw(errors.NotImplemented('$save'));
    } // end save

    toJSON()
    {
        // Remove all keys that begin with `$`.
        function _filterObject(object)
        {
            return _.transform(object, (results, value, key) =>
            {
                if(_.isPlainObject(value))
                {
                    results[key] = _filterObject(value);
                }
                else if(!(typeof key === 'string' && key.charAt(0) === '$'))
                {
                    results[key] = value;
                } // end if

                return results;
            });
        } // end _filterObject

        return _filterObject(this.$values);
    } // end toJSON

    //------------------------------------------------------------------------------------------------------------------
    // Class API
    //------------------------------------------------------------------------------------------------------------------

    static get(pk)
    {
        return this.driver.get(pk)
            .then((results) =>
            {
                if(_.isArray(results))
                {
                    throw new errors.MultipleDocuments(pk, this.name);
                }
                else if(!results)
                {
                    throw new errors.DocumentNotFound(pk, this.name);
                }
                else
                {
                    // Return a new instance of this Model, populated with the data from the driver.
                    var inst = new this(results);

                    // The instance isn't dirty, as we've just loaded it from the DB.
                    inst.$dirty = false;

                    // The instance exists in the database. (Required for some drivers.)
                    inst.$exists = true;

                    return inst;
                } // end if
            });
    } // end get

    static all()
    {
        return Promise.throw(errors.NotImplemented('[static] all'));
    } // end all

    static filter(predicate)
    {
        console.log('[static] filter called');
        return Promise.throw(errors.NotImplemented('[static] filter'));
    } // end filter

    static remove()
    {
        console.log('[static] remove called');
        return Promise.throw(errors.NotImplemented('[static] remove'));
    } // end remove

    static removeAll()
    {
        console.log('[static] removeAll called');
        return Promise.throw(errors.NotImplemented('[static] removeAll'));
    } // end removeAll

    static setPrimaryKey(pk)
    {
        this.pk = pk || 'id';
    } // end setPrimaryKey

    static setSchema(schema)
    {
        this.schema = schema;

        // Build the schema
        _.forIn(schema, (value, key) =>
        {
            if(value.$isType)
            {
                // Define the getter/setters for the model fields
                Object.defineProperty(this.prototype, key, {
                    get: () => { return value.get(this, key); },
                    set: (val) => { value.set(this, val); }
                });
            }
            else
            {
                this.prototype[key] = value;
            } // end if
        });
    } // end setSchema

    static setDriver(driver)
    {
        this.driver = driver;
    } // end setDriver
} // end TrivialModel

//----------------------------------------------------------------------------------------------------------------------

export default TrivialModel;

//----------------------------------------------------------------------------------------------------------------------