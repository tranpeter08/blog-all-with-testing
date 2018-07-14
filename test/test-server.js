'use strict';

const chai = require('chai');
const chaiHTTP = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const expect = chai.expect;

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHTTP);

function seedBlogPostData(){
    console.info('seeding Blog Post data');
    let seedData = [];

    for(let i= 0;i <=10; i++){
        seedData.push(generateBlogPostData());
    }
    
    return BlogPost.insertMany(seedData);
};


function generateBlogPostData(){
    return {
        title: faker.lorem.words(),
        author: {
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName()
        },
        content: faker.lorem.paragraph(),
        created: faker.date.future(),
        
    }
};

function tearDownDataBase(){
    console.warn('Tearing down database');
    return mongoose.connection.dropDatabase();
}

describe('Blog Post API function', function(){

    before(function(){
        return runServer(TEST_DATABASE_URL);
    });

    beforeEach(function(){
        return seedBlogPostData();
    });

    afterEach(function(){
        return tearDownDataBase();
    });

    after(function(){
        return closeServer();
    });

    describe("GET endpoint", function(){
        it('should get all blog posts',function(){

            let res;

            return chai.request(app)
            .get('/posts')
            .then(function(_res){
                res = _res;
                expect(res).to.have.status(200);
                expect(res.body).to.have.lengthOf.at.least(1)
                return BlogPost.count();
            })
            .then(function(count){
                expect(res.body).to.have.lengthOf(count);
            });
        });
    
        it("should return blogpost with the right fields", function(){
            
            let resBlogPost;
    
            return chai.request(app)
            .get('/posts')
            .then(function(res){
                //make sure we get some results
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.an('array');
                expect(res.body).to.have.lengthOf.at.least(1);
    
                res.body.forEach(function(post){
                    expect(post).to.be.an('object');
                    expect(post).to.include.keys("id","title","author","content", "created");
                });
                resBlogPost = res.body[0];
                return BlogPost.findById(resBlogPost.id);
                //test for keys
            })
            .then(function(post){
                expect(resBlogPost.id).to.equal(post.id);
                expect(resBlogPost.title).to.equal(post.title);
                expect(resBlogPost.content).to.equal(post.content);
                expect(resBlogPost.author).to.equal(`${post.author.firstName} ${post.author.lastName}`);
            });
        });
    });

    describe("POST endpoint", function(){
        it('should create a new post', function(){
            const newPost = generateBlogPostData();
    
            return chai.request(app)
                .post('/posts')
                .send(newPost)
                .then(function(res){
                    expect(res).to.have.status(201);
                    expect(res).to.be.json;
                    expect(res.body).to.be.an('object');
                    expect(res.body).to.include.keys(
                        "id", "title", "content", "author", "created");
                    expect(res.body.id).to.not.be.null;
                    expect(res.body.title).to.equal(newPost.title);
                    expect(res.body.content).to.equal(newPost.content);
                    expect(res.body.author).to.equal(`${newPost.author.firstName} ${newPost.author.lastName}`);
                    return BlogPost.findById(res.body.id);
                })
                .then(function(aPost){
                    expect(aPost.title).to.equal(newPost.title);
                    expect(aPost.content).to.equal(newPost.content);
                    expect(aPost.author.firstName).to.equal(newPost.author.firstName);
                    expect(aPost.author.lastName).to.equal(newPost.author.lastName);
                });
        });
    });

    describe("PUT endpoint",function(){
        it('should update an existing post', function(){
            const updatePost = {
                    author: {firstName: 'Ryan',lastName: 'Chandling'},
                    content: 'oops'
            };

            return BlogPost
            .findOne()
            .then(function(aPost){
                updatePost.id = aPost.id;

                return chai.request(app)
                .put(`/posts/${aPost.id}`)
                .send(updatePost);
            })
            .then(function(res){
                expect(res).to.have.status(204);
                return BlogPost.findById(updatePost.id);
            })
            .then(function(aPost){
                expect(`${aPost.author.firstName} ${aPost.author.lastName}`).to.equal(`${updatePost.author.firstName} ${updatePost.author.lastName}`);
                expect(aPost.content).to.equal(updatePost.content);
            });
        });
        
    });

    describe('DELETE enpoint', function(){
        it('should delete a post by ID', function(){
            
            let blogPost;

            return BlogPost
            .findOne()
            .then(function(aPost){
                blogPost = aPost;
                return chai
                .request(app)
                .delete(`/posts/${aPost.id}`);
            })
            .then(function(res){
                expect(res).to.have.status(204);
                return BlogPost.findById(blogPost.id);
            })
            .then(function(aPost){
                expect(aPost).to.be.null;
            });
        });
    });





});




