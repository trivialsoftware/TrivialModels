// ---------------------------------------------------------------------------------------------------------------------
// Unit Tests for the simpleDriver.spec.js module.
//
// @module
// ---------------------------------------------------------------------------------------------------------------------

var expect = require('chai').expect;

var TrivialDBDriver = require('../../src/drivers/trivialdbDriver').default;

// ---------------------------------------------------------------------------------------------------------------------

describe('TrivialDB Driver', () =>
{
    var driver;
    beforeEach(() =>
    {
        driver = new TrivialDBDriver('test', { writeToDisk: false });
        driver.db.values = {
            'test1': { name: 'Test 1', admin: false, id: 'test1' },
            'test2': { name: 'Test 2', admin: true, id: 'test2' },
            'test3': { name: 'Test 3', admin: false, id: 'test3' }
        };
    });

    describe('#get()', () =>
    {
        it('supports retrieving existing values', () =>
        {
            return driver.get('test1')
                .then((results) =>
                {
                    expect(results).to.deep.equal(driver.db.values.test1);
                });
        });

        it('returns undefined for non-existing values', () =>
        {
            return driver.get('dne')
                .then((results) =>
                {
                    expect(results).to.be.undefined;
                });
        });
    });

    describe('#set()', () =>
    {
        it('supports generating ids', () =>
        {
            var data = { name: 'Test 4', admin: false, email: 'foo@bar.com' };
            return driver.set(data)
                .then((id) =>
                {
                    data.id = id;
                    expect(driver.db.values[id]).to.deep.equal(data);
                });
        });

        it('supports setting new values', () =>
        {
            var data = { name: 'Test 4', admin: false, email: 'foo@bar.com', id: 'test4' };
            return driver.set('test4', data, null)
                .then((id) =>
                {
                    expect(driver.db.values.test4).to.deep.equal(data);
                    expect(id).to.equal('test4');
                });
        });

        it('supports updating existing values', () =>
        {
            var data = { name: 'Test 4', admin: false, email: 'foo@bar.com', id: 'test2' };
            return driver.set('test2', data, null)
                .then(() =>
                {
                    expect(driver.db.values.test2).to.deep.equal(data);
                });
        });
    });

    describe('#filter()', () =>
    {
        it('supports a simple predicate', () =>
        {
            return driver.filter({ admin: true })
                .then((results) =>
                {
                    expect(results).to.deep.equal([driver.db.values.test2]);
                });
        });

        it('supports a predicate function', () =>
        {
            return driver.filter((item) => { return !!item.admin; })
                .then((results) =>
                {
                    expect(results).to.deep.equal([driver.db.values.test2]);
                });
        });
    });

    describe('#query()', () =>
    {
        it('passes a query object into the query function', () =>
        {
            return driver.query((queryObj) =>
            {
                expect(queryObj).to.not.be.undefined;
            });
        });

        it('allows for arbitrary querying of the database', () =>
        {
            return driver.query((query) =>
                {
                    return query.filter({ admin: true }).run();
                })
                .then((results) =>
                {
                    expect(results).to.deep.equal([driver.db.values.test2]);
                });
        });
    });

    describe('#remove()', () =>
    {
        it('supports a simple predicate', () =>
        {
            return driver.remove({ admin: true })
                .then(() =>
                {
                    expect(driver.db.values.test2).to.be.undefined;
                });
        });

        it('supports a predicate function', () =>
        {
            return driver.remove((item) => !!item.admin)
                .then((removed) =>
                {
                    expect(driver.db.values.test2).to.be.undefined;
                });
        });
    });

    describe('#removeAll()', () =>
    {
        it('supports removing all values', () =>
        {
            return driver.removeAll()
                .then(() =>
                {
                    expect(driver.db.values).to.deep.equal({});
                });
        });
    });
});

// ---------------------------------------------------------------------------------------------------------------------
