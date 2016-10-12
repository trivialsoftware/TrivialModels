# TrivialModels

TrivialModels is a simple way to define a schema for a javascript objects. You define your model's schema, and Trivial 
Models handles reading/writing it to your backend of choice. It's extensible, supporting both custom types and custom 
backend drivers.

## Use Case

This is primarily designed for a small(ish) amount of data, and simple servers. It works _great_ for electron 
applications as well as anything running a single server. With a more advanced database backing it, TrivialModels has no
issue scaling to multiple workers, but there may better options once you reach that level of need.

One important thing to note: _TrivialModels does not inherently have support for relationships or indexes._ Frankly,
more often than not your relationships are easier to define via how you use your objects then by some hard-coded model
relationship. While it would be nice to support indexes eventually, the use case we are targeting doesn't need that sort
of feature. (And, if you're using either the in-memory driver, or the [trivialdb][] driver, it's blindingly fast, even 
for hundreds of thousands of documents.)

[trivialdb]: https://github.com/trivialsoftware/trivialdb

## Concepts

* **Model**: _This is the generated class instance that holds your schema, and the Trivial Models API. You define these in your code._
* **Driver**: _This holds all of the logic for reading/writing to the database of your choice. You can use either a built in driver, or load one from another module._
* **Type**: _This holds all the special logic for validating and reading/writing a given field type to an intermediate value. These are generally built in, but could be loaded from another module._

## API

### Defining a Model

Defining a model is intentionally very simple:

```javascript
var tm = require('trivialmodels');
var types = tm.types;

// Define a simple model
var Author = tm.define({
    name: 'Author',
    driver: { ... },
    schema: {
        id: types.String({ pk: true }),
        name: types.String(),
        dob: types.Date()
    }
});
```

The only required property is `schema`. However, if you pass `name`, we will generate a new class for you with the 
correct name property. Additionally, if you wish to pick a driver (or pass options), you will want to specify the 
`driver` property.

#### Specifying a driver

* Built in: `'Simple'`, `'TrivialDB'`

When you need to specify a driver, it's simply by setting either a string, an object, or a driver instance as the 
`driver` property. If you need to pass options to one of the built in drivers, it must be an object of the form:

```javascript
{
    name: "TrivialDB",
    options: { ... }
}
```

The options supported by each driver can currently only be found in the code:

* [Simple][] _(does not support options)_
* [TrivialDB][]

[Simple]: https://github.com/trivialsoftware/TrivialModels/blob/master/src/drivers/simpleDriver.js#L14-L16
[TrivialDB]: https://github.com/trivialsoftware/TrivialModels/blob/master/src/drivers/trivialdbDriver.js#L25-L44

#### Types

When you define a schema, you need to specify what type each field is. TrivialModels supports the following basic types:

* String
* Number
* Boolean
* Date
* Object
* Array
* Enum
* Any

In addition, we support the following special types native to objects:

* Properties
* Functions

Any basic type can have options passed to it, and several have their own options for controlling validation and/or 
storage. These details are documented in each type's section below. However, all types support a few basic options:

* **required** - This field is not allowed to be `undefined` or `null` when validating/saving.
* **pk** - This key is the primary key for the model. **_This may only be specified on one field per model._**
* **sanitize** - A function of the form `function(value, modelInstance)` that takes in the value for this field and returns a 'sanitized' version to be stored instead.
* **validate** - A function of the form `function(value, modelInstance)` that takes in the current value for this field and performs validation. It should return `true` or `false`.
* **default** - A default value for this field.

##### String

This represents any valid javascript string. It can be of any length, any encoding.

##### Number

* Options: `integer`: `true` | `false`

This represents any valid javascript number. If `integer` is true, we fail validation if the number is not a valid 
integer.

_Note: If you are using the `TrivialDB` backend, or any other driver that stores as JSON, it should be noted that JSON
encodes `Infinity` and `NaN` as `null`. This is a limitation of the JSON spec._

##### Boolean

This represents a boolean, i.e. `true` or `false`. Any value that is not an instance of `Boolean` will fail validation.
If you want to do any automatic type conversion, use a sanitize function:

```javascript
var model = tm.define({
    schema: {
        boolField: types.Boolean({ sanitize: (val) => !!val })
    }
});
```

The lambda `(val) => !!val` will convert following javascripts [truthy rules][truthy].

[truthy]: https://developer.mozilla.org/en-US/docs/Glossary/Truthy

##### Date

