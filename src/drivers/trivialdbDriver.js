//----------------------------------------------------------------------------------------------------------------------
/// TrivialDBDriver - A simple, in-memory driver for TrivialModels
///
/// @module
//----------------------------------------------------------------------------------------------------------------------

import _ from 'lodash';
import Promise from 'bluebird';
import trivialdb from 'trivialdb';

//----------------------------------------------------------------------------------------------------------------------

class TrivialDBDriver {
    constructor(name, options)
    {
        options = options || {};

        if(options.namespace)
        {
            var namespace = trivialdb.ns(options.namespace.name, options.namespace);
            this.db = namespace.db(name, _.omit(options, 'namespace'));
        }
        else
        {
            this.db = trivialdb.db(name, options);
        } // end if
    } // end constructor

    get(pk, inst)
    {
        return this.db.load(pk)
            .catch(trivialdb.errors.DocumentNotFound, () => undefined);
    } // end get

    getAll(inst)
    {
        return Promise.resolve(this.db.filter({}));
    } // end getAll

    set(pk, value, inst)
    {
        return this.db.save(pk, value);
    } // end set

    filter(predicate, inst)
    {
        return Promise.resolve(this.db.filter(predicate));
    } // end filter

    remove(predicate, inst)
    {
        return this.db.remove(predicate);
    } // end remove

    removeAll(inst)
    {
        this.db.values = {};
        return this.db.sync();
    } // end removeAll
} // end TrivialDBDriver

//----------------------------------------------------------------------------------------------------------------------

export default TrivialDBDriver;

//----------------------------------------------------------------------------------------------------------------------
