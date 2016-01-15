// ---------------------------------------------------------------------------------------------------------------------
// Unit Tests for the simpleDriver.spec.js module.
//
// @module
// ---------------------------------------------------------------------------------------------------------------------

var expect = require('chai').expect;

var SimpleDriver = require('../../src/drivers/simpleDriver').default;

// ---------------------------------------------------------------------------------------------------------------------

describe('Simple Driver', () =>
{
    var driver;
    beforeEach(() =>
    {
        driver = new SimpleDriver();
        driver.db = {
            'test1': { name: 'Test 1', admin: false },
            'test2': { name: 'Test 2', admin: true },
            'test3': { name: 'Test 3', admin: false }
        };
    });

    describe('#get()', () =>
    {
        it('supports retrieving existing values', () =>
        {
            return driver.get('test1')
                .then((results) =>
                {
                    expect(results).to.equal(driver.db.test1);
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
                    expect(driver.db[id]).to.equal(data);
                });
        });

        it('supports setting new values', () =>
        {
            var data = { name: 'Test 4', admin: false, email: 'foo@bar.com' };
            return driver.set('test4', data, null)
                .then((id) =>
                {
                    expect(driver.db.test4).to.equal(data);
                    expect(id).to.equal('test4');
                });
        });

        it('supports updating existing values', () =>
        {
            var data = { name: 'Test 4', admin: false, email: 'foo@bar.com' };
            return driver.set('test2', data, null)
                .then(() =>
                {
                    expect(driver.db.test2).to.equal(data);
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
                    expect(results).to.deep.equal([driver.db.test2]);
                });
        });

        it('supports a predicate function', () =>
        {
            return driver.filter((item) => { return !!item.admin; })
                .then((results) =>
                {
                    expect(results).to.deep.equal([driver.db.test2]);
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
                    expect(driver.db.test2).to.be.undefined;
                });
        });

        it('supports a predicate function', () =>
        {
            return driver.remove((item) => { return !!item.admin; })
                .then(() =>
                {
                    expect(driver.db.test2).to.be.undefined;
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
                    expect(driver.db).to.deep.equal({});
                });
        });
    });
});

// ---------------------------------------------------------------------------------------------------------------------
