//----------------------------------------------------------------------------------------------------------------------
/// SimpleDriver - A simple, in-memory driver for TrivialModels
///
/// @module
//----------------------------------------------------------------------------------------------------------------------

import _ from 'lodash';
import Promise from 'bluebird';

//----------------------------------------------------------------------------------------------------------------------

class SimpleDriver {
    constructor()
    {
        this.db = {};
    } // end constructor

    _genID()
    {
        return '' + Date.now();
    } // end _genID

    //------------------------------------------------------------------------------------------------------------------
    // Driver API
    //------------------------------------------------------------------------------------------------------------------

    init(){}

    get(pk /*, inst*/)
    {
        return Promise.resolve(this.db[pk]);
    } // end get

    getAll(/*inst*/)
    {
        return Promise.resolve(_.values(this.db));
    } // end getAll

    set(pk, value/*, inst*/)
    {
        if(arguments.length == 1)
        {
            value = pk;
            pk = this._genID();
        } // end if

        if(arguments.length == 2)
        {
            //inst = value;
            value = pk;
            pk = this._genID();
        } // end if

        pk = pk || this._genID();

        this.db[pk] = value;
        return Promise.resolve(pk);
    } // end set

    filter(predicate /*, inst*/)
    {
        return Promise.resolve(_(this.db).values().filter(predicate).run());
    } // end filter

    query(queryFunc /*, inst*/)
    {
        return Promise.resolve(queryFunc(_(this.db)));
    } // end queryFun

    remove(predicate /*, inst*/)
    {
        return Promise.resolve(_(this.db).keys().reduce((results, pk) =>
            {
                var item = this.db[pk];

                // Simplest way to get lodash filter compatible predicates is to attempt to filter a list with the
                // single item, and if that is not empty, we know it failed the filter, so it should be in the final
                // output.
                if(!_.isEmpty(_.filter([item], predicate)))
                {
                    results.push(pk);
                } // end if

                return results;
            }, []))
            .then((toRemove) =>
            {
                _.each(toRemove, (pk) =>
                {
                    delete this.db[pk];
                });
            });
    } // end remove

    removeAll(/*inst*/)
    {
        this.db = {};
        return Promise.resolve();
    } // end removeAll
} // end SimpleDriver

//----------------------------------------------------------------------------------------------------------------------

export default SimpleDriver;

//----------------------------------------------------------------------------------------------------------------------
