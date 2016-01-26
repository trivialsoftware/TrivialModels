// ---------------------------------------------------------------------------------------------------------------------
// Unit Tests for the baseModel.spec.js module.
//
// @module baseModel.spec.js
// ---------------------------------------------------------------------------------------------------------------------

var _ = require('lodash');
var expect = require('chai').expect;

var types = require('../../src/lib/types').default;
var errors = require('../../src/lib/errors').default;
var BaseModel = require('../../src/lib/baseModel').default;
var SimpleDriver = require('../../src/drivers/simpleDriver').default;

// ---------------------------------------------------------------------------------------------------------------------

describe('BaseModel', function()
{
    class TestModel extends BaseModel {}

    // This looks ugly because we're not wrapping the types in factory functions.
    var schema = {
        name: new types.String(),
        email: new types.String({ validate: (email) => { return _.contains(email, '@'); } }),
        admin: new types.Boolean({ default: true })
    };

    TestModel.setSchema(schema);
    TestModel.setDriver( new SimpleDriver() );

    var testInst;
    beforeEach(function()
    {
        // Populate the db
        TestModel.driver.db = {
            test: {
                name: "Test Inst",
                email: "test@foo.com",
                admin: true,
                id: 'test'
            },
            test2: {
                name: "Test Inst 2",
                email: "test2@foo.com",
                admin: false,
                id: 'test2'
            },
            test3: {
                name: "Test Inst 3",
                email: "test3@foo.com",
                admin: false,
                id: 'test3'
            }
        };

        testInst = new TestModel(TestModel.driver.db.test);
        testInst.$dirty = false;
        testInst.$exists = true;
    });

    it('throws an error if a schema has not been set', () =>
    {
        class TestModel2 extends BaseModel {}

        function makeInst()
        {
            return new TestModel2();
        } // end makeInst()

        expect(makeInst).to.throw();
    });

    it('throws an error if a driver has not been set', () =>
    {
        class TestModel3 extends BaseModel {}
        TestModel3.setSchema({});

        function makeInst()
        {
            return new TestModel3();
        } // end makeInst()

        expect(makeInst).to.throw();
     });

    it('creates new instances with `$dirty` equal to `true`', () =>
    {
        var inst = new TestModel();
        expect(inst.$dirty).to.equal(true);
    });

    it('creates new instances with `$exists` equal to `false`', () =>
    {
        var inst = new TestModel();
        expect(inst.$exists).to.equal(false);
    });

    describe('Primary Key', () =>
    {
        it('allows a field to be specified as the primary key', () =>
        {
            class TestModel2 extends BaseModel {}
            TestModel2.setSchema({
                name: new types.String(),
                email: new types.String({ pk: true })
            });

            expect(TestModel2.pk).to.equal('email');
        });

        it('autogenerates an \'id\' field if a primary key field is not specified', () =>
        {
            class TestModel2 extends BaseModel {}
            TestModel2.setSchema({
                name: new types.String(),
                email: new types.String()
            });

            expect(TestModel2.pk).to.equal('id');
        });

        it('has a property $pk, which returns the current value of the primary key', () =>
        {
            expect(testInst.$pk).to.equal('test');
        });

        it('has a property $pk, which sets the value of the primary key, as well as setting `$dirty` to true, and `$exists` to false', () =>
        {
            testInst.$pk = 'foobar';
            expect(testInst.id).to.equal('foobar');
            expect(testInst.$dirty).to.equal(true);
            expect(testInst.$exists).to.equal(false);
        });
    });

    describe('Instance API', () =>
    {
        describe('#$duplicate()', () =>
        {
            it('creates an unsaved clone of the current instance', () =>
            {
                return testInst.$duplicate()
                    .then((inst) =>
                    {
                        expect(inst.id).to.be.undefined;
                        expect(inst.$dirty).to.equal(true);
                        expect(inst.$exists).to.equal(false);
                    });
            });
        });

        describe('#$reload()', () =>
        {
            it('retrieves a fresh copy of the model\'s data from the database', () =>
            {
                TestModel.driver.db.test.name = "Foobar";
                expect(testInst.name).to.equal("Test Inst");

                testInst.$reload()
                    .then(() =>
                    {
                        expect(testInst.name).to.equal("Foobar");
                    });
            });

            it('throws a `DocumentNotFound` error if the id has been deleted', () =>
            {
                expect(testInst.name).to.equal("Test Inst");
                delete TestModel.driver.db.test;

                return testInst.$reload()
                    .then(() =>
                    {
                        expect.fail(null, null, "Did not throw exception.");
                    })
                    .catch((error) =>
                    {
                        expect(error).to.be.instanceOf(errors.DocumentNotFound);
                    });
            });

            it('throws a `MultipleDocuments` error if the id returns multiple documents', () =>
            {
                TestModel.driver.db.multi = [
                    {
                        name: "Test Inst 4",
                        email: "test4@foo.com",
                        admin: false,
                        id: 'test4'
                    },
                    {
                        name: "Test Inst 5",
                        email: "test5@foo.com",
                        admin: false,
                        id: 'test5'
                    }
                ];

                var multiInst = new TestModel({});
                multiInst.$pk = 'multi';
                multiInst.$dirty = false;
                multiInst.$exists = true;

                return multiInst.$reload()
                    .then(() =>
                    {
                        expect.fail(null, null, "Did not throw exception.");
                    })
                    .catch((error) =>
                    {
                        expect(error).to.be.instanceOf(errors.MultipleDocuments);
                    });
            });
        });

        describe('#$validate()', () =>
        {
            it('validates the model', () =>
            {
                //TODO: Probably need to test more things here, but meh. This works for now.
                testInst.$validate()
                    .then((results) =>
                    {
                        expect(results).to.be.true;
                    });
            });

            it('throws a `Validation` error on invalid field values', () =>
            {
                testInst.name = 12345;

                return testInst.$validate()
                    .then(() =>
                    {
                        expect.fail(null, null, "Did not throw exception.");
                    })
                    .catch((error) =>
                    {
                        expect(error).to.be.instanceOf(errors.Validation);
                    });
            });

            it('throws a `CustomValidation` error on invalid field values with custom validators', () =>
            {
                testInst.email = "invalid email";

                return testInst.$validate()
                    .then(() =>
                    {
                        expect.fail(null, null, "Did not throw exception.");
                    })
                    .catch((error) =>
                    {
                        expect(error).to.be.instanceOf(errors.CustomValidation);
                    });
            });
        });

        describe('#$save()', () =>
        {
            it('saves new model instances to the database', () =>
            {
                var inst = new TestModel({
                    name: "New Inst",
                    email: "foo@bar.com",
                    admin: true
                });

                return inst.$save()
                    .then(() =>
                    {
                        expect(TestModel.driver.db[inst.$pk].email).to.equal("foo@bar.com");
                    });
            });

            it('does not allow saving of a model with an invalid field', () =>
            {
                var inst = new TestModel({
                    name: "New Inst",
                    email: "invalid email",
                    admin: true
                });

                return inst.$save()
                    .then(() =>
                    {
                        expect.fail(null, null, "Did not throw exception.");
                    })
                    .catch((error) =>
                    {
                        expect(error).to.be.instanceOf(errors.CustomValidation);
                    });
            });
        });

        describe('#$delete()', () =>
        {
            it('removes the model instance from the database', () =>
            {
                return testInst.$delete()
                    .then(() =>
                    {
                        expect(TestModel.driver.db.test).to.be.undefined;
                    });
            });

            it('throws an error if you attempt to delete a model instance that has not been saved yet', () =>
            {
                var inst = new TestModel({
                    name: "New Inst",
                    email: "foo@bar.com"
                });

                return inst.$delete()
                    .then(() =>
                    {
                        expect.fail(null, null, "Did not throw exception.");
                    })
                    .catch((error) =>
                    {
                        expect(error).to.be.instanceOf(Error);
                    });
            });
        });

        describe('#toJSON()', () =>
        {
            it('converts the model instance into a plain object', () =>
            {
                var jsonObj = testInst.toJSON();
                expect(jsonObj).to.deep.equal(TestModel.driver.db.test);
            });
        });
    });

    describe('Class API', () =>
    {
        describe('#get', () =>
        {
            it('returns a model instance', () =>
            {
                return TestModel.get('test')
                    .then((inst) =>
                    {
                        expect(inst).to.be.instanceOf(TestModel);
                        expect(inst.id).to.equal('test');
                    });
            });

            it('throws a `DocumentNotFound` error if no documents with the id are found', () =>
            {
                return TestModel.get('dne')
                    .then(() =>
                    {
                        expect.fail(null, null, "Did not throw exception.");
                    })
                    .catch((error) =>
                    {
                        expect(error).to.be.instanceOf(errors.DocumentNotFound);
                    });
            });

            it('throws a `MultipleDocuments` error if the id returns multiple documents', () =>
            {
                TestModel.driver.db.multi = [
                    {
                        name: "Test Inst 4",
                        email: "test4@foo.com",
                        admin: false,
                        id: 'test4'
                    },
                    {
                        name: "Test Inst 5",
                        email: "test5@foo.com",
                        admin: false,
                        id: 'test5'
                    }
                ];

                return TestModel.get('multi')
                    .then(() =>
                    {
                        expect.fail(null, null, "Did not throw exception.");
                    })
                    .catch((error) =>
                    {
                        expect(error).to.be.instanceOf(errors.MultipleDocuments);
                    });
            });
        });

        describe('#all()', () =>
        {
            it('returns model instances for all items in the database', () =>
            {
                return TestModel.all()
                    .then((models) =>
                    {
                        expect(models.length).to.equal(3);
                        expect(models[0]).to.be.instanceOf(TestModel);
                    });
            });
        });

        describe('#filter()', () =>
        {
            it('filters the items in the database using a lodash style predicate', () =>
            {
                return TestModel.filter({ admin: false })
                    .then((models) =>
                    {
                        expect(models.length).to.equal(2);
                    });
            });

            it('returns model instances for all returned items', () =>
            {
                return TestModel.filter({ admin: true })
                    .then((models) =>
                    {
                        expect(models[0]).to.be.instanceOf(TestModel);
                    });
            });
        });

        describe('#remove()', () =>
        {
            it('removes items from the database, based on a lodash style predicate', () =>
            {
                return TestModel.remove({ admin: true })
                    .then(() =>
                    {
                        expect(TestModel.driver.db).to.deep.equal({
                            test2: {
                                name: "Test Inst 2",
                                email: "test2@foo.com",
                                admin: false,
                                id: 'test2'
                            },
                            test3: {
                                name: "Test Inst 3",
                                email: "test3@foo.com",
                                admin: false,
                                id: 'test3'
                            }
                        });
                    });
            });
        });

        describe('#removeAll()', () =>
        {
            it('removes all items from the database', () =>
            {
                return TestModel.removeAll()
                    .then(() =>
                    {
                        expect(TestModel.driver.db).to.deep.equal({});
                    });
            });
        });
    });
});

// ---------------------------------------------------------------------------------------------------------------------