* Options: `auto`: `true` | `false`

This represents a DateTime object. Under the hood, it is converted to a unix timestamp, but when retrieved, it
is returned as a javascript date object. A unix timestamp or a valid date string can be set and it will be
converted when you assign it.

If the `auto` property is true, this will default to the current date/time.

##### Object

* Options: `schema`: `{ ... }`

Supports a plain javascript object. If the `schema` option is passed, it will perform type validation as if it were a 
model. This is, effectively, an implementation of _nested documents_. Example:

```javascript
var model = tm.define({
    schema: {
        nested: types.Object({
            schema: {
                name: types.String({ required: true }),
                isFoo: types.Boolean({ default: false })
            }
        })
    }
});
```

##### Array

* Options: `type`: Any valid TrivialModels type

This represents an array of values. The values can be any valid javascript types. If the `type` option is passed, then
it will perform validation that all the items stored inside the array are of the specified type.

_Note: Individual driver may impose limitations on what chan be stored. For example, the `TrivialDB` driver cannot save 
functions or complex objects. It is limited to JSON types._

##### Enum

* Options: `values`: Any valid javascript type

This represents a field that can only be one of the specified possible values. These values are typically strings, but
can by any valid javascript type. The values are compared using the `SameValueZero` algorithm (the same as `===`). _(See 
[this][] document for details.)_

[this]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness

##### Any

This can store any valid javascript type, and performs no validation. If `required` is true, it cannot be `undefined` or
`null`. That is the only limitation on it's value.

_Note: Individual driver may impose limitations on what chan be stored. For example, the `TrivialDB` driver cannot save 
functions or complex objects. It is limited to JSON types._

##### Properties

Properties are supported via the standard getter/setter syntax on objects:

```javascript
var tm = require('trivialmodels');
var types = tm.types;

// Define a simple model
var Foo = tm.define({
    schema: {
        id: types.String({ pk: true }),
        firstName: types.String(),
        lastName: types.String(),
        
        // This is a standard javascript property with both a getter and a setter
        get name()
        {
            return `${ this.firstName } ${ this.lastName }`;
        },
        set name(val)
        {
            var parts = val.split(' ');
            this.firstName = parts[0];
            this.lastName = parts[1];
        }
    }
});

// Create a new instance
var inst = new Foo({ firstName: 'John', lastName: 'Smith' });

// Returns 'John Smith'
console.log(inst.name);

// Set the name
inst.name = 'John Snow';

// Returns 'Snow'
console.log(inst.lastName);
```

It is important to note two things: First, the getter/setter objects have access to `this`. Secondly, all getters will 
appear in the output of `JSON.stringify`. So please be aware that a serialized model will include all properties defined 
on it's schema.

##### Functions

Functions are supported vial the standard function syntax on objects:

```javascript
var tm = require('trivialmodels');
var types = tm.types;

// Define a simple model
var Foo = tm.define({
    schema: {
        id: types.String({ pk: true }),
        firstName: types.String(),
        lastName: types.String(),
        
        // This is a standard javascript function
        getName()
        {
            return `${ this.firstName } ${ this.lastName }`;
        } // end getName
    }
});

// Create a new instance
var inst = new Foo({ firstName: 'John', lastName: 'Smith' });

// Returns 'John Smith'
console.log(inst.getName());
```

Functions have access to `this`, but they are _not_ included in the output of `JSON.stringify`.

It is rather easy to include logic in your models simply by including function and treating the model as if it were a 
class (it is, actually). This allows you to build smarter models without the need to wrap them in a more traditional 
class.

#### Primary Keys

Primary key generation is handled by the underlying driver. Only one field on a model can be marked as the primary key,
and if one is not specified, an `id` key (string) will be automatically added. If you are unsure what field is the 
primary key, you can check the `pk` property on the model class _(**class**, not instance)_.

If you want the _value_ of the primary key, you can use the `$pk` property on a model instance _(**instance**, not 
class)_.

To mark a field as the primary key, simply set `pk: true` in the options for the field. Example:

```javascript
var tm = require('trivialmodels');
var types = tm.types;

// Define a simple model
var Foo = tm.define({
    schema: {
        fooID: types.Number({ pk: true }),
    }
});

// Returns 'fooID'
console.log(Foo.pk);

// Create a new instance
var inst = new Foo({ fooID: 3 });

// Returns '3'
console.log(inst.$pk);
```

### Model API

TBD.

### Instance API

TBD.
