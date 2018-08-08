'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const authorSchema = mongoose.Schema({
  firstName: String,
  lastName: String,
  userName:{
    type: String,
    unique:true 
  }
})

const commentSchema = mongoose.Schema({
  content:String
})

const blogPostSchema = mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId, ref: 'Author'
  },
  title: {type: String, required: true},
  content: {type: String},
  created: {type: Date, default: Date.now},
  comments:[commentSchema]
});

blogPostSchema.pre('findOne', function(next){
  this.populate('author');
  next();
});

blogPostSchema.pre('find', function(next){
  this.populate('author');
  next();
});

blogPostSchema.virtual('authorName').get(function() {
  return `${this.author.firstName} ${this.author.lastName}`.trim();
});

blogPostSchema.methods.serialize = function() {
  return {
    id: this._id,
    author: this.authorName,
    content: this.content,
    title: this.title,
    created: this.created,
    comments: this.comments
  };
};

const Author = mongoose.model('Author', authorSchema, 'authors');
const BlogPost = mongoose.model('BlogPost', blogPostSchema, 'blogposts');

module.exports = {Author, BlogPost};
