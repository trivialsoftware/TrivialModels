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
    constructor(options)
    {
        this.options = options || {};
    } // end constructor

    //------------------------------------------------------------------------------------------------------------------
    // Driver API
    //------------------------------------------------------------------------------------------------------------------

    init(model)
    {
        this.options.pk = model.pk;

        if(this.options.namespace)
        {
            var nsName = this.options.namespace.name;
            var nsOpts = _.omit(this.options.namespace, 'name');

            if(_.isString(his.options.namespace))
            {
                nsName = this.options.namespace;
                nsOpts = undefined;
            } // end if

            var namespace = trivialdb.ns(nsName, nsOpts);
            this.db = namespace.db(this.options.name, _.omit(this.options, ['namespace', 'name']));
        }
        else
        {
            this.db = trivialdb.db(this.options.name, _.omit(this.options, ['name']));
        } // end if
    } // end init

    get(pk)
    {
        return this.db.load(pk)
            .catch(trivialdb.errors.DocumentNotFound, () => undefined);
    } // end get

    getAll()
    {
        return Promise.resolve(this.db.filter({}));
    } // end getAll

    set(pk, value)
    {
        return this.db.save(pk, value);
    } // end set

    filter(predicate)
    {
        return Promise.resolve(this.db.filter(predicate));
    } // end filter

    query(queryFunc)
    {
        return Promise.resolve(queryFunc(this.db.query()));
    } // end queryFun

    remove(predicate)
    {
        return this.db.remove(predicate);
    } // end remove

    removeAll()
    {
        this.db.values = {};
        return this.db.sync();
    } // end removeAll
} // end TrivialDBDriver

//----------------------------------------------------------------------------------------------------------------------

export default TrivialDBDriver;

//----------------------------------------------------------------------------------------------------------------------
