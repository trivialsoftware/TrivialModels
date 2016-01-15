//----------------------------------------------------------------------------------------------------------------------
/// A trivial example of building a blog with TrivialModels
///
/// @module
//----------------------------------------------------------------------------------------------------------------------

var util = require('util');
var trivialModels = require('../dist/trivialModels');

var SimpleDriver = trivialModels.drivers.SimpleDriver;
var types = trivialModels.types;

//----------------------------------------------------------------------------------------------------------------------
// Define Models
//----------------------------------------------------------------------------------------------------------------------

var Author = trivialModels.define({
    name: 'Author',
    driver: new SimpleDriver(),
    primaryKey: 'email',
    schema: {
        name: types.String(),
        email: types.String(),
        admin: types.Boolean({ default: false })
    }
});

var Post = trivialModels.define({
    name: 'Post',
    driver: new SimpleDriver(),
    schema: {
        title: types.String({ required: true }),
        content: types.String({ required: true }),
        author: types.String({ required: true })
    }
});

//----------------------------------------------------------------------------------------------------------------------

// Populate the database
Author.driver.db = {
    'chris.case@g33xnexus.com': {
        name: 'Chris Case',
        email: 'chris.case@g33xnexus.com',
        admin: true
    },
    'foo@bar.com': {
        name: 'Foo Bar',
        email: 'foo@bar.com',
        admin: true
    }
};

Post.driver.db = {
    '1452637592827': {
        title: "Posts, and the people who post them.",
        content: "Placeholder text. For the future!",
        author: 'chris.case@g33xnexus.com'
    },
    '1452637592837': {
        title: "Oops, I posted again.",
        content: "Go blow it out yer post-hole.",
        author: 'chris.case@g33xnexus.com'
    },
    '1452637592927': {
        title: "This one weird trick to Posting",
        content: "This post intentionally left blank.",
        author: 'foo@bar.com'
    }
};

//----------------------------------------------------------------------------------------------------------------------


Promise.resolve()
    .then(() =>
    {
        console.log('Filter Test:');

        return Post.filter({ author: 'chris.case@g33xnexus.com' })
            .then((results) =>
            {
                console.log("  'chris.case@g33xnexus.com' has %s posts.", results.length);
            })
    })
    .then(() =>
    {
        console.log('Save Test:');

        var post = new Post({
            title: "My Test",
            content: "My battle with writing posts.",
            author: 'chris.case@g33xnexus.com'
        });

        return post.$save()
            .then((post) =>
            {
                console.log('  Created post: %s', util.inspect(post, { colors: true }));
                console.log('  Created post: %s', util.inspect(JSON.stringify(post), { colors: true }));
            });
    });

//----------------------------------------------------------------------------------------------------------------------
