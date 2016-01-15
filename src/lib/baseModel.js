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
        if(!this.constructor.schema)
        {
            throw new Error("A schema must be set on the model.");
        } // end if

        // Check to make sure we have a driver
        if(!this.constructor.driver)
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
        return Promise.resolve(new this.constructor(this.$values));
    } // end $duplicate

    $reload()
    {
        var driver = this.constructor.driver;
        return driver.get(this.$pk, this)
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
    } // end $reload

    $validate()
    {
        var schema = this.constructor.schema;
        return Promise.props(schema, (value, key) =>
            {
                // We only run validation if it's a type from our type system.
                if(value.$isType)
                {
                    return value.validate(this, key);
                } // end if
            })
            .then(() => true);
    } // end $validate

    $save()
    {
        var driver = this.constructor.driver;
        return this.$validate()
            .then(() =>
            {
                return driver.set(this.$pk, this.$values, this)
                    .then((id) =>
                    {
                        console.log('***id:', id);
                        this.$values[this.constructor.pk] = id;
                    })
                    .then(() =>
                    {
                        return this;
                    });
            });
    } // end $save

    $delete()
    {
        if(this.$exists)
        {
        var pkFieldName = this.constructor.pk;
        var driver = this.constructor.driver;

        var query = {};
        query[pkFieldName] = this.$pk;

        // Remove this instance
        return driver.remove(query, this)
            .then(() =>
            {
                this.$pk = undefined;
            });
        }
        else
        {
            return Promise.throw(new Error("Cannot delete a model that has not been saved yet!"));
        } // end if
    } // end $delete

    toJSON()
    {
        // Remove all keys that begin with `$`.
        function _filterObject(object)
        {
            console.log('obj:', object);
            return _.transform(object, (results, value, key) =>
            {
                if(_.isPlainObject(value))
                {
                    results[key] = _filterObject(value);
                }
                else if(!(typeof key === 'string' && key.charAt(0) === '$'))
                {
                    console.log('setting %s:%s', key, value);
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

    static _makeModel(item)
    {
        // Return a new instance of this Model, populated with the data from the driver.
        var inst = new this(item);

        // The instance isn't dirty, as we've just loaded it from the DB.
        inst.$dirty = false;

        // The instance exists in the database. (Required for some drivers.)
        inst.$exists = true;

        return inst;
    } // end makeModel

    static get(pk)
    {
        return this.driver.get(pk, this)
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
                    return this._makeModel(results);
                } // end if
            });
    } // end get

    static all()
    {
        return this.driver.getAll(this)
            .map((item) =>
            {
                return this._makeModel(item);
            });
    } // end all

    static filter(predicate)
    {
        return this.driver.filter(predicate, this)
            .map((item) =>
            {
                return this._makeModel(item);
            });
    } // end filter

    static remove(predicate)
    {
        return this.driver.remove(predicate, this);
    } // end remove

    static removeAll()
    {
        return this.driver.removeAll(this);
    } // end removeAll

    //------------------------------------------------------------------------------------------------------------------
    // Model Class creation API
    //------------------------------------------------------------------------------------------------------------------

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
                    get: function() { return value.get(this, key); },
                    set: function(val) { value.set(this, key, val); },
                    enumerable: true
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
