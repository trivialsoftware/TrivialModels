// ---------------------------------------------------------------------------------------------------------------------
// Unit Tests for the types.spec.js module.
//
// @module types.spec.js
// ---------------------------------------------------------------------------------------------------------------------

var _ = require('lodash');
var expect = require('chai').expect;

var types = require('../../src/lib/types').default;
var errors = require('../../src/lib/errors').default;

// ---------------------------------------------------------------------------------------------------------------------

describe('Types', () =>
{
    var inst;
    var BaseType, StringType, NumberType, BooleanType, DateType, ObjectType, ArrayType, AnyType;

    beforeEach(() =>
    {
        BaseType = new types.Base();
        StringType = new types.String();
        NumberType = new types.Number();
        BooleanType = new types.Boolean();
        DateType = new types.Date();
        ObjectType = new types.Object();
        ArrayType = new types.Array();
        AnyType = new types.Any();

        inst = { $values: { test: { foo: 123} } };
    });

    it('has property `$isType` equal to true', () =>
    {
        expect(BaseType.$isType).to.equal(true);
    });

    it('can be converted to a string', () =>
    {
        expect(BaseType.toString()).to.equal('BaseType');
    });

    describe('BaseType', () =>
    {
        it('casts to the string \'BaseType\'', () =>
        {
            expect(BaseType.toString()).to.equal('BaseType');
        });

        describe('#get()', () =>
        {
            it('retrieves the value from the model instance', () =>
            {
                var val = BaseType.get(inst, 'test');

                expect(val).to.deep.equal(inst.$values.test);
            });

            it('returns the default when the value is undefined', () =>
            {
                inst = { $values: { test2: false } };
                var test = { foo: 123 };

                BaseType = new types.Base({ default: test });
                var val = BaseType.get(inst, 'test');
                var val2 = BaseType.get(inst, 'test2');

                expect(val).to.deep.equal(test);
                expect(val2).to.not.deep.equal(test);
            });
        });

        describe('#set()', () =>
        {
            it('sets the value on the model instance', () =>
            {
                var test2 = { foo: 'apples' };
                BaseType.set(inst, 'test2', test2);

                expect(inst.$values.test2).to.equal(test2);
            });

            it('sets the $dirty flag', () =>
            {
                var test2 = { foo: 'apples' };
                BaseType.set(inst, 'test2', test2);

                expect(inst.$dirty).to.equal(true);
            });

        });

        describe('#validate()', () =>
        {
            it('throws a RequiredError if the value is null or undefined, and required', () =>
            {
                BaseType = new types.Base({ required: true });

                // Test undefined
                expect(() => BaseType.validate(inst, 'dne')).to.throw(errors.Required);

                // Test null
                inst.$values.isnull = null;
                expect(() => BaseType.validate(inst, 'isnull')).to.throw(errors.Required);
            });

            it('calls type specific `$validate()` function', () =>
            {
                inst.$values.test2 = 12345;
                BaseType.$validate = (item) => { return _.isString(item); };

                expect(() => BaseType.validate(inst, 'test2')).to.throw(errors.Validation);
            });

            it('supports user defined sanitize functions', () =>
            {
                inst.$values.test2 = 12345;
                BaseType = new types.Base({ sanitize: (item) => { return "" + item; } });
                BaseType.$validate = (item) => { return _.isString(item); };

                expect(BaseType.validate(inst, 'test2')).to.equal(true);
            });

            it('supports user defined validation functions', () =>
            {
                inst.$values.test2 = { admin: true };
                inst.$values.test3 = { admin: false };

                BaseType = new types.Base({ validate: (item) => item.admin });

                expect(BaseType.validate(inst, 'test2')).to.equal(true);
                expect(() => BaseType.validate(inst, 'test3')).to.throw(errors.CustomValidation);
            });
        });
    });

    describe('StringType', () =>
    {
        it('casts to the string \'StringType\'', () =>
        {
            expect(StringType.toString()).to.equal('StringType');
        });

        describe('#validate()', () =>
        {
            it('only validates strings', () =>
            {
                inst.$values = {
                    test: '1234567890',
                    test2: 1234567890
                };

                expect(StringType.validate(inst, 'test')).to.equal(true);
                expect(() => StringType.validate(inst, 'test2')).to.throw(errors.Validation);
            });
        });
    });

    describe('NumberType', () =>
    {
        it('casts to the string \'NumberType\'', () =>
        {
            expect(NumberType.toString()).to.equal('NumberType');
        });

        describe('#validate()', () =>
        {
            it('only validates numbers', () =>
            {
                inst.$values = {
                    test: 1234567890,
                    test2: 12345.67890,
                    test3: '1234567890'
                };

                expect(NumberType.validate(inst, 'test')).to.equal(true);
                expect(NumberType.validate(inst, 'test2')).to.equal(true);
                expect(() => NumberType.validate(inst, 'test3')).to.throw(errors.Validation);
            });
        });
    });

    describe('BooleanType', () =>
    {
        it('casts to the string \'BooleanType\'', () =>
        {
            expect(BooleanType.toString()).to.equal('BooleanType');
        });

        describe('#validate()', () =>
        {
            it('only validates boolean values', () =>
            {
                inst.$values = {
                    test: true,
                    test2: false,
                    test3: 'not a boolean'
                };

                expect(BooleanType.validate(inst, 'test')).to.equal(true);
                expect(BooleanType.validate(inst, 'test2')).to.equal(true);
                expect(() => BooleanType.validate(inst, 'test3')).to.throw(errors.Validation);
            });
        });
    });

    describe('DateType', () =>
    {
        it('casts to the string \'DateType\'', () =>
        {
            expect(DateType.toString()).to.equal('DateType');
        });

        describe('#get', () =>
        {
            it('always returns a Date object', () =>
            {
                inst.$values = {
                    test: new Date(),
                    test2: 1452908075801,
                    test3: 'not a valid date'
                };

                expect(DateType.get(inst, 'test')).to.be.instanceOf(Date);
                expect(DateType.get(inst, 'test2')).to.be.instanceOf(Date);
                expect(DateType.get(inst, 'test3')).to.be.instanceOf(Date);
            });

            it('returns the current timestamp if the `auto` option is set, and no value for the field exists', () =>
            {
                inst.$values = {};
                DateType.options.auto = true;

                expect(DateType.get(inst, 'test')).to.be.instanceOf(Date);
                expect(typeof (DateType.get(inst, 'test').getTime())).to.equal('number');
                expect(Date.now() - DateType.get(inst, 'test').getTime()).to.be.closeTo(0, 1);
            });
        });

        describe('#set', () =>
        {
            it('converts to a timestamp for storage', () =>
            {
                var date = new Date();
                DateType.set(inst, 'test', date);
                expect(inst.$values.test).to.equal(date.getTime());
            });

            it('does not attempt to store an InvalidDate', () =>
            {
                var date = new Date('not a valid date');
                DateType.set(inst, 'test', date);
                expect(inst.$values.test).to.deep.equal({ foo: 123 });
            });
        });

        describe('#validate()', () =>
        {
            it('only validates dates', () =>
            {
                inst.$values = {
                    test: new Date(),
                    test2: 1452908075801,
                    test3: 'not a valid date'
                };

                expect(DateType.validate(inst, 'test')).to.equal(true);
                expect(DateType.validate(inst, 'test2')).to.equal(true);
                expect(() => DateType.validate(inst, 'test3')).to.throw(errors.Validation);
            });
        });
    });

    describe('ObjectType', () =>
    {
        it('casts to the string \'ObjectType\'', () =>
        {
            expect(ObjectType.toString()).to.equal('ObjectType');
        });

        describe('#validate()', () =>
        {
            it('only validates strings', () =>
            {
                inst.$values = {
                    test: {},
                    test2: '1234567890'
                };

                expect(ObjectType.validate(inst, 'test')).to.equal(true);
                expect(() => ObjectType.validate(inst, 'test2')).to.throw(errors.Validation);
            });
        });
    });

    describe('ArrayType', () =>
    {
        it('casts to the string \'ArrayType\'', () =>
        {
            expect(ArrayType.toString()).to.equal('ArrayType');
        });

        describe('#validate()', () =>
        {
            it('only validates arrays', () =>
            {
                inst.$values = {
                    test: [],
                    test2: '1234567890'
                };

                expect(ArrayType.validate(inst, 'test')).to.equal(true);
                expect(() => ArrayType.validate(inst, 'test2')).to.throw(errors.Validation);
            });
        });
    });

    describe('AnyType', () =>
    {
        it('casts to the string \'AnyType\'', () =>
        {
            expect(AnyType.toString()).to.equal('AnyType');
        });

        describe('#validate()', () =>
        {
            it('validates any type', () =>
            {
                inst.$values = {
                    string: 'is string',
                    number: 123456,
                    float: 12.45,
                    bool: false,
                    date: new Date(),
                    object: {},
                    array: []
                };

                expect(AnyType.validate(inst, 'string')).to.equal(true);
                expect(AnyType.validate(inst, 'number')).to.equal(true);
                expect(AnyType.validate(inst, 'float')).to.equal(true);
                expect(AnyType.validate(inst, 'bool')).to.equal(true);
                expect(AnyType.validate(inst, 'date')).to.equal(true);
                expect(AnyType.validate(inst, 'object')).to.equal(true);
                expect(AnyType.validate(inst, 'array')).to.equal(true);
            });
        });
    });
});

// ---------------------------------------------------------------------------------------------------------------------
